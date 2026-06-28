export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  booking_id: string;
  name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  pickup_location?: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  business_name: string;
  phone_number: string;
  whatsapp_number: string;
  business_address: string;
}
