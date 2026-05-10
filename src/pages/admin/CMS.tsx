import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { 
  Save, Image as ImageIcon, Type, Globe, Layout, Check, 
  Palette, Upload, Loader2, Trash2, Plus, TrendingUp, 
  BarChart4, DollarSign, Calendar, MessageSquare, Utensils, Star,
  CheckCircle2, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  doc, getDoc, setDoc, serverTimestamp, collection, 
  onSnapshot, query, orderBy, deleteDoc, addDoc, getDocs 
} from 'firebase/firestore';

const CMS = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState<any>({
    hotelName: 'Kamara Lakeview Hotel',
    metaDescription: 'Premium luxury hotel website and hospitality management system for Kamara Lakeview Hotel in Wa, Ghana.',
    phone: '+233 50 000 0000',
    email: 'hello@kamaralakeview.com',
    tagline: 'Experience Comfort. Embrace Tranquility.',
    secondaryHeader: 'Welcome to Kamara Lakeview Hotel, where luxury meets serene beauty in the heart of Wa.',
    heroImages: ['/main-homepage-1.png', '/main-homepage-2.png']
  });

  const [gallery, setGallery] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalMessages: 0,
    totalReservations: 0,
    roomCount: 0
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'appearance');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        console.warn('Could not fetch settings, using defaults');
      } finally {
        setFetching(false);
      }
    };

    // Gallery listener
    const unsubscribeGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to handle local serverTimestamp latency better
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setGallery(docs);
    });

    // Reviews listener
    const unsubscribeReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setReviews(docs);
    });

    fetchContent();
    return () => {
      unsubscribeGallery();
      unsubscribeReviews();
    };
  }, []);

  const handleReviewAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await setDoc(doc(db, 'reviews', id), { status }, { merge: true });
      toast.success(`Review ${status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${id}`);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Permanently delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      toast.success('Review deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${id}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'Analytics') {
      const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
          const [bookingsSnap, messagesSnap, roomsSnap, resSnap] = await Promise.all([
            getDocs(collection(db, 'bookings')),
            getDocs(collection(db, 'messages')),
            getDocs(collection(db, 'rooms')),
            getDocs(collection(db, 'reservations'))
          ]);

          const bookings = bookingsSnap.docs.map(d => d.data());
          const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

          setStats({
            totalBookings: bookingsSnap.size,
            totalRevenue,
            totalMessages: messagesSnap.size,
            totalReservations: resSnap.size,
            roomCount: roomsSnap.size
          });
        } catch (err) {
          console.error('Analytics error:', err);
        } finally {
          setAnalyticsLoading(false);
        }
      };
      fetchAnalytics();
    }
  }, [activeTab]);

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'appearance'), {
        ...content,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success('Website content updated successfully');
    } catch (err) {
      console.error('Save error:', err);
      handleFirestoreError(err, OperationType.UPDATE, 'settings/appearance');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB for browser optimization');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...(content.heroImages || [])];
      newImages[index] = reader.result as string;
      setContent((prev: any) => ({ ...prev, heroImages: newImages }));
      toast.success(`${index === 0 ? 'Main' : 'Alternative'} hero image staged`);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Firestore limit is 1MB, Base64 adds ~33% overhead. 750KB is safe for Base64 storage.
      if (file.size > 750 * 1024) {
        toast.error(`${file.name} is too large (>750KB). Skipping.`);
        failCount++;
        continue;
      }

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = reader.result as string;
            await addDoc(collection(db, 'gallery'), {
              url: base64,
              caption: file.name,
              category: 'General',
              createdAt: serverTimestamp()
            });
            successCount++;
          } catch (err) {
            console.error(`Upload error for ${file.name}:`, err);
            failCount++;
          }
          resolve();
        };
        reader.onerror = () => {
          failCount++;
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} image(s) to gallery`);
    }
    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} image(s)`);
    }

    setLoading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery image?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      toast.success('Image removed from gallery');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `gallery/${id}`);
    }
  };

  const tabs = [
    { id: 'General', icon: Globe },
    { id: 'Homepage', icon: Layout },
    { id: 'Gallery', icon: ImageIcon },
    { id: 'Reviews', icon: Star },
    { id: 'Analytics', icon: BarChart4 },
    { id: 'Visuals', icon: Palette },
    { id: 'Hero media', icon: ImageIcon },
  ];

  if (fetching) {
    return (
      <div className="flex bg-luxury-cream min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-luxury-cream min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 pt-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-display text-4xl text-brand-dark mb-2">Platform Customization</h1>
            <p className="text-gray-500 text-sm font-light">Control the public-facing narrative and visual identity of Kamara Lakeview.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-brand-dark text-white px-10 py-4 text-xs uppercase tracking-widest font-bold shadow-soft hover:bg-brand-light transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Propagating Changes...' : 'Save & Publish'}
          </button>
        </div>

        <div className="flex gap-12">
          {/* Navigation */}
          <div className="w-64 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-all text-xs uppercase tracking-widest font-black ${
                  activeTab === tab.id 
                    ? 'bg-white text-brand-dark border-l-4 border-brand-light shadow-sm' 
                    : 'text-gray-400 hover:text-brand-dark'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.id}
              </button>
            ))}
          </div>

          <input 
            type="file" 
            ref={galleryInputRef} 
            className="hidden" 
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
          />

          {/* Content Editor */}
          <div className="flex-1 bg-white p-12 luxury-shadow min-h-[600px]">
            {activeTab === 'General' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="border-b border-gray-100 pb-2 flex items-center gap-3">
                  <Type className="w-4 h-4 text-brand-light" />
                  <h3 className="font-display text-2xl text-brand-dark">Brand Narrative</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Hotel Name</label>
                    <input 
                      type="text" 
                      value={content.hotelName || ''}
                      onChange={e => setContent(prev => ({...prev, hotelName: e.target.value}))}
                      placeholder="e.g. Kamara Lakeview Hotel"
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Meta Description</label>
                    <textarea 
                      rows={3} 
                      value={content.metaDescription || ''}
                      onChange={e => setContent(prev => ({...prev, metaDescription: e.target.value}))}
                      placeholder="SEO description for search engines..."
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm resize-none leading-relaxed" 
                    />
                  </div>
                </div>

                <div className="pt-10">
                  <div className="border-b border-gray-100 pb-2 flex items-center gap-3 mb-8">
                    <Check className="w-4 h-4 text-brand-light" />
                    <h3 className="font-display text-2xl text-brand-dark">Contact Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Front Desk Phone</label>
                      <input 
                        type="text" 
                        value={content.phone || ''}
                        onChange={e => setContent(prev => ({...prev, phone: e.target.value}))}
                        placeholder="+233..."
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">General Email</label>
                      <input 
                        type="email" 
                        value={content.email || ''}
                        onChange={e => setContent(prev => ({...prev, email: e.target.value}))}
                        placeholder="hello@..."
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                      />
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <button 
                      onClick={() => handleSave()}
                      disabled={loading}
                      className="bg-brand-dark/5 text-brand-dark px-6 py-3 text-[10px] uppercase tracking-widest font-bold border border-brand-dark/10 hover:bg-brand-dark hover:text-white transition-all flex items-center gap-2 group disabled:opacity-50"
                    >
                      <Save className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      {loading ? 'Saving...' : 'Save Narrative Changes'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Homepage' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="border-b border-gray-100 pb-2 mb-8 flex items-center gap-3">
                  <Layout className="w-4 h-4 text-brand-light" />
                  <h3 className="font-display text-2xl text-brand-dark">Homepage Configuration</h3>
                </div>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Primary Tagline</label>
                    <input 
                      type="text" 
                      value={content.tagline}
                      onChange={e => setContent({...content, tagline: e.target.value})}
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-xl font-display italic" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Secondary Header</label>
                    <textarea 
                      rows={2} 
                      value={content.secondaryHeader}
                      onChange={e => setContent({...content, secondaryHeader: e.target.value})}
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm leading-relaxed" 
                    />
                  </div>
                  
                  <div className="pt-6 flex justify-start">
                    <button 
                      onClick={() => handleSave()}
                      disabled={loading}
                      className="bg-brand-dark/5 text-brand-dark px-6 py-3 text-[10px] uppercase tracking-widest font-bold border border-brand-dark/10 hover:bg-brand-dark hover:text-white transition-all flex items-center gap-2 group disabled:opacity-50"
                    >
                      <Save className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      {loading ? 'Saving...' : 'Save Homepage Content'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Gallery' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-4 h-4 text-brand-light" />
                    <h3 className="font-display text-2xl text-brand-dark">Gallery Management</h3>
                  </div>
                  <button 
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex items-center gap-2 bg-brand-light text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-brand-dark transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    Upload Image
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {gallery.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100">
                      <p className="text-gray-400 text-sm font-light italic">No gallery images uploaded yet.</p>
                    </div>
                  ) : gallery.map((item) => (
                    <div key={item.id} className="relative aspect-square border border-gray-100 group overflow-hidden bg-gray-50">
                      <img src={item.url} alt={item.caption} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => handleDeleteGallery(item.id)}
                          className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-brand-light" />
                    <h3 className="font-display text-2xl text-brand-dark">Guest Review Moderation</h3>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      {reviews.filter(r => r.status === 'pending').length} Pending
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-brand-light font-bold">
                      {reviews.filter(r => r.status === 'approved').length} Approved
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 italic text-gray-300">
                      No reviews submitted through the platform yet.
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div 
                        key={review.id} 
                        className={`p-8 luxury-shadow border-l-4 transition-all ${
                          review.status === 'approved' ? 'border-green-500 bg-white' : 
                          review.status === 'rejected' ? 'border-red-500 bg-gray-50' : 
                          'border-yellow-500 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-brand-dark flex items-center gap-2">
                              {review.name}
                              <span className="text-gray-300 text-[10px] font-mono">
                                {review.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                              </span>
                            </h4>
                            <div className="flex gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 ${i < (review.rating || 0) ? 'text-brand-light fill-brand-light' : 'text-gray-200'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {review.status !== 'approved' && (
                              <button 
                                onClick={() => handleReviewAction(review.id, 'approved')}
                                className="p-2 text-gray-300 hover:text-green-500 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {review.status !== 'rejected' && (
                              <button 
                                onClick={() => handleReviewAction(review.id, 'rejected')}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteReview(review.id)}
                              className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed italic">
                          "{review.text}"
                        </p>
                        <div className="mt-4 flex items-center justify-end">
                          <span className={`text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${
                            review.status === 'approved' ? 'bg-green-100 text-green-700' :
                            review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {review.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'Analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="border-b border-gray-100 pb-2 flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-brand-light" />
                  <h3 className="font-display text-2xl text-brand-dark">Performance Analytics</h3>
                </div>

                {analyticsLoading ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-luxury-cream p-8 border-l-4 border-brand-light flex flex-col justify-between">
                        <DollarSign className="w-8 h-8 text-brand-light mb-4" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Revenue</p>
                          <p className="text-3xl font-display text-brand-dark">GHS {stats.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-luxury-cream p-8 border-l-4 border-brand-light flex flex-col justify-between">
                        <Calendar className="w-8 h-8 text-brand-light mb-4" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Bookings</p>
                          <p className="text-3xl font-display text-brand-dark">{stats.totalBookings}</p>
                        </div>
                      </div>
                      <div className="bg-luxury-cream p-8 border-l-4 border-brand-light flex flex-col justify-between">
                        <MessageSquare className="w-8 h-8 text-brand-light mb-4" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Guest Inquiries</p>
                          <p className="text-3xl font-display text-brand-dark">{stats.totalMessages}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 border border-gray-100 rounded-sm space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Utensils className="w-5 h-5 text-brand-light" />
                          <h4 className="font-semibold text-brand-dark">Restaurant Performance</h4>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Table Reservations</p>
                            <p className="text-2xl font-display text-brand-dark">{stats.totalReservations}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Active Demand
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 border border-gray-100 rounded-sm space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Layout className="w-5 h-5 text-brand-light" />
                          <h4 className="font-semibold text-brand-dark">Inventory Health</h4>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Configured Rooms</p>
                            <p className="text-2xl font-display text-brand-dark">{stats.roomCount}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                              Asset Capacity
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'Visuals' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="border-b border-gray-100 pb-2 flex items-center gap-3">
                  <Palette className="w-4 h-4 text-brand-light" />
                  <h3 className="font-display text-2xl text-brand-dark">Visual Identity</h3>
                </div>

                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest text-brand-dark font-black">Color Palette</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                        <span className="text-xs font-bold uppercase tracking-widest">Brand Dark</span>
                        <div className="w-6 h-6 bg-[#1A1A1A] border border-white luxury-shadow" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                        <span className="text-xs font-bold uppercase tracking-widest">Brand Light</span>
                        <div className="w-6 h-6 bg-[#C5A059] border border-white luxury-shadow" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                        <span className="text-xs font-bold uppercase tracking-widest">Luxury Cream</span>
                        <div className="w-6 h-6 bg-[#F9F6F0] border border-white luxury-shadow" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest text-brand-dark font-black">Typography Settings</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Display Font</label>
                        <select className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm bg-transparent">
                          <option>Playfair Display</option>
                          <option>Cormorant Garamond</option>
                          <option>Outfit</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Interface Font</label>
                        <select className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm bg-transparent">
                          <option>Inter</option>
                          <option>Plus Jakarta Sans</option>
                          <option>Montserrat</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 flex justify-start">
                    <button 
                      onClick={() => handleSave()}
                      disabled={loading}
                      className="bg-brand-dark/5 text-brand-dark px-6 py-3 text-[10px] uppercase tracking-widest font-bold border border-brand-dark/10 hover:bg-brand-dark hover:text-white transition-all flex items-center gap-2 group disabled:opacity-50"
                    >
                      <Save className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      {loading ? 'Saving...' : 'Save Visual Changes'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Hero media' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="border-b border-gray-100 pb-2 flex items-center gap-3">
                  <ImageIcon className="w-4 h-4 text-brand-light" />
                  <h3 className="font-display text-2xl text-brand-dark">Aesthetic Assets</h3>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Main Hero Image</label>
                      <div className="aspect-[16/9] bg-gray-100 relative group overflow-hidden border border-dashed border-gray-300">
                        <img 
                          src={content.heroImages?.[0] || content.heroImage || '/main-homepage-1.png'} 
                          className="w-full h-full object-cover group-hover:opacity-50 transition-all" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-brand-dark/20 backdrop-blur-[2px]">
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e: any) => handleImageUpload(0)(e);
                              input.click();
                            }}
                            className="bg-white text-brand-dark px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                          >
                            <Upload className="w-3 h-3" />
                            Replace Asset
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Alternative Hero</label>
                      <div className="aspect-[16/9] bg-gray-100 relative group overflow-hidden border border-dashed border-gray-300">
                        {content.heroImages?.[1] ? (
                          <>
                            <img 
                              src={content.heroImages[1]} 
                              className="w-full h-full object-cover group-hover:opacity-50 transition-all" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-brand-dark/20 backdrop-blur-[2px]">
                              <button 
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e: any) => handleImageUpload(1)(e);
                                  input.click();
                                }}
                                className="bg-white text-brand-dark px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                              >
                                <Upload className="w-3 h-3" />
                                Replace Asset
                              </button>
                            </div>
                          </>
                        ) : (
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e: any) => handleImageUpload(1)(e);
                              input.click();
                            }}
                            className="flex flex-col items-center gap-2 text-gray-400 hover:text-brand-dark transition-all"
                          >
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Upload Media</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-dark/5 p-6 border-l-4 border-brand-light flex justify-between items-center">
                    <p className="text-xs text-brand-dark font-medium leading-relaxed italic">
                      "Media updates will reflect across the destination landing page and room booking previews. Suggest using high-resolution RAW files for maximum fidelity."
                    </p>
                    <button 
                      onClick={() => handleSave()}
                      disabled={loading}
                      className="bg-brand-dark text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-brand-light transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      {loading ? 'Publishing...' : 'Publish Media'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CMS;
