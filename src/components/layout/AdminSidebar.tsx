import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bed, 
  CalendarCheck, 
  UtensilsCrossed, 
  ChefHat, 
  Settings, 
  LogOut,
  Users,
  Shield,
  Mail
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Logo from '../Logo';

const AdminSidebar = () => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'messages'), where('status', '==', 'unread'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Rooms', icon: Bed, path: '/admin/rooms' },
    { name: 'Bookings', icon: CalendarCheck, path: '/admin/bookings' },
    { name: 'Inbox', icon: Mail, path: '/admin/inbox', showBadge: true },
    { name: 'Restaurant', icon: UtensilsCrossed, path: '/admin/restaurant' },
    { name: 'Kitchen', icon: ChefHat, path: '/admin/kitchen' },
    { name: 'Guests', icon: Users, path: '/admin/guests' },
    { name: 'Staff', icon: Shield, path: '/admin/staff' },
    { name: 'CMS', icon: Settings, path: '/admin/cms' },
  ];

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="w-64 h-screen bg-brand-dark flex flex-col fixed left-0 top-0 text-white z-50">
      <div className="p-8 border-b border-white/10 mb-8 items-center flex flex-col justify-center">
        <Logo variant="light" className="h-12 mb-4" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-light">Management</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-3 rounded-sm transition-all duration-300 text-sm font-medium tracking-wide ${
                isActive 
                  ? 'bg-brand-light text-brand-dark' 
                  : 'hover:bg-white/5 text-gray-300'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1">{item.name}</span>
              {(item.showBadge && unreadCount > 0) && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${
                  isActive ? 'bg-brand-dark text-brand-light' : 'bg-brand-light text-brand-dark'
                }`}>
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-4 w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
