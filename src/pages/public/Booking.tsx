import { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, CreditCard, ChevronRight, Check, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Room } from '../../types';

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use URLSearchParams for initial values
  const queryParams = new URLSearchParams(location.search);
  const initialRoomId = location.state?.roomId || queryParams.get('roomId') || 'exec-plus';
  const initialCheckIn = queryParams.get('checkIn') || '';
  const initialCheckOut = queryParams.get('checkOut') || '';
  const initialGuests = queryParams.get('guests') || '1 Adult';

  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [fetchingRooms, setFetchingRooms] = useState(true);
  const [formData, setFormData] = useState({
    roomId: initialRoomId,
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    guests: initialGuests,
    name: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomList);
      setFetchingRooms(false);
      
      // If the current roomId isn't in the fetched list, default to first room
      if (roomList.length > 0 && !roomList.find(r => r.id === formData.roomId)) {
        setFormData(prev => ({ ...prev, roomId: roomList[0].id }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rooms');
    });
    return () => unsubscribe();
  }, []);

  // Sync state if initial values change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      roomId: initialRoomId,
      checkIn: initialCheckIn,
      checkOut: initialCheckOut,
      guests: initialGuests
    }));
  }, [location.search, location.state]);

  const handleNext = () => {
    if (step === 1 && (!formData.checkIn || !formData.checkOut)) {
      toast.error('Please select dates');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const path = 'bookings';
      await addDoc(collection(db, path), {
        guestName: formData.name,
        guestEmail: formData.email,
        guestPhone: formData.phone,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        roomId: formData.roomId,
        guests: formData.guests,
        totalPrice: rooms.find(r => r.id === formData.roomId)?.price || 0,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Booking requested successfully!');
      setStep(4);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingRooms) {
    return (
      <div className="pt-32 pb-24 bg-luxury-cream min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-luxury-cream min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        {/* Progress Stepper */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -translate-y-1/2 z-0" />
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                step >= s ? 'bg-brand-dark text-white' : 'bg-white text-gray-400 border border-gray-200'
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>

        <div className="bg-white luxury-shadow rounded-sm overflow-hidden">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-12">
              <h2 className="font-display text-3xl text-brand-dark mb-8">Choose Your Stay</h2>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Stay Dates</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="date" 
                        value={formData.checkIn}
                        onChange={e => setFormData({...formData, checkIn: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                      />
                      <input 
                        type="date" 
                        value={formData.checkOut}
                        onChange={e => setFormData({...formData, checkOut: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Guests</label>
                      <select 
                        value={formData.guests}
                        onChange={e => setFormData({...formData, guests: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm bg-transparent"
                      >
                        <option value="1">1 Adult</option>
                        <option value="2">2 Adults</option>
                        <option value="3">3 Adults</option>
                        <option value="4">Family (4+)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Room Category</label>
                      <select 
                        value={formData.roomId}
                        onChange={e => setFormData({...formData, roomId: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm bg-transparent"
                      >
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name} - GHS {r.price}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleNext}
                  className="w-full bg-brand-dark text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-brand-light transition-all flex items-center justify-center gap-3"
                >
                  Continue to Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-12">
              <h2 className="font-display text-3xl text-brand-dark mb-8">Guest Information</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                      placeholder="+233 ..."
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 border border-gray-200 text-gray-400 uppercase tracking-widest text-xs font-bold hover:bg-gray-50 transition-all">Back</button>
                  <button 
                    onClick={handleNext}
                    className="flex-[2] bg-brand-dark text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-brand-light transition-all flex items-center justify-center gap-3"
                  >
                    Confirm Booking <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-12">
              <h2 className="font-display text-3xl text-brand-dark mb-8">Secure Your Reservation</h2>
              <div className="bg-luxury-cream p-6 mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Total Amount</p>
                  <p className="text-2xl font-display text-brand-dark">GHS {rooms.find(r => r.id === formData.roomId)?.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-brand-dark">{rooms.find(r => r.id === formData.roomId)?.name}</p>
                  <p className="text-xs text-gray-500">{formData.checkIn} — {formData.checkOut}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 border border-brand-light/30 bg-brand-light/5 flex items-center gap-4 cursor-pointer">
                  <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-dark">Pay with MoMo / Card</h4>
                    <p className="text-xs text-gray-500">Secure payment via Paystack</p>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-brand-dark text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-brand-light transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Payment & Book'}
                </button>
                <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                  Secure encrypted transaction via Kamara Hospitality Systems
                </p>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-12 md:p-20">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 text-center md:text-left">
                  <div className="w-20 h-20 bg-brand-light text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-brand-light/20 mx-auto md:mx-0">
                    <Check className="w-10 h-10" />
                  </div>
                  <h2 className="font-display text-4xl text-brand-dark mb-4">Reservation Successful</h2>
                  <p className="text-gray-500 font-light mb-8 leading-relaxed">
                    Thank you for choosing Kamara Lakeview Hotel! We've sent a confirmation email to <strong>{formData.email}</strong> detailing your stay.
                  </p>
                  <button 
                    onClick={() => navigate('/')}
                    className="px-10 py-4 border border-brand-dark text-brand-dark uppercase tracking-widest text-xs font-bold hover:bg-brand-dark hover:text-white transition-all w-full md:w-auto"
                  >
                    Back to Home
                  </button>
                </div>
                
                <div className="flex-1 w-full max-w-sm">
                  {(() => {
                    const bookedRoom = rooms.find(r => r.id === formData.roomId);
                    return bookedRoom ? (
                      <div className="bg-luxury-cream p-4 border border-gray-100 rounded-sm">
                        <div className="aspect-video mb-4 overflow-hidden rounded-sm relative group">
                          <img 
                            src={bookedRoom.images?.[0] || '/main-homepage-1.png'} 
                            alt={bookedRoom.name} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4 bg-brand-light text-white text-[8px] uppercase tracking-widest font-black px-3 py-1 rounded-full">
                            Confirmed
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-display text-lg text-brand-dark">{bookedRoom.name}</h4>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Reserving for {formData.guests} Guests</p>
                            </div>
                            <span className="text-brand-light font-display text-xl font-bold">GHS {bookedRoom.price}</span>
                          </div>
                          
                          <div className="pt-4 border-t border-gray-200/50 flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-1">Check-in</p>
                              <p className="text-[10px] text-brand-dark font-bold">{new Date(formData.checkIn).toLocaleDateString('en-GB')}</p>
                            </div>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <div className="flex-1 text-right">
                              <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-1">Check-out</p>
                              <p className="text-[10px] text-brand-dark font-bold">{new Date(formData.checkOut).toLocaleDateString('en-GB')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
