import { useState, useEffect, FormEvent } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { Plus, Search, Utensils, Trash2, Send, X, Edit2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

const RestaurantManager = () => {
  const [activeTab, setActiveTab] = useState('POS');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [cart, setCart] = useState<{item: any, qty: number}[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: 'Breakfast',
    description: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState('Dining Hall');

  useEffect(() => {
    // Menu Items Listener
    const qMenu = query(collection(db, 'menu_items'), orderBy('name', 'asc'));
    const unsubscribeMenu = onSnapshot(qMenu, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
    });

    // Reservations Listener
    const qRes = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubscribeRes = onSnapshot(qRes, (snapshot) => {
      const resData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReservations(resData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reservations');
    });

    return () => {
      unsubscribeMenu();
      unsubscribeRes();
    };
  }, []);

  const handleReservationAction = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'reservations', id), { 
        status, 
        updatedAt: serverTimestamp() 
      });
      toast.success(`Reservation ${status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${id}`);
    }
  };

  const deleteReservation = async (id: string) => {
    if (confirm('Delete this reservation?')) {
      try {
        await deleteDoc(doc(db, 'reservations', id));
        toast.success('Reservation deleted');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `reservations/${id}`);
      }
    }
  };

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { item, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.item.id !== id));
  };

  const handleMenuSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'menu_items', editingId), { ...formData, updatedAt: serverTimestamp() });
        toast.success('Menu item updated');
      } else {
        await addDoc(collection(db, 'menu_items'), { ...formData, createdAt: serverTimestamp() });
        toast.success('New menu item added');
      }
      setIsModalOpen(false);
      resetMenuForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'menu_items');
    }
  };

  const resetMenuForm = () => {
    setFormData({ name: '', price: 0, category: 'Breakfast', description: '' });
    setEditingId(null);
  };

  const deleteMenuItem = async (id: string) => {
    if (confirm('Remove item from menu?')) {
      try {
        await deleteDoc(doc(db, 'menu_items', id));
        toast.success('Item removed');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `menu_items/${id}`);
      }
    }
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    try {
      const totalAmount = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
      const orderData = {
        orderType,
        tableNumber: tableNumber || 'N/A',
        items: cart.map(c => ({
          id: c.item.id,
          name: c.item.name,
          qty: c.qty,
          price: c.item.price
        })),
        totalAmount,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      toast.success('Order sent to kitchen!');
      setCart([]);
      setTableNumber('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    }
  };

  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(i => i.category === activeCategory);

  return (
    <div className="flex bg-luxury-cream min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 pt-20">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="font-display text-4xl text-brand-dark mb-2 font-bold font-display">Culinary Operations</h1>
            <p className="text-gray-500 text-sm font-light">Manage point-of-sale orders and online table reservations.</p>
          </div>
          <div className="flex bg-white luxury-shadow p-1">
            {['POS', 'Reservations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-10 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${
                  activeTab === tab ? 'bg-brand-dark text-white' : 'text-gray-400 hover:text-brand-dark'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'POS' ? (
          <div className="flex gap-10">
            {/* Menu Side */}
            <div className="flex-[3]">
              <div className="flex justify-between items-end mb-8">
                <h2 className="font-display text-2xl text-brand-dark">Menu Dispatch</h2>
                <button 
                  onClick={() => { resetMenuForm(); setIsModalOpen(true); }}
                  className="bg-brand-dark/5 text-brand-dark px-6 py-2 text-[10px] uppercase tracking-widest font-bold border border-brand-dark/10 hover:bg-brand-dark hover:text-white transition-all flex items-center gap-3"
                >
                  <Plus className="w-4 h-4" />
                  Configure Menu
                </button>
              </div>

              {/* Categories */}
              <div className="flex gap-3 mb-8">
                {['All', 'Breakfast', 'Lunch', 'Dinner', 'Drinks'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border ${
                      activeCategory === cat 
                        ? 'bg-brand-dark text-white border-brand-dark' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-brand-dark'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-3 py-20 text-center italic text-gray-400">Syncing kitchen inventory...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="col-span-3 py-20 text-center text-gray-400 italic bg-white luxury-shadow">No culinary items found in this category.</div>
                ) : filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 luxury-shadow cursor-pointer border-l-4 border-transparent hover:border-brand-light transition-all flex flex-col justify-between group"
                  >
                    <div onClick={() => addToCart(item)}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-brand-dark leading-tight">{item.name}</h3>
                        <span className="text-brand-light font-display">GHS {item.price}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-light italic line-clamp-1 mb-4">{item.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFormData({...item}); setEditingId(item.id); setIsModalOpen(true); }}
                          className="p-2 text-gray-300 hover:text-brand-dark transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteMenuItem(item.id); }}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-luxury-cream text-brand-dark px-4 py-2 text-[10px] uppercase font-black hover:bg-brand-dark hover:text-white transition-all shadow-sm"
                      >
                        Add to Order
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Order Sidebar */}
            <div className="flex-1 min-w-[350px]">
              <div className="bg-white h-[calc(100vh-250px)] luxury-shadow flex flex-col sticky top-32">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-transparent">
                  <div>
                    <h3 className="font-display text-2xl text-brand-dark">Active Slip</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Terminal #01</p>
                  </div>
                  <div className="p-3 bg-brand-dark/5 rounded-none">
                    <Utensils className="w-5 h-5 text-brand-dark" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 space-y-4">
                      <Plus className="w-8 h-8" />
                      <p className="text-xs uppercase tracking-widest font-bold">Select items to begin</p>
                    </div>
                  ) : (
                    cart.map(({item, qty}) => (
                      <div key={item.id} className="flex justify-between items-center group">
                        <div className="flex gap-4 items-center">
                          <span className="text-brand-light font-display text-lg w-6">{qty}x</span>
                          <div>
                            <p className="text-sm font-bold text-brand-dark truncate w-32">{item.name}</p>
                            <p className="text-[10px] text-gray-400">GHS {item.price * qty}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-8 bg-luxury-cream border-t border-gray-100 space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] uppercase tracking-widest font-black text-brand-dark">Grand Total</span>
                    <span className="font-display text-3xl text-brand-dark">
                      GHS {cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-400">Position</label>
                        <input 
                          type="text" 
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="Table#" 
                          className="w-full bg-white border border-gray-100 p-3 text-sm focus:outline-none focus:border-brand-dark outline-none font-bold" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-400">Service Type</label>
                        <select 
                          value={orderType}
                          onChange={(e) => setOrderType(e.target.value)}
                          className="w-full bg-white border border-gray-100 p-3 text-sm focus:outline-none focus:border-brand-dark outline-none font-bold appearance-none"
                        >
                          <option>Dining Hall</option>
                          <option>Room Service</option>
                          <option>Poolside</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={submitOrder}
                      disabled={cart.length === 0}
                      className="w-full py-4 bg-brand-dark text-white uppercase tracking-[0.2em] text-[10px] font-black hover:bg-brand-light transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Place Kitchen Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center italic text-gray-400">Loading guest reservations...</div>
            ) : reservations.length === 0 ? (
              <div className="py-20 text-center text-gray-400 italic bg-white luxury-shadow font-display text-xl">No table reservations awaiting response.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reservations.map((res) => (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 luxury-shadow flex items-center justify-between group border-l-4 border-brand-light"
                  >
                    <div className="flex items-center gap-8">
                      <div className="w-12 h-12 bg-luxury-cream flex items-center justify-center font-display text-xl text-brand-dark border border-gray-100">
                        {res.guests}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-brand-dark">{res.name}</h3>
                          <span className={`text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${
                            res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                            res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {res.status}
                          </span>
                        </div>
                        <div className="flex gap-6 text-[10px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1 uppercase tracking-tighter">
                            <Clock className="w-3 h-3 text-brand-light" />
                            {res.date} @ {res.time}
                          </span>
                          <span className="flex items-center gap-1 lowercase">
                            <Send className="w-3 h-3 text-brand-light" />
                            {res.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {res.status === 'pending' && (
                        <button 
                          onClick={() => handleReservationAction(res.id, 'confirmed')}
                          className="bg-brand-dark text-white px-6 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-brand-light transition-all shadow-sm"
                        >
                          Confirm
                        </button>
                      )}
                      <button 
                         onClick={() => deleteReservation(res.id)}
                         className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Menu Management Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="relative bg-white w-full max-w-lg p-10 md:p-16 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-10">
                  <h3 className="font-display text-3xl text-brand-dark">Menu Configuration</h3>
                  <X className="w-6 h-6 cursor-pointer text-gray-400 hover:text-brand-dark" onClick={() => setIsModalOpen(false)} />
                </div>
                
                <form onSubmit={handleMenuSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Item Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-dark text-sm" 
                      placeholder="e.g. Jollof Chicken" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-dark text-sm bg-transparent"
                      >
                        <option>Breakfast</option>
                        <option>Lunch</option>
                        <option>Dinner</option>
                        <option>Drinks</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Price (GHS)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-dark text-sm" 
                        placeholder="45" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Short Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-100 p-4 focus:outline-none focus:border-brand-dark text-sm h-24 italic" 
                      placeholder="Ingredients and special notes..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-brand-dark text-white py-5 uppercase tracking-[0.2em] text-[10px] font-black hover:bg-brand-light transition-all mt-6 shadow-xl"
                  >
                    {editingId ? 'Update Menu Item' : 'Publish to Menu'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default RestaurantManager;
