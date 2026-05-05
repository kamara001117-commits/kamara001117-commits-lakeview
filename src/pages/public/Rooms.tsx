import { useState, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Bed, Users, Square, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Room } from '../../types';

const RoomCard = ({ room, idx, navigate }: { room: Room, idx: number, navigate: any }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const images = room.images?.length > 0 ? room.images : ['/main-homepage-1.png'];

  const nextImg = (e: MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}
    >
      {/* Room Image */}
      <div className="w-full lg:w-3/5 relative group cursor-pointer overflow-hidden rounded-sm">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImg}
            src={images[currentImg]} 
            alt={room.name} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full aspect-[16/9] object-cover"
          />
        </AnimatePresence>
        
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImg}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextImg}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/40'}`} 
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-6 py-2 luxury-shadow">
          <span className="text-brand-dark font-display text-xl leading-none">GHS {room.price}</span>
          <span className="text-gray-500 text-[10px] uppercase tracking-widest block mt-1">/ night</span>
        </div>
      </div>

      {/* Room Details */}
      <div className="w-full lg:w-2/5 space-y-6">
        <div>
          <h2 className="font-display text-3xl md:text-4xl text-brand-dark mb-4">{room.name}</h2>
          <p className="text-gray-600 font-light leading-relaxed line-clamp-3">{room.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-100">
          <div className="flex items-center gap-3">
            <Bed className="w-5 h-5 text-brand-light" />
            <span className="text-sm text-gray-600 capitalize">
              {room.type.includes('Executive') ? 'King' : 'Queen'} Bed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-brand-light" />
            <span className="text-sm text-gray-600">2 Adults</span>
          </div>
          <div className="flex items-center gap-3">
            <Square className="w-5 h-5 text-brand-light" />
            <span className="text-sm text-gray-600">
              {room.type === 'Executive Plus' ? '45' : room.type === 'Executive' ? '35' : '28'} sqm
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest font-bold text-brand-dark">Highlights</h4>
          <div className="grid grid-cols-2 gap-2">
            {(room.features || ['WiFi', 'Air Conditioning', 'Smart TV', 'Room Service']).slice(0, 4).map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-brand-light" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <button 
            onClick={() => navigate('/booking', { state: { roomId: room.id } })}
            className={`w-full py-4 border border-brand-dark uppercase tracking-widest text-xs font-bold transition-all duration-300 ${
              room.status === 'available' 
                ? 'text-brand-dark hover:bg-brand-dark hover:text-white' 
                : 'text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            disabled={room.status !== 'available'}
          >
            {room.status === 'available' ? 'Book This Room' : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Rooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      setRooms(roomData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rooms');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-brand-dark uppercase tracking-[0.4em] text-xs font-bold mb-4 block"
          >
            Accommodation
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-6xl text-brand-dark mb-6 text-balance"
          >
            Luxury Rooms & Suites
          </motion.h1>
          <p className="text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            Discover a sanctuary of modern elegance. Each of our luxury units is a masterpiece 
            of design, crafted to provide the ultimate in comfort and privacy.
          </p>
        </div>

        {/* Room List */}
        <div className="space-y-32">
          {loading ? (
            <div className="text-center py-20 italic text-gray-400">Discovering luxury accommodations...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No rooms currently available. Please check back later.</div>
          ) : rooms.map((room, idx) => (
            <div key={room.id}>
              <RoomCard room={room} idx={idx} navigate={navigate} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rooms;
