import { useState, useEffect, FormEvent } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  Mail, 
  User as UserIcon,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { User, Role } from '../../types';

const StaffManager = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '', // This should be the user's UID from Firebase Auth if they've registered
    name: '',
    email: '',
    role: 'front_desk' as Role
  });

  useEffect(() => {
    const q = query(collection(db, 'profiles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setStaff(staffData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    });

    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.email || !formData.name) {
      toast.error('Please fill all required fields (including UID)');
      return;
    }

    try {
      await setDoc(doc(db, 'profiles', formData.id), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        updatedAt: serverTimestamp()
      });
      toast.success('Staff profile created successfully');
      setIsModalOpen(false);
      setFormData({ id: '', name: '', email: '', role: 'front_desk' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `profiles/${formData.id}`);
    }
  };

  const removeStaff = async (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      try {
        await deleteDoc(doc(db, 'profiles', id));
        toast.success('Staff removed from system');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `profiles/${id}`);
      }
    }
  };

  return (
    <div className="flex bg-luxury-cream min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 pt-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-display text-4xl text-brand-dark mb-2 font-bold">Staff Operations</h1>
            <p className="text-gray-500 text-sm font-light">Provision and manage secure access for the Kamara Lakeview team.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-dark text-white px-8 py-3 text-xs uppercase tracking-widest font-bold shadow-soft hover:bg-brand-light transition-all flex items-center gap-3"
          >
            <UserPlus className="w-4 h-4" />
            Provision New Staff
          </button>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 py-20 text-center italic text-gray-400">Syncing personnel files...</div>
          ) : staff.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 luxury-shadow border-t-4 border-brand-dark group relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-brand-light/10 rounded-none">
                  <Shield className="w-6 h-6 text-brand-dark" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 bg-brand-dark text-white">
                  {member.role.replace('_', ' ')}
                </span>
              </div>

              <h3 className="font-display text-2xl text-brand-dark mb-1">{member.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-6 font-mono overflow-hidden text-ellipsis whitespace-nowrap">ID: {member.id}</p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <Mail className="w-4 h-4 text-brand-light/60" />
                  <span>{member.email}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => removeStaff(member.id)}
                  className="flex-1 py-3 border border-red-100 text-red-400 text-[10px] uppercase tracking-widest font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Deauthorize
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Provision Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="relative bg-white w-full max-w-xl p-10 md:p-16 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex justify-between items-center mb-12 relative z-10">
                  <h3 className="font-display text-3xl text-brand-dark">Staff Provisioning</h3>
                  <X className="w-6 h-6 cursor-pointer text-gray-400 hover:text-brand-dark" onClick={() => setIsModalOpen(false)} />
                </div>

                <div className="bg-yellow-50 p-4 mb-8 flex gap-4 items-start border-l-4 border-yellow-400">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    <strong>Important:</strong> Enter the unique Firebase UID for the staff member. This correctly maps their authentication to their database profile.
                  </p>
                </div>
                
                <form onSubmit={handleAddStaff} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Registration UID</label>
                    <input 
                      type="text" 
                      required
                      value={formData.id}
                      onChange={e => setFormData({...formData, id: e.target.value})}
                      className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-dark text-sm font-mono" 
                      placeholder="e.g. u8hX7b..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-dark text-sm" 
                        placeholder="Staff Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full border-b border-gray-100 py-3 focus:outline-none focus:border-brand-dark text-sm" 
                        placeholder="staff@kamaralakeview.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Access Level (Role)</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['admin', 'front_desk', 'restaurant', 'kitchen'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({...formData, role: r as Role})}
                          className={`py-3 px-4 text-[10px] uppercase tracking-widest font-bold border transition-all ${
                            formData.role === r 
                              ? 'bg-brand-dark text-white border-brand-dark shadow-md' 
                              : 'bg-white text-gray-400 border-gray-100 hover:border-brand-dark'
                          }`}
                        >
                          {r.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-dark text-white py-5 uppercase tracking-[0.2em] text-xs font-black hover:bg-brand-light transition-all mt-10 shadow-xl flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Activate Staff Profile
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

export default StaffManager;
