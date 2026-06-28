import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { isToday } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    if (!isSupabaseConfigured) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
        fetchStats(); // Refetch stats on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('bookings').select('*');
      if (error) throw error;

      const todayBookings = data.filter(b => isToday(new Date(b.created_at)));

      setStats({
        total: data.length,
        today: todayBookings.length,
        pending: data.filter(b => b.status === 'Pending').length,
        confirmed: data.filter(b => b.status === 'Confirmed').length,
        completed: data.filter(b => b.status === 'Completed').length,
        cancelled: data.filter(b => b.status === 'Cancelled').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Bookings', value: stats.total, icon: <BarChart3 size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: "Today's Bookings", value: stats.today, icon: <TrendingUp size={24} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending', value: stats.pending, icon: <Clock size={24} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Confirmed', value: stats.confirmed, icon: <CheckCircle size={24} />, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Completed', value: stats.completed, icon: <CheckCircle size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Cancelled', value: stats.cancelled, icon: <XCircle size={24} />, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
