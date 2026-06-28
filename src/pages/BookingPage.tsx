import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Clock, User, Phone, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';
import { fetchApi } from '../lib/api';

export default function BookingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const todayDate = new Date();
  const initialDate = `${todayDate.getDate().toString().padStart(2, '0')}/${(todayDate.getMonth() + 1).toString().padStart(2, '0')}/${todayDate.getFullYear()}`;
  
  let hours = todayDate.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const initialTime = `${hours.toString().padStart(2, '0')}:${todayDate.getMinutes().toString().padStart(2, '0')} ${ampm}`;
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    booking_date: initialDate,
    booking_time: initialTime,
    pickup_location: ''
  });

  const generateBookingId = () => {
    return `BK-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateParts = formData.booking_date.split('/');
      const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : formData.booking_date;

      const bookingData = {
        booking_id: generateBookingId(),
        name: formData.name,
        phone: formData.phone,
        booking_date: isoDate,
        booking_time: formData.booking_time,
        pickup_location: formData.pickup_location,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to Supabase
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

      const res = await fetchApi('/api/create-booking', {
        method: 'POST',
        body: JSON.stringify({ booking: bookingData, adminNumber })
      });

      setSuccess(true);
      setFormData({ name: '', phone: '', booking_date: initialDate, booking_time: initialTime, pickup_location: '' });
      
      setTimeout(() => navigate('/'), 5000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-24">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-10 border border-gray-100 relative overflow-hidden"
        >
          <AnimatePresence>
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center text-center p-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 size={72} className="text-green-500 mb-6" />
                </motion.div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Booking Received!</h3>
                <p className="text-lg text-gray-600 max-w-sm">We have received your booking details and will contact you shortly to confirm your ride.</p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-8 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium"
                >
                  Return to Home
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mb-8 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Book Your Ride</h2>
            <p className="text-gray-500 mt-2 text-lg">Fill out the details below and we will get back to you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all shadow-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all shadow-sm"
                    placeholder="+91 12345 67890"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Booking Date *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="text"
                    name="booking_date"
                    required
                    value={formData.booking_date}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 8) val = val.substring(0, 8);
                      
                      let formatted = val;
                      if (val.length > 2) {
                        formatted = val.substring(0, 2) + '/' + val.substring(2);
                      }
                      if (val.length > 4) {
                        formatted = formatted.substring(0, 5) + '/' + val.substring(4);
                      }
                      
                      setFormData(prev => ({ ...prev, booking_date: formatted }));
                    }}
                    onBlur={(e) => {
                       const val = e.target.value;
                       if (val.length === 10) {
                         const [d, m, y] = val.split('/').map(Number);
                         const inputDate = new Date(y, m - 1, d);
                         const todayDate = new Date();
                         todayDate.setHours(0,0,0,0);
                         
                         if (inputDate < todayDate) {
                           setFormData(prev => ({ ...prev, booking_date: initialDate }));
                           toast.error("Booking date cannot be in the past.");
                         }
                       }
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Booking Time *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Clock size={18} />
                  </div>
                  <div className="flex items-center w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all shadow-sm bg-white">
                    <input
                      type="text"
                      className="bg-transparent outline-none text-gray-900 font-medium w-8 text-center placeholder-gray-400"
                      value={formData.booking_time.split(':')[0]}
                      placeholder="HH"
                      maxLength={2}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length === 2 && parseInt(val) > 12) val = '12';
                        if (val.length === 2 && parseInt(val) === 0) val = '01';
                        const parts = formData.booking_time.split(' ');
                        const timeParts = parts[0].split(':');
                        const ampm = parts[1] || 'AM';
                        setFormData(prev => ({ ...prev, booking_time: `${val}:${timeParts[1] || '00'} ${ampm}` }));
                      }}
                    />
                    <span className="mx-1 text-gray-500 font-bold">:</span>
                    <input
                      type="text"
                      className="bg-transparent outline-none text-gray-900 font-medium w-8 text-center placeholder-gray-400"
                      value={formData.booking_time.split(' ')[0].split(':')[1] || ''}
                      placeholder="MM"
                      maxLength={2}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length === 2 && parseInt(val) > 59) val = '59';
                        const parts = formData.booking_time.split(' ');
                        const timeParts = parts[0].split(':');
                        const ampm = parts[1] || 'AM';
                        setFormData(prev => ({ ...prev, booking_time: `${timeParts[0] || '12'}:${val} ${ampm}` }));
                      }}
                    />
                    <select
                      className="bg-transparent outline-none appearance-none cursor-pointer text-gray-900 font-medium ml-2"
                      value={formData.booking_time.split(' ')[1] || 'AM'}
                      onChange={(e) => {
                        const parts = formData.booking_time.split(' ');
                        const timeParts = parts[0].split(':');
                        setFormData(prev => ({ ...prev, booking_time: `${timeParts[0] || '10'}:${timeParts[1] || '00'} ${e.target.value}` }));
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Pickup Location (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all shadow-sm"
                  placeholder="Enter full address or landmark"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl mt-8 transition-colors shadow-lg shadow-green-600/30 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Confirm Booking'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
