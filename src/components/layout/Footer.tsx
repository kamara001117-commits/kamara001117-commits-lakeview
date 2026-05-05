import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Footer = () => {
  const [settings, setSettings] = useState({
    hotelName: 'Kamara Lakeview Hotel',
    phone: '+233 50 000 0000',
    email: 'reservations@kamaralakeview.com',
    tagline: 'Experience Comfort. Embrace Tranquility.'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'appearance'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({
          ...prev,
          hotelName: data.hotelName || prev.hotelName,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          tagline: data.tagline || prev.tagline
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-brand-dark text-white pt-20 pb-10 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Brand & Mission */}
        <div className="md:col-span-1">
          <img src="/kamaralakeview-logo.png" alt="Kamara Logo" className="h-16 mb-6 brightness-0 invert" />
          <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
            "{settings.tagline}"
          </p>
          <div className="flex space-x-4">
            <Facebook className="h-5 w-5 cursor-pointer hover:text-brand-light transition-colors" />
            <Instagram className="h-5 w-5 cursor-pointer hover:text-brand-light transition-colors" />
            <Twitter className="h-5 w-5 cursor-pointer hover:text-brand-light transition-colors" />
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display text-lg mb-6 tracking-wide">Quick Links</h4>
          <ul className="space-y-4 text-sm text-gray-300">
            <li><Link to="/rooms" className="hover:text-brand-light transition-colors">Our Rooms</Link></li>
            <li><Link to="/dining" className="hover:text-brand-light transition-colors">Fine Dining</Link></li>
            <li><Link to="/gallery" className="hover:text-brand-light transition-colors">Visual Gallery</Link></li>
            <li><Link to="/about" className="hover:text-brand-light transition-colors">About Us</Link></li>
            <li><Link to="/booking" className="hover:text-brand-light transition-colors">Book a Stay</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-display text-lg mb-6 tracking-wide">Contact Us</h4>
          <ul className="space-y-4 text-sm text-gray-300">
            <li className="flex items-start">
              <MapPin className="h-5 w-5 mr-3 text-brand-light mt-0.5" />
              <span>Bamahu, Wa, Upper West Region,<br />Ghana</span>
            </li>
            <li className="flex items-center">
              <Phone className="h-5 w-5 mr-3 text-brand-light" />
              <span>{settings.phone}</span>
            </li>
            <li className="flex items-center">
              <Mail className="h-5 w-5 mr-3 text-brand-light" />
              <span>{settings.email}</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-display text-lg mb-6 tracking-wide">Newsletter</h4>
          <p className="text-sm text-gray-300 mb-4">Subscribe to receive exclusive offers and updates.</p>
          <div className="flex flex-col space-y-3">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="bg-transparent border border-gray-600 px-4 py-3 text-sm focus:outline-none focus:border-brand-light"
            />
            <button className="bg-brand-light text-white px-6 py-3 text-sm uppercase tracking-widest font-medium hover:bg-white hover:text-brand-dark transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 uppercase tracking-widest">
        <p>© {new Date().getFullYear()} Kamara Lakeview Hotel. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <Link to="/admin" className="hover:text-white transition-colors">Staff Portal</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
