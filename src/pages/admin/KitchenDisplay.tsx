import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { ChefHat, Clock, Check, Bell, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

const KitchenDisplay = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(orderData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      if (newStatus === 'ready') toast.success(`Order ${id.slice(0, 5)} is ready!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const removeOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
      toast.success('Order cleared from screen');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${id}`);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((new Date().getTime() - timestamp.toDate().getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} mins ago`;
  };

  return (
    <div className="flex bg-brand-dark min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 pt-20">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <ChefHat className="w-8 h-8 text-brand-light" />
              <h1 className="font-display text-4xl text-white font-bold">Kitchen Expedition</h1>
            </div>
            <p className="text-gray-400 text-sm font-light">Real-time order visualization and fulfillment status.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-none flex items-center gap-3">
              <Bell className="w-4 h-4 text-brand-light animate-pulse" />
              <span className="text-[10px] text-white uppercase tracking-widest font-bold font-mono">Monitor Active</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {loading ? (
            <div className="col-span-full py-20 text-center italic text-gray-400 text-xl font-display uppercase tracking-widest">Waking up the kitchen...</div>
          ) : orders.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 italic bg-white/5 luxury-shadow">No active orders. Kitchen is standing by.</div>
          ) : (
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`bg-white rounded-none overflow-hidden flex flex-col border-t-4 shadow-2xl transition-all ${
                    order.status === 'preparing' ? 'border-yellow-500' : 
                    order.status === 'ready' ? 'border-green-500' : 'border-red-500 animate-pulse'
                  }`}
                >
                  {/* Order Header */}
                  <div className="p-6 bg-gray-50 flex justify-between items-start border-b border-gray-100">
                    <div>
                      <span className={`text-[10px] items-center flex gap-1 font-black uppercase tracking-tighter mb-1 ${
                        order.status === 'pending' ? 'text-red-500' : 'text-brand-dark'
                      }`}>
                        {order.status === 'pending' && <AlertTriangle className="w-3 h-3" />}
                        {order.orderType || 'Standard'}
                      </span>
                      <h3 className="font-display text-2xl text-brand-dark leading-tight line-clamp-1">{order.tableNumber || order.location || 'N/A'}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-mono">#{order.id.slice(-5)}</p>
                      <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 justify-end mt-1 uppercase tracking-tighter">
                        <Clock className="w-3 h-3" /> {getTimeAgo(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-6 flex-1 bg-white">
                    <ul className="space-y-4">
                      {order.items?.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center bg-luxury-cream p-3 border-l-2 border-brand-light">
                          <span className="text-sm font-bold text-brand-dark line-clamp-1">{item.name}</span>
                          <span className="text-brand-light font-display text-lg">x{item.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="p-4 grid grid-cols-1 gap-2 bg-gray-50">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="w-full bg-brand-dark text-white py-4 text-[10px] uppercase tracking-[0.2em] font-black hover:bg-black transition-all shadow-lg"
                      >
                        Start Preparation
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="w-full bg-green-600 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-black hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Check className="w-4 h-4" /> Order Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button 
                        onClick={() => removeOrder(order.id)}
                        className="w-full bg-brand-light text-white py-4 text-[10px] uppercase tracking-[0.2em] font-black hover:bg-brand-dark transition-all shadow-lg"
                      >
                        Handover & Close
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default KitchenDisplay;
