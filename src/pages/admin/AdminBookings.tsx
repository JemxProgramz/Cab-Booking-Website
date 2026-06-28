import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Booking, BookingStatus } from '../../types';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import toast from 'react-hot-toast';
import { Search, Edit2, Trash2, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { fetchApi } from '../../lib/api';
export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBookings = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase configuration is missing. Cannot delete booking.');
      setConfirmDeleteId(null);
      return;
    }
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      toast.success('Booking deleted');
      setConfirmDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    try {
      const updatedBooking = bookings.find(b => b.id === id);
      if (!updatedBooking) throw new Error("Booking not found");

      let adminNumber = '';
      try {
        if (isSupabaseConfigured) {
          const { data: settings } = await supabase.from('settings').select('whatsapp_number').single();
          if (settings?.whatsapp_number) {
            adminNumber = settings.whatsapp_number;
          }
        }
      } catch (err) {
        console.error("Could not fetch settings:", err);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetchApi('/api/update-booking-status', {
        method: 'POST',
        headers: {
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({ booking_id: updatedBooking.booking_id, status, adminNumber }),
      });

      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    
    if (!isSupabaseConfigured) {
      toast.error('Supabase configuration is missing. Cannot update booking.');
      setEditingBooking(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          name: editingBooking.name,
          phone: editingBooking.phone,
          booking_date: editingBooking.booking_date,
          booking_time: editingBooking.booking_time,
          pickup_location: editingBooking.pickup_location,
          status: editingBooking.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingBooking.id);

      if (error) throw error;
      toast.success('Booking updated');
      setEditingBooking(null);
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-800 border-amber-200',
      Confirmed: 'bg-green-100 text-green-800 border-green-200',
      Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>{status}</span>;
  };

  // Filter Logic
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.phone.includes(searchTerm) || 
      b.booking_id.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;

    const bDate = new Date(b.created_at);
    
    switch(filter) {
      case 'Today': return isToday(bDate);
      case 'Tomorrow': return isTomorrow(new Date(b.booking_date));
      case 'This Week': return isThisWeek(bDate);
      case 'Pending':
      case 'Confirmed':
      case 'Completed':
      case 'Cancelled': return b.status === filter;
      default: return true;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage all customer bookings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
            />
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="All">All Bookings</option>
            <option value="Today">Created Today</option>
            <option value="Tomorrow">For Tomorrow</option>
            <option value="This Week">Created This Week</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Booking ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Pickup Location</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading bookings...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No bookings found.</td></tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{booking.booking_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.name}</div>
                      <div className="text-gray-500">{booking.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{booking.booking_date}</div>
                      <div className="text-gray-500">{booking.booking_time}</div>
                    </td>
                    <td className="px-6 py-4 truncate max-w-[200px]" title={booking.pickup_location}>
                      {booking.pickup_location || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {booking.status === 'Pending' && (
                          <button onClick={() => handleUpdateStatus(booking.id, 'Confirmed')} className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded" title="Confirm">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {booking.status === 'Confirmed' && (
                          <button onClick={() => handleUpdateStatus(booking.id, 'Completed')} className="text-emerald-600 hover:text-emerald-800 p-1.5 hover:bg-emerald-50 rounded" title="Complete">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                          <button onClick={() => handleUpdateStatus(booking.id, 'Cancelled')} className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded" title="Cancel">
                            <XCircle size={18} />
                          </button>
                        )}
                        <button onClick={() => setEditingBooking(booking)} className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded" title="Edit">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(booking.id)} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">No bookings found.</div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg text-gray-900">{booking.booking_id}</div>
                  <div className="font-semibold text-gray-800 mt-1 text-base">{booking.name}</div>
                  <div className="text-sm text-gray-500">{booking.phone}</div>
                </div>
                <div>{getStatusBadge(booking.status)}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Date</div>
                  <div className="font-medium text-gray-900">{booking.booking_date}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Time</div>
                  <div className="font-medium text-gray-900">{booking.booking_time}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500 text-xs mb-1">Pickup Location</div>
                  <div className="font-medium text-gray-900 break-words">{booking.pickup_location || '-'}</div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => setEditingBooking(booking)} className="flex-1 flex justify-center items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors">
                  <Edit2 size={16} /> Edit
                </button>
                <button onClick={() => setConfirmDeleteId(booking.id)} className="flex-1 flex justify-center items-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-lg transition-colors">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
              
              {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                <div className="flex flex-wrap items-center gap-2">
                  {booking.status === 'Pending' && (
                    <button onClick={() => handleUpdateStatus(booking.id, 'Confirmed')} className="flex-1 flex justify-center items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2.5 rounded-lg transition-colors shadow-sm">
                      <CheckCircle size={16} /> Accept
                    </button>
                  )}
                  {booking.status === 'Confirmed' && (
                    <button onClick={() => handleUpdateStatus(booking.id, 'Completed')} className="flex-1 flex justify-center items-center gap-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-lg transition-colors shadow-sm">
                      <CheckCircle size={16} /> Complete
                    </button>
                  )}
                  <button onClick={() => handleUpdateStatus(booking.id, 'Cancelled')} className="flex-1 flex justify-center items-center gap-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 px-4 py-2.5 rounded-lg transition-colors">
                    <XCircle size={16} /> Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4">Edit Booking {editingBooking.booking_id}</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={editingBooking.name}
                      onChange={(e) => setEditingBooking({...editingBooking, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                      type="text" 
                      value={editingBooking.phone}
                      onChange={(e) => setEditingBooking({...editingBooking, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={editingBooking.booking_date}
                      onChange={(e) => setEditingBooking({...editingBooking, booking_date: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input 
                      type="time" 
                      value={editingBooking.booking_time}
                      onChange={(e) => setEditingBooking({...editingBooking, booking_time: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                  <input 
                    type="text" 
                    value={editingBooking.pickup_location || ''}
                    onChange={(e) => setEditingBooking({...editingBooking, pickup_location: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value as BookingStatus})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setEditingBooking(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Delete Booking</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this booking? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
