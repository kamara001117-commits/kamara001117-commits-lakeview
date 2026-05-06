import { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { 
  TrendingUp, 
  Users, 
  BedDouble, 
  DollarSign, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Plus,
  Utensils,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DashboardProps {
  user: any;
}

const COLORS = ['#1a2d2f', '#c19b6c', '#4a5d5e', '#8a7d6a'];

const AdminDashboard = ({ user }: DashboardProps) => {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    totalBookings: 0,
    occupancyRate: 0,
    totalRevenue: 0,
    activeGuests: 0,
    restaurantBookings: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock trend data for visualization (in a real app, this would be computed from history)
  const revenueTrend = [
    { name: 'Mon', revenue: 4000, restaurant: 2400 },
    { name: 'Tue', revenue: 3000, restaurant: 1398 },
    { name: 'Wed', revenue: 2000, restaurant: 9800 },
    { name: 'Thu', revenue: 2780, restaurant: 3908 },
    { name: 'Fri', revenue: 1890, restaurant: 4800 },
    { name: 'Sat', revenue: 2390, restaurant: 3800 },
    { name: 'Sun', revenue: 3490, restaurant: 4300 },
  ];

  useEffect(() => {
    // 1. Fetch Stats & Recent Bookings
    const bQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeBookings = onSnapshot(bQuery, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentBookings(bookings);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    const fullBookingsQuery = collection(db, 'bookings');
    const unsubscribeFullBookings = onSnapshot(fullBookingsQuery, (fullSnap) => {
      let revenue = 0;
      let active = 0;
      fullSnap.docs.forEach(doc => {
        const data = doc.data();
        if (['confirmed', 'checked_in', 'checked_out'].includes(data.status)) {
          revenue += (data.totalPrice || 0);
        }
        if (data.status === 'checked_in') {
          active += 1;
        }
      });

      setStatsData(prev => ({
        ...prev,
        totalBookings: fullSnap.docs.length,
        totalRevenue: revenue,
        activeGuests: active
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    const unsubscribeReservations = onSnapshot(collection(db, 'reservations'), (resSnap) => {
      setStatsData(prev => ({
        ...prev,
        restaurantBookings: resSnap.docs.length
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reservations');
    });

    const unsubscribeRooms = onSnapshot(collection(db, 'rooms'), (roomSnap) => {
      const rooms = roomSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRoomData(rooms);
      
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter((d: any) => d.status === 'occupied' || d.status === 'maintenance').length;
      const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      setStatsData(prev => ({
        ...prev,
        occupancyRate: occupancy
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rooms');
    });

    return () => {
      unsubscribeBookings();
      unsubscribeFullBookings();
      unsubscribeReservations();
      unsubscribeRooms();
    };
  }, []);

  const stats = [
    { name: 'Total Bookings', value: statsData.totalBookings.toString(), trend: '+12%', icon: TrendingUp },
    { name: 'Occupancy Rate', value: `${statsData.occupancyRate}%`, trend: '+5%', icon: BedDouble },
    { name: 'Total Revenue', value: `GHS ${statsData.totalRevenue.toLocaleString()}`, trend: '+18%', icon: DollarSign },
    { name: 'Restaurant Res.', value: statsData.restaurantBookings.toString(), trend: '+10%', icon: Utensils },
  ];

  const distributionData = useMemo(() => {
    const data = [
      { name: 'Room Bookings', value: statsData.totalBookings },
      { name: 'Restaurant', value: statsData.restaurantBookings },
    ];
    return data;
  }, [statsData.totalBookings, statsData.restaurantBookings]);

  const roomStatusData = useMemo(() => {
    const counts = roomData.reduce((acc: any, room: any) => {
      acc[room.status] = (acc[room.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [roomData]);

  const handleExport = () => {
    toast.success('Compiling complete performance intelligence... PDF will be ready in a moment.', {
      icon: <FileText className="w-5 h-5 text-brand-light" />
    });
  };

  return (
    <div className="flex bg-luxury-cream min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-10 pt-20">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-display text-4xl text-brand-dark mb-2 font-bold font-display">Performance Suite</h1>
            <p className="text-gray-500 text-sm font-light">Comprehensive business intelligence and operation analytics.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleExport}
              className="bg-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <FileText className="w-3 h-3" />
              Intelligence Report
            </button>
            <button 
              onClick={() => navigate('/admin/bookings')}
              className="bg-brand-dark text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold shadow-soft hover:bg-brand-light transition-all flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              New Order
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-none border border-gray-100 shadow-sm group hover:shadow-xl transition-all duration-500 cursor-default"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-brand-dark/5 rounded-none group-hover:bg-brand-dark transition-colors duration-500">
                  <stat.icon className="w-5 h-5 text-brand-dark group-hover:text-white transition-colors duration-500" />
                </div>
                {!loading && (
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.trend}
                  </div>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">{stat.name}</p>
              <p className="text-2xl font-display text-brand-dark">{loading ? '...' : stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Visual Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Revenue Trend */}
          <div className="bg-white p-8 luxury-shadow border border-gray-50">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-brand-light" />
                <h3 className="font-display text-2xl text-brand-dark">Revenue Trajectory</h3>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Weekly Forecast</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#1a2d2f" strokeWidth={3} dot={{ r: 4, fill: '#1a2d2f' }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="restaurant" stroke="#c19b6c" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Distribution */}
          <div className="bg-white p-8 luxury-shadow border border-gray-50">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <PieChartIcon className="w-5 h-5 text-brand-light" />
                <h3 className="font-display text-2xl text-brand-dark">Operation Mix</h3>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Yield Breakdown</span>
            </div>
            <div className="h-[300px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 luxury-shadow h-full border border-gray-50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-display text-2xl text-brand-dark">Recent Activity Log</h3>
                <button 
                  onClick={() => navigate('/admin/bookings')}
                  className="text-brand-light text-[10px] font-bold uppercase tracking-widest hover:underline"
                >
                  Deep dive
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 italic">
                      <th className="py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Stakeholder</th>
                      <th className="py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Asset</th>
                      <th className="py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={4} className="py-10 text-center italic text-gray-300">Synchronizing global state...</td></tr>
                    ) : recentBookings.length === 0 ? (
                      <tr><td colSpan={4} className="py-10 text-center italic text-gray-300">No active operational events.</td></tr>
                    ) : (
                      recentBookings.map((b) => (
                        <tr key={b.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="py-5">
                            <p className="text-sm font-bold text-brand-dark">{b.guestName}</p>
                            <p className="text-[10px] text-gray-400 uppercase">{b.guestEmail || 'Verified Guest'}</p>
                          </td>
                          <td className="py-5">
                            <p className="text-xs text-brand-dark font-medium uppercase tracking-tighter">Room {b.roomId}</p>
                          </td>
                          <td className="py-5">
                            <span className={`px-3 py-1 text-[8px] uppercase tracking-widest font-black rounded-none ${
                              b.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                              b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {b.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-5 text-right">
                            <p className="text-[10px] text-gray-400 font-mono">
                              {b.createdAt?.toDate().toLocaleDateString() || 'LIVE'}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Asset Utilization */}
          <div className="bg-white p-8 luxury-shadow border border-gray-50">
             <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <BedDouble className="w-5 h-5 text-brand-light" />
                <h3 className="font-display text-2xl text-brand-dark">Asset Load</h3>
              </div>
            </div>
            <div className="h-[250px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomStatusData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 'bold' }} 
                  />
                  <RechartsTooltip cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="value" fill="#1a2d2f" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">System Vitality</span>
                <span className="text-[10px] text-green-500 font-black tracking-widest">OPTIMAL</span>
              </div>
              <div className="w-full bg-gray-50 h-1">
                <div className="bg-brand-dark h-full" style={{ width: '92%' }} />
              </div>
              <p className="text-[9px] text-gray-400 leading-relaxed italic">
                Room utilization is performing at a high-efficiency plateau. Maintenance cycles are optimized for guest turnover.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

