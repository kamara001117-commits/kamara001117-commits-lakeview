import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '../../types';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hotelName, setHotelName] = useState('KAMARA LAKEVIEW');
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // Subscribe to CMS settings
    const unsubscribe = onSnapshot(doc(db, 'settings', 'appearance'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().hotelName) {
        setHotelName(docSnap.data().hotelName.toUpperCase());
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Dining', href: '/dining' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ];

  // Logic to split hotel name for the logo
  const nameParts = hotelName.split(' ');
  const primaryName = nameParts[0] || 'KAMARA';
  const secondaryName = nameParts.slice(1).join(' ') || 'LAKEVIEW';

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out px-6 py-4 md:px-12',
        isScrolled || !isHome ? 'bg-white shadow-md py-3' : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-4 group">
          <div className={cn(
            "transition-all duration-500 flex items-center gap-3",
            isScrolled || !isHome ? "h-12 md:h-14" : "h-16 md:h-20"
          )}>
            <img
              src="/kamaralakeview-logo.png"
              alt={hotelName}
              className="h-full w-auto object-contain brightness-110"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Fallback Text Logo if image fails */}
            <div className={cn(
              "font-display flex flex-col justify-center",
              (isScrolled || !isHome) ? "text-brand-dark" : "text-white"
            )}>
              <span className="text-2xl md:text-4xl font-extrabold tracking-tighter leading-none group-hover:text-brand-light transition-colors drop-shadow-md">
                {primaryName}
              </span>
              <span className="text-[10px] md:text-[12px] tracking-[0.5em] font-bold opacity-100 mt-1">
                {secondaryName}
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-10 text-sm font-medium tracking-widest uppercase">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                'transition-colors duration-300 hover:text-brand-light',
                isScrolled || !isHome ? 'text-brand-dark' : 'text-white'
              )}
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/booking"
            className={cn(
              'px-8 py-3 rounded-none transition-all duration-300 transform hover:scale-105',
              isScrolled || !isHome
                ? 'bg-brand-dark text-white hover:bg-brand-light'
                : 'bg-white text-brand-dark hover:bg-brand-light hover:text-white'
            )}
          >
            Book Now
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className={isScrolled || !isHome ? 'text-brand-dark' : 'text-white'} />
          ) : (
            <Menu className={isScrolled || !isHome ? 'text-brand-dark' : 'text-white'} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-brand-dark text-lg font-medium border-b border-gray-100 pb-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/booking"
                className="bg-brand-dark text-white px-8 py-3 text-center uppercase tracking-widest"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Book Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
