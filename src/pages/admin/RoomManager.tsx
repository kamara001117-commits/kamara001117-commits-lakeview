import { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { Plus, Edit2, Trash2, X, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { Room } from '../../types';

const RoomManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Standard' as Room['type'],
    price: 480,
    status: 'available' as Room['status'],
    images: [] as string[],
    description: '',
    features: ['WiFi', 'Air Conditioning', 'Smart TV']
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 2MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const roomPayload = {
        ...formData,
        isAvailable: formData.status === 'available',
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'rooms', editingId), roomPayload);
        toast.success('Room updated successfully');
      } else {
        await addDoc(collection(db, 'rooms'), {
          ...roomPayload,
          description: formData.description || `A beautiful ${formData.type} unit.`,
          createdAt: serverTimestamp()
        });
        toast.success('Room initialized successfully');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'rooms');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Standard',
      price: 480,
      status: 'available',
      images: [],
      description: '',
      features: ['WiFi', 'Air Conditioning', 'Smart TV']
    });
    setEditingId(null);
  };

  const handleEdit = (room: Room) => {
    setFormData({
      name: room.name,
      type: room.type,
      price: room.price,
      status: room.status,
      images: room.images || [],
      description: room.description || '',
      features: room.features || ['WiFi', 'Air Conditioning', 'Smart TV']
    });
    setEditingId(room.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this room from inventory?')) {
      try {
        await deleteDoc(doc(db, 'rooms', id));
        toast.success('Room removed successfully');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `rooms/${id}`);
      }
    }
  };

  return (
    <div className="flex bg-luxury-cream min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 pt-20">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="font-display text-4xl text-brand-dark mb-2">Inventory Management</h1>
            <p className="text-gray-500 text-sm font-light">Monitor and configure the hotel's luxury units.</p>
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-brand-dark text-white px-8 py-3 text-xs uppercase tracking-widest font-bold shadow-soft hover:bg-brand-light transition-all flex items-center gap-3"
          >
            <Plus className="w-4 h-4" />
            Add New Room
          </button>
        </div>

        <div className="bg-white luxury-shadow overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-dark text-white border-b border-white/10 uppercase tracking-[0.2em] text-[10px] font-bold">
                <th className="py-6 px-8">Room ID</th>
                <th className="py-6 px-8">Unit Name</th>
                <th className="py-6 px-8">Category</th>
                <th className="py-6 px-8">Price</th>
                <th className="py-6 px-8">Status</th>
                <th className="py-6 px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center italic text-gray-400">Syncing inventory...</td></tr>
              ) : rooms.map((room) => (
                <tr key={room.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-6 px-8 text-xs font-mono text-gray-400">#{room.id.slice(0, 8)}</td>
                  <td className="py-6 px-8 font-bold text-brand-dark text-sm">{room.name}</td>
                  <td className="py-6 px-8">
                    <span className="text-xs text-gray-500 font-medium px-3 py-1 border border-gray-200">
                      {room.type}
                    </span>
                  </td>
                  <td className="py-6 px-8 font-display text-brand-dark">GHS {room.price}</td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        room.status === 'available' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                        room.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                      }`} />
                      <span className="text-[10px] uppercase font-bold tracking-tighter text-gray-600">{room.status}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(room)}
                        className="p-2 text-brand-dark hover:bg-brand-dark hover:text-white transition-all outline-none"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(room.id)}
                        className="p-2 text-red-500 hover:bg-red-500 hover:text-white transition-all outline-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
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
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-2xl p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-display text-2xl text-brand-dark">
                    {editingId ? 'Edit Configuration' : 'Configure Unit'}
                  </h3>
                  <X className="w-6 h-6 cursor-pointer text-gray-400 hover:text-brand-dark" onClick={() => setIsModalOpen(false)} />
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <input 
                    type="file" 
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Room Name / Number</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                        placeholder="e.g. Executive Plus B12" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Short Description</label>
                      <textarea 
                        rows={2}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm resize-none" 
                        placeholder="Highlight the unique features of this unit..." 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Category</label>
                        <select 
                          value={formData.type}
                          onChange={e => setFormData({...formData, type: e.target.value as Room['type']})}
                          className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm bg-transparent"
                        >
                          <option value="Executive Plus">Executive Plus</option>
                          <option value="Executive">Executive</option>
                          <option value="Standard">Standard</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Pricing (GHS)</label>
                        <input 
                          type="number" 
                          required
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                          className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm" 
                          placeholder="600" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Media Portfolio</label>
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-brand-light text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:underline"
                        >
                          <Upload className="w-3 h-3" />
                          Add Images
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative aspect-video group bg-gray-50 border border-gray-100 overflow-hidden">
                            <img src={img} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {formData.images.length === 0 && (
                          <div className="col-span-3 py-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 text-gray-300 gap-2">
                            <ImageIcon className="w-8 h-8" />
                            <p className="text-[10px] uppercase tracking-widest font-bold">No images uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Initial Status</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as Room['status']})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-light text-sm bg-transparent"
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-dark text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-brand-light transition-all mt-6"
                  >
                    {editingId ? 'Update Configuration' : 'Initialize Room'}
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

export default RoomManager;
