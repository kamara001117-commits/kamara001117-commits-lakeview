import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Coffee, Wine, Clock, X, CheckCircle2, Calendar, Users } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const categories = [
  { id: 'Breakfast', icon: Coffee, desc: 'Fresh local fruits, pastries, and traditional Ghanaian breakfast.' },
  { id: 'Lunch', icon: Utensils, desc: 'Savory soups, grilled fish, and continental classics.' },
  { id: 'Dinner', icon: Utensils, desc: 'Sophisticated gourmet experiences with lakeview ambiance.' },
  { id: 'Drinks', icon: Wine, desc: 'Premium wines, cocktails, and fresh tropical juices.' },
];

const Dining = () => {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: '2'
  });

  useEffect(() => {
    const q = query(collection(db, 'menu_items'), orderBy('category', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menu_items');
    });

    return () => unsubscribe();
  }, []);

  const handleReserve = async (e: FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      await addDoc(collection(db, 'reservations'), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setBookingSuccess(true);
      toast.success('Reservation request sent!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reservations');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-luxury-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand-dark uppercase tracking-[0.4em] text-xs font-bold mb-4 block">Fine Dining</span>
            <h1 className="font-display text-4xl md:text-6xl text-brand-dark mb-6 leading-tight">
              A Culinary Journey of <span className="italic">Flavors</span>
            </h1>
            <p className="text-gray-600 font-light leading-relaxed mb-8">
              Indulge in a sensory experience at our signature restaurant. From tradition-rich 
              Ghanaian delicacies to contemporary international cuisine, every dish is prepared 
              with the freshest local ingredients and a touch of luxury.
            </p>
            <div className="flex items-center gap-4 text-brand-dark">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Open Daily: 06:30 AM — 10:30 PM</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-2xl h-[500px]"
          >
            <img 
              src="/main-homepage-2.png" 
              alt="Restaurant Interior" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-32">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 luxury-shadow text-center group hover:bg-brand-dark transition-all duration-500"
            >
              <cat.icon className="w-10 h-10 text-brand-light mx-auto mb-6 group-hover:text-white transition-colors" />
              <h3 className="font-display text-xl mb-3 group-hover:text-white transition-colors">{cat.id}</h3>
              <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">{cat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Menu Preview */}
        <div className="bg-white p-12 md:p-20 luxury-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-light/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-5xl text-brand-dark text-center mb-16 underline underline-offset-[20px] decoration-brand-light/30">
              Menu Highlights
            </h2>
            
            {loading ? (
              <div className="text-center py-10 italic text-gray-400">Curating today's flavors...</div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-light">The kitchen is preparing new delights. Please check back soon.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                {menuItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                      <h4 className="font-medium text-brand-dark text-lg">{item.name}</h4>
                      <span className="h-[1px] flex-grow mx-4 bg-gray-100 hidden md:block" />
                      <span className="text-brand-light font-display">GHS {item.price}</span>
                    </div>
                    <p className="text-gray-500 text-sm font-light italic">{item.description || item.desc}</p>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="text-center mt-20">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-12 py-4 bg-brand-dark text-white uppercase tracking-[0.2em] text-xs font-bold hover:bg-brand-light transition-all shadow-xl"
              >
                Reserve a Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md"
              onClick={() => {
                setIsModalOpen(false);
                setBookingSuccess(false);
              }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-xl shadow-2xl p-8 md:p-12"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-display text-3xl text-brand-dark">Table Reservation</h3>
                <X 
                  className="w-6 h-6 cursor-pointer text-gray-400 hover:text-brand-dark" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setBookingSuccess(false);
                  }} 
                />
              </div>

              {bookingSuccess ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="font-display text-2xl text-brand-dark mb-2">Reservation Confirmed</h4>
                  <p className="text-gray-500 text-sm mb-8">Thank you, {formData.name.split(' ')[0]}. Your table is reserved.</p>
                  
                  <div className="bg-luxury-cream p-6 rounded-sm mb-8 text-left space-y-4 border border-gray-100">
                    <div className="flex justify-between items-center border-b border-gray-200/50 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Guest Name</span>
                      <span className="text-sm font-semibold text-brand-dark">{formData.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Date</span>
                        <div className="flex items-center gap-2 text-sm text-brand-dark font-semibold">
                          <Calendar className="w-3 h-3 text-brand-light" />
                          {new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Time</span>
                        <div className="flex items-center gap-2 text-sm text-brand-dark font-semibold">
                          <Clock className="w-3 h-3 text-brand-light" />
                          {formData.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Party Size</span>
                      <div className="flex items-center gap-2 text-sm text-brand-dark font-semibold">
                        <Users className="w-3 h-3 text-brand-light" />
                        {formData.guests} {parseInt(formData.guests) === 1 ? 'Guest' : 'Guests'}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setBookingSuccess(false);
                      setFormData({ name: '', email: '', phone: '', date: '', time: '', guests: '2' });
                    }}
                    className="w-full bg-brand-dark text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-brand-light transition-all rounded-sm shadow-lg"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReserve} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-light text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Guests</label>
                      <select 
                        value={formData.guests}
                        onChange={e => setFormData({...formData, guests: e.target.value})}
                        className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-light text-sm bg-transparent"
                      >
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Guests</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Date</label>
                      <div className="relative">
                        <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                        <input 
                          type="date" 
                          required
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-light text-sm" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Time</label>
                      <div className="relative">
                        <Clock className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                        <input 
                          type="time" 
                          required
                          value={formData.time}
                          onChange={e => setFormData({...formData, time: e.target.value})}
                          className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-light text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-light text-sm" 
                      placeholder="+233..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full bg-brand-dark text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-brand-light transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-xl"
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm Availability'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dining;
