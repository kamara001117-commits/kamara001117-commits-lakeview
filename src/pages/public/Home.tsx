import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, ArrowRight, BedDouble, Wifi, Utensils, 
  Car, Loader2, Star, Quote 
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';

const Home = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [settings, setSettings] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'appearance'));
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (err) {
        console.warn('Using default hero settings');
      }
    };

    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'), 
          where('status', '==', 'approved'),
          limit(3)
        );
        const snap = await getDocs(q);
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    Promise.all([fetchSettings(), fetchReviews()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const heroImages = Array.isArray(settings?.heroImages) 
    ? settings.heroImages 
    : settings?.heroImage 
      ? [settings.heroImage] 
      : [
        '/main-homepage-1.png',
        '/main-homepage-2.png'
      ];

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroImages]);

  const handleCheckAvailability = () => {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests
    });
    navigate(`/booking?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-cream">
        <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImages[currentImage]})` }}
          >
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-vh-90 text-center px-6 pt-20" style={{ minHeight: '90vh' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <span className="text-brand-light uppercase tracking-[0.4em] text-sm font-medium mb-6 block">
            Welcome to {settings?.hotelName || "Kamara Lakeview"}
          </span>
          <h1 className="font-display text-5xl md:text-8xl text-white mb-8 leading-tight font-bold">
            {settings?.tagline || "Experience Comfort. Embrace Tranquility."}
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            {settings?.secondaryHeader || "Welcome to Kamara Lakeview Hotel, where luxury meets serene beauty in the heart of Wa."}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button
              onClick={() => navigate('/booking')}
              className="px-10 py-4 bg-brand-dark text-white rounded-none uppercase tracking-[0.2em] text-sm font-medium hover:bg-brand-light transition-all flex items-center group"
            >
              Book Now
              <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/rooms')}
              className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-none uppercase tracking-[0.2em] text-sm font-medium hover:bg-white hover:text-brand-dark transition-all"
            >
              View Rooms
            </button>
          </div>
        </motion.div>
      </div>

      {/* Booking Widget */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 -mt-16 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="bg-white/90 backdrop-blur-xl p-8 md:p-10 luxury-shadow flex flex-col lg:flex-row gap-8 items-end w-full border-t-4 border-brand-light"
        >
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-dark font-semibold">Check-in</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark" />
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-white/50 border-b border-brand-dark/20 py-3 pl-10 pr-4 focus:outline-none focus:border-brand-dark text-sm" 
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-dark font-semibold">Check-out</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark" />
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-white/50 border-b border-brand-dark/20 py-3 pl-10 pr-4 focus:outline-none focus:border-brand-dark text-sm" 
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-dark font-semibold">Guests</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark" />
                <select 
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-white/50 border-b border-brand-dark/20 py-3 pl-10 pr-4 focus:outline-none focus:border-brand-dark text-sm appearance-none cursor-pointer"
                >
                  <option value="1">1 Adult</option>
                  <option value="2">2 Adults</option>
                  <option value="3">3 Adults</option>
                  <option value="4">Family (4+)</option>
                </select>
              </div>
            </div>
          </div>
          <button 
            onClick={handleCheckAvailability}
            className="w-full lg:w-auto px-12 py-4 bg-brand-dark text-white uppercase tracking-[0.2em] text-xs font-semibold hover:bg-brand-light transition-all"
          >
            Check Availability
          </button>
        </motion.div>
      </div>

      {/* Feature Highlights */}
      <section className="bg-luxury-cream py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-white rounded-full luxury-shadow group-hover:scale-110 transition-transform">
                <feature.icon className="w-8 h-8 text-brand-dark" />
              </div>
              <h3 className="font-display text-xl mb-3 font-semibold text-brand-dark">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-light">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="py-32 bg-white relative overflow-hidden">
          {/* Decorative Quote Mark */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-[0.03] select-none pointer-events-none">
            <Quote className="w-[400px] h-[400px] text-brand-dark" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <span className="text-brand-light uppercase tracking-[0.4em] text-[10px] font-bold mb-4 block underline underline-offset-8">Testimonials</span>
              <h2 className="font-display text-4xl md:text-6xl text-brand-dark mb-4">Guest Perspective</h2>
              <p className="text-gray-500 font-light max-w-xl mx-auto text-sm leading-relaxed">
                Authentic experiences shared by our global community of travelers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-luxury-cream p-10 luxury-shadow border-t-4 border-brand-light relative"
                >
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < review.rating ? 'text-brand-light fill-brand-light' : 'text-gray-200'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 italic font-light leading-relaxed mb-8 text-sm">
                    "{review.text}"
                  </p>
                  <div className="flex items-center gap-4 border-t border-brand-dark/10 pt-6">
                    <div className="w-10 h-10 rounded-full bg-brand-dark text-white flex items-center justify-center font-display text-lg font-bold">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-dark text-sm">{review.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Verified Stay</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-16">
              <button 
                onClick={() => navigate('/contact')}
                className="text-brand-dark text-[10px] font-bold uppercase tracking-widest border-b-2 border-brand-light pb-1 hover:text-brand-light transition-all"
              >
                Share your journey
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const features = [
  { title: "Luxury Rooms", desc: "Thoughtfully designed for rest and personal comfort.", icon: BedDouble },
  { title: "Free WiFi", desc: "Stay connected with high-speed internet in every corner.", icon: Wifi },
  { title: "Full Restaurant", desc: "Experience authentic Ghanaian and continental cuisine.", icon: Utensils },
  { title: "Free Parking", desc: "Secure and ample parking space for all guest vehicles.", icon: Car },
];

export default Home;
