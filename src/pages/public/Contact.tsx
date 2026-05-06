import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2, Star } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    rating: 5,
    text: ''
  });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [settings, setSettings] = useState({
    phone: '+233 50 000 0000',
    email: 'hello@kamaralakeview.com',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'appearance'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          phone: data.phone || '+233 50 000 0000',
          email: data.email || 'hello@kamaralakeview.com',
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/appearance');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'unread'
      });
      setSubmitted(true);
      toast.success('Message sent! Our team will contact you soon.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.text) {
      toast.error('Please provide your name and review text');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        ...reviewForm,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setReviewSubmitted(true);
      toast.success('Your review has been submitted for moderation. Thank you!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setLoading(false);
    }
  };

  const whatsappPhone = settings.phone.replace(/[^0-9]/g, '');

  return (
    <div className="pt-32 pb-24 bg-luxury-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-brand-dark uppercase tracking-[0.4em] text-xs font-bold mb-4 block">Contact</span>
            <h1 className="font-display text-4xl md:text-6xl text-brand-dark mb-8 leading-tight">
              Get in <span className="italic">Touch</span>
            </h1>
            <p className="text-gray-600 font-light leading-relaxed mb-12">
              Whether you have a question about our rooms, want to book an event, or just want to 
              say hello, our team is here to assist you 24/7.
            </p>

            <div className="space-y-8">
              <div className="flex gap-6 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center luxury-shadow group-hover:bg-brand-dark transition-colors">
                  <MapPin className="w-5 h-5 text-brand-dark group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="font-display text-lg text-brand-dark mb-1">Our Location</h4>
                  <p className="text-gray-500 text-sm">Bamahu, Wa, Upper West Region, Ghana</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center luxury-shadow group-hover:bg-brand-dark transition-colors">
                  <Phone className="w-5 h-5 text-brand-dark group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="font-display text-lg text-brand-dark mb-1">Reservation Desk</h4>
                  <p className="text-gray-500 text-sm">{settings.phone}</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center luxury-shadow group-hover:bg-brand-dark transition-colors">
                  <Mail className="w-5 h-5 text-brand-dark group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="font-display text-lg text-brand-dark mb-1">Email Us</h4>
                  <p className="text-gray-500 text-sm">{settings.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <a 
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-all rounded-sm shadow-lg"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Us
              </a>
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 md:p-12 luxury-shadow relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-20 h-20 bg-brand-light/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-brand-dark" />
                  </div>
                  <h3 className="font-display text-3xl text-brand-dark mb-4">Message Received</h3>
                  <p className="text-gray-500 font-light leading-relaxed mb-8">
                    Thank you for reaching out, {formData.name.split(' ')[0]}. We've successfully logged your inquiry and a hospitality manager will respond to <strong>{formData.email}</strong> shortly.
                  </p>
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="text-brand-dark text-xs uppercase tracking-[0.2em] font-bold border-b border-brand-dark pb-1 hover:text-brand-light hover:border-brand-light transition-all"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0, y: -20 }}>
                  <h3 className="font-display text-2xl text-brand-dark mb-8">Send a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Your Name</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                          placeholder="John Doe" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                          placeholder="john@example.com" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Subject</label>
                      <input 
                        type="text" 
                        value={formData.subject}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                        placeholder="General Inquiry" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Message</label>
                      <textarea 
                        rows={4} 
                        required
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm resize-none" 
                        placeholder="How can we help you?" 
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-dark text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-brand-light transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? 'Transmitting...' : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Review Section */}
        <div className="mt-32 border-t border-gray-100 pt-32">
          <div className="bg-white p-8 md:p-16 luxury-shadow relative overflow-hidden max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-brand-light uppercase tracking-[0.4em] text-[10px] font-bold mb-4 block">Feedback</span>
              <h2 className="font-display text-4xl text-brand-dark mb-4">Share Your <span className="italic">Experience</span></h2>
              <p className="text-gray-500 font-light text-sm max-w-lg mx-auto">
                Your feedback helps us maintain the highest standards of hospitality. 
                Submit a review about your recent stay at Kamara Lakeview.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {reviewSubmitted ? (
                <motion.div
                  key="review-success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Star className="w-12 h-12 text-brand-light fill-brand-light mx-auto mb-6 animate-bounce" />
                  <h3 className="font-display text-2xl text-brand-dark mb-4">Gratitude for Your Feedback</h3>
                  <p className="text-gray-500 font-light mb-8">
                    Our team has received your review. Once approved for authenticity, it will shine on our wall of testimonials.
                  </p>
                  <button 
                    onClick={() => {
                      setReviewSubmitted(false);
                      setReviewForm({ name: '', rating: 5, text: '' });
                    }}
                    className="text-brand-dark text-xs uppercase tracking-widest font-bold border-b border-brand-dark pb-1"
                  >
                    Write another review
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  key="review-form"
                  onSubmit={handleReviewSubmit}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={reviewForm.name}
                        onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                        placeholder="Jane Doe" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Rating</label>
                      <div className="flex gap-2 py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star 
                              className={`w-6 h-6 ${star <= reviewForm.rating ? 'text-brand-light fill-brand-light' : 'text-gray-200'}`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Your Perspective</label>
                    <textarea 
                      rows={4} 
                      required
                      value={reviewForm.text}
                      onChange={e => setReviewForm({ ...reviewForm, text: e.target.value })}
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm resize-none italic" 
                      placeholder="Was your stay as tranquil as we intended?" 
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-dark text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-brand-light transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Perspective'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Map Integration (Placeholder) */}
        <div className="mt-24 h-[400px] w-full bg-gray-200 grayscale rounded-sm overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/5">
            <div className="text-center">
              <MapPin className="w-10 h-10 text-brand-dark mx-auto mb-4" />
              <p className="font-display text-xl text-brand-dark">Wa, Upper West Region, Ghana</p>
              <p className="text-sm text-gray-500 uppercase tracking-widest mt-2">Find us in Bamahu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
