import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Rooms from './pages/public/Rooms';
import Dining from './pages/public/Dining';
import Gallery from './pages/public/Gallery';
import Contact from './pages/public/Contact';
import Booking from './pages/public/Booking';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import RoomManager from './pages/admin/RoomManager';
import BookingManager from './pages/admin/BookingManager';
import Inbox from './pages/admin/Inbox';
import RestaurantManager from './pages/admin/RestaurantManager';
import KitchenDisplay from './pages/admin/KitchenDisplay';
import CMS from './pages/admin/CMS';
import GuestManager from './pages/admin/GuestManager';
import StaffManager from './pages/admin/StaffManager';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (firebaseUser: any) => {
    try {
      const docRef = doc(db, 'profiles', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser({ id: docSnap.id, ...data } as User);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.warn('Profile fetch failed, checking super-admin fallback', error);
    }

    if (firebaseUser.email === 'kamara001117@gmail.com') {
      setUser({
        id: firebaseUser.uid,
        name: 'Super Admin',
        email: firebaseUser.email,
        role: 'admin'
      } as User);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-luxury-cream">
        <div className="animate-pulse flex flex-col items-center">
          <img src="/kamaralakeview-logo.png" alt="Kamara Logo" className="h-24 mb-4" />
          <p className="font-display italic text-brand-dark">Loading tranquility...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
          <Route path="/about" element={<><Navbar /><About /><Footer /></>} />
          <Route path="/rooms" element={<><Navbar /><Rooms /><Footer /></>} />
          <Route path="/dining" element={<><Navbar /><Dining /><Footer /></>} />
          <Route path="/gallery" element={<><Navbar /><Gallery /><Footer /></>} />
          <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
          <Route path="/booking" element={<><Navbar /><Booking /><Footer /></>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/*" 
            element={user ? (
              <Routes>
                <Route path="/" element={<AdminDashboard user={user} />} />
                <Route path="/rooms" element={<RoomManager />} />
                <Route path="/bookings" element={<BookingManager />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/restaurant" element={<RestaurantManager />} />
                <Route path="/kitchen" element={<KitchenDisplay />} />
                <Route path="/guests" element={<GuestManager />} />
                <Route path="/staff" element={<StaffManager />} />
                <Route path="/cms" element={<CMS />} />
              </Routes>
            ) : (
              <Navigate to="/admin/login" replace />
            )} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
