import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { Calendar, Search, Filter, CheckCircle2, UserCheck, LogOut, MoreVertical, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { Booking } from '../../types';

const BookingManager = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(bookingData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status: action,
        updatedAt: serverTimestamp()
      });
      toast.success(`Booking ${action.replace('_', ' ')}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const deleteBooking = async (id: string) => {
    if (confirm('Permanently delete this reservation?')) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
        toast.success('Reservation deleted');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
      }
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.guestEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && ['confirmed', 'checked_in'].includes(b.status)) ||
                      (activeTab === 'history' && b.status === 'checked_out');
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex bg-luxury-cream min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 pt-20">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="font-display text-4xl text-brand-dark mb-2">Hospitality Registry</h1>
            <p className="text-gray-500 text-sm font-light">Efficiently manage guest arrivals, departures, and active stays.</p>
          </div>
          <div className="flex bg-white luxury-shadow rounded-none p-1">
            {['all', 'active', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2 text-[10px] uppercase tracking-widest font-bold transition-all ${
                  activeTab === tab ? 'bg-brand-dark text-white shadow-lg' : 'text-gray-400 hover:text-brand-dark'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by guest name or email..." 
              className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-dark"
            />
          </div>
          <button className="bg-white px-6 py-4 border border-gray-100 flex items-center gap-3 text-gray-500 hover:text-brand-dark transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center py-20 italic text-gray-400 font-light font-display text-xl">Syncing reservations...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-20 bg-white luxury-shadow text-gray-400 italic">No reservations found matching your criteria.</div>
          ) : filteredBookings.map((booking, idx) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 luxury-shadow flex items-center justify-between group border-l-4 border-transparent hover:border-brand-light transition-all"
            >
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-luxury-cream rounded-none flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Unit</span>
                  <span className="text-sm font-display text-brand-dark">{booking.roomId}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-brand-dark">{booking.guestName}</h3>
                    <span className="text-[10px] text-gray-400 font-mono">#{booking.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-light italic">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 
                      {booking.checkIn} — {booking.checkOut}
                    </span>
                    <span>•</span>
                    <span>GHS {booking.totalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <span className={`text-[10px] uppercase tracking-widest font-black ${
                    booking.status === 'checked_in' ? 'text-green-600' :
                    booking.status === 'confirmed' ? 'text-blue-600' :
                    booking.status === 'pending' ? 'text-yellow-600' : 'text-gray-400'
                  }`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Status</p>
                </div>

                <div className="flex gap-2">
                  {booking.status === 'pending' && (
                    <button 
                      onClick={() => handleAction(booking.id, 'confirmed')}
                      className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm outline-none"
                      title="Confirm Reservation"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button 
                      onClick={() => handleAction(booking.id, 'checked_in')}
                      className="p-3 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm outline-none"
                      title="Check In Guest"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  )}
                  {booking.status === 'checked_in' && (
                    <button 
                      onClick={() => handleAction(booking.id, 'checked_out')}
                      className="p-3 bg-brand-dark text-white hover:bg-black transition-all shadow-sm outline-none"
                      title="Check Out Guest"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteBooking(booking.id)}
                    className="p-3 text-gray-400 hover:text-red-500 transition-colors outline-none"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default BookingManager;
