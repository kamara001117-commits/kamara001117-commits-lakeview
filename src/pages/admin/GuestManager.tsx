import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { Search, User, Mail, Phone, Calendar, History, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const GuestManager = () => {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We derive guest list from bookings for now
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guestMap = new Map();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const email = data.guestEmail;
        if (!guestMap.has(email)) {
          guestMap.set(email, {
            id: email, // Using email as key
            name: data.guestName,
            email: data.guestEmail,
            phone: data.guestPhone,
            visits: 1,
            status: 'Regular',
            lastStay: data.createdAt?.toDate()
          });
        } else {
          const existing = guestMap.get(email);
          existing.visits += 1;
          if (existing.visits >= 3) existing.status = 'VIP';
          guestMap.set(email, existing);
        }
      });
      setGuests(Array.from(guestMap.values()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex bg-luxury-cream min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 pt-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-display text-4xl text-brand-dark mb-2">Guest Relations</h1>
            <p className="text-gray-500 text-sm font-light">Maintain detailed profiles and historical records of our valued visitors.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 italic text-gray-400">Consulting visitor records...</div>
        ) : guests.length === 0 ? (
          <div className="text-center py-20 bg-white luxury-shadow rounded-sm italic text-gray-400">
            No guest history found. Data will appear as bookings are made.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guests.map((guest, idx) => (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 luxury-shadow border-t-4 border-brand-light group hover:scale-[1.02] transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-luxury-cream rounded-full flex items-center justify-center border border-gray-100 mb-4">
                    <User className="w-8 h-8 text-brand-dark/30" />
                  </div>
                  {guest.status === 'VIP' && (
                    <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-full">
                      <Star className="w-3 h-3 fill-yellow-500" /> VIP
                    </span>
                  )}
                </div>
                
                <h3 className="font-display text-2xl text-brand-dark mb-1">{guest.name}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-6 italic">Derived from Bookings</p>
                
                <div className="space-y-4 pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <Mail className="w-4 h-4 text-brand-light/60" />
                    <span>{guest.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <Phone className="w-4 h-4 text-brand-light/60" />
                    <span>{guest.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <History className="w-4 h-4 text-brand-light/60" />
                    <span>{guest.visits} Successful {guest.visits === 1 ? 'Stay' : 'Stays'}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button className="w-full py-3 border border-gray-100 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-brand-dark hover:border-brand-dark transition-all">
                    View Guest Profile
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default GuestManager;
