import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, XCircle, ChevronLeft, MapPin, Calendar, Clock, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Booking } from '../types';
import toast from 'react-hot-toast';
import { fetchApi } from '../lib/api';

export default function ManageBooking() {
  const [searchType, setSearchType] = useState<'id' | 'phone'>('id');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBooking(null);
    setShowCancelConfirm(false);

    if (!isSupabaseConfigured) {
      setError('Database configuration is missing. Cannot fetch bookings.');
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('bookings').select('*');
      
      if (searchType === 'id') {
        query = query.eq('booking_id', searchValue);
      } else {
        query = query.eq('phone', searchValue);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false }).limit(1);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setBooking(data[0]);
      } else {
        setError('No booking found with the provided details.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching your booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    setLoading(true);
    try {
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

      const res = await fetchApi('/api/update-booking-status', {
        method: 'POST',
        body: JSON.stringify({ booking_id: booking.booking_id, status: 'Cancelled', adminNumber }),
      });
      
      setBooking({ ...booking, status: 'Cancelled' });
      toast.success('Your booking has been cancelled successfully.');
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel the booking. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6 transition-colors">
          <ChevronLeft size={20} className="mr-1" />
          Back to Home
        </Link>
        
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
              <Search size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Your Booking</h2>
            <p className="text-gray-500 mt-2">View or cancel your existing rides</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setSearchType('id')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${searchType === 'id' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Booking ID
              </button>
              <button
                type="button"
                onClick={() => setSearchType('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${searchType === 'phone' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Phone Number
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === 'id' ? "e.g., BK-12345" : "Your phone number"}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Search size={20} />
              </button>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </form>

          <AnimatePresence>
            {booking && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 border-t border-gray-100 pt-8"
              >
                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Booking ID</p>
                      <p className="text-lg font-bold text-gray-900">{booking.booking_id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      booking.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="text-gray-400 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium text-gray-900 text-sm">{booking.booking_date}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="text-gray-400 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="font-medium text-gray-900 text-sm">{booking.booking_time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 col-span-2">
                      <MapPin className="text-gray-400 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Location</p>
                        <p className="font-medium text-gray-900 text-sm">{booking.pickup_location || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {booking.status === 'Pending' || booking.status === 'Confirmed' ? (
                  showCancelConfirm ? (
                    <div className="bg-red-50 p-4 rounded-xl space-y-3">
                      <p className="text-red-800 text-sm font-medium text-center">Are you sure you want to cancel this booking? This action cannot be undone.</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          disabled={loading}
                          className="flex-1 py-2 px-4 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          Keep Booking
                        </button>
                        <button
                          onClick={handleCancelBooking}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : 'Yes, Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors"
                    >
                      <XCircle size={20} />
                      Cancel Booking
                    </button>
                  )
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    This booking is {booking.status.toLowerCase()} and cannot be modified.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
