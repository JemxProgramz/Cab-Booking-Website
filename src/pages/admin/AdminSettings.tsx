import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Settings } from '../../types';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { Save, Store, Phone, MessageCircle, MapPin, QrCode, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    id: '1',
    business_name: 'Ram Cabs & Travels',
    phone_number: '+1234567890',
    whatsapp_number: '+91 9342469403',
    business_address: '123 Main St, City, Country'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{ isConnected: boolean; hasQr: boolean; qr?: string } | null>(null);
  const [reconnectingWa, setReconnectingWa] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchWhatsappStatus();
    const interval = setInterval(fetchWhatsappStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchWhatsappStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = await fetchApi('/api/whatsapp-status', {
        headers: {
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        }
      });
      setWhatsappStatus(data);
    } catch (e) {
      // Ignore fetch errors to avoid console noise when server is restarting
    }
  };

  const handleReconnectWhatsapp = async () => {
    setReconnectingWa(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchApi('/api/whatsapp-reconnect', { 
        method: 'POST',
        headers: {
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        }
      });
      toast.success('Reconnection requested');
      fetchWhatsappStatus();
    } catch (e) {
      toast.error('Failed to request reconnect');
    } finally {
      setReconnectingWa(false);
    }
  };

  const fetchSettings = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      
      // If table doesn't exist or is empty, we just use default state
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.log('Using default settings (table might not exist yet)');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (!isSupabaseConfigured) {
      toast.error('Supabase configuration is missing. Settings cannot be saved.');
      setSaving(false);
      return;
    }

    try {
      // Upsert settings (assuming id '1')
      const { error } = await supabase.from('settings').upsert({
        ...settings,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings. Check if table exists in Supabase.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Update your business information and contact details.</p>
      </div>

      {whatsappStatus && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="text-green-600" />
                WhatsApp Notification Service
              </h2>
              <p className="text-gray-500 text-sm mt-1">Scan the QR code to link your WhatsApp account for notifications.</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${whatsappStatus.isConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {whatsappStatus.isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {whatsappStatus.isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          {!whatsappStatus.isConnected && whatsappStatus.hasQr && whatsappStatus.qr && (
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100 mb-6">
              <div className="bg-white p-4 shadow-sm rounded-lg mb-4">
                <QRCode value={whatsappStatus.qr.replace('https://wa.me/settings/linked_devices#', '')} size={256} />
              </div>
              <p className="text-sm font-medium text-gray-700 text-center">Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device</p>
            </div>
          )}

          {!whatsappStatus.isConnected && !whatsappStatus.hasQr && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-100 mb-6 text-center">
              <QrCode size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No QR code available right now. The service might be starting up or has timed out.</p>
              <button 
                type="button"
                onClick={handleReconnectWhatsapp}
                disabled={reconnectingWa}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={reconnectingWa ? 'animate-spin' : ''} />
                Generate New QR Code
              </button>
            </div>
          )}
          
          {whatsappStatus.isConnected && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
              <MessageCircle className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Service is active</h4>
                <p className="text-sm text-green-700 mt-1">You will receive booking notifications to the admin number configured below.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Business Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Store size={18} />
                  </div>
                  <input
                    type="text"
                    value={settings.business_name}
                    onChange={(e) => setSettings({...settings, business_name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="text"
                    value={settings.phone_number}
                    onChange={(e) => setSettings({...settings, phone_number: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MessageCircle size={18} />
                  </div>
                  <input
                    type="text"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Business Address</label>
              <div className="relative">
                <div className="absolute top-3 left-3 text-gray-400">
                  <MapPin size={18} />
                </div>
                <textarea
                  value={settings.business_address}
                  onChange={(e) => setSettings({...settings, business_address: e.target.value})}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={18} /> Save Settings</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
