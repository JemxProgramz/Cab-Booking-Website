import { Outlet, Link } from 'react-router-dom';
import { Car, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 z-50">
            <img src="/logo.png" alt="Ram Autos and Cabs" className="h-16 w-auto object-cover rounded-xl" onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2316a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>';
            }} />
            <span className="font-bold text-lg sm:text-xl tracking-tight text-gray-900">Ram Cabs & Travels</span>
          </Link>
          
          <nav className="hidden md:flex gap-8 font-medium text-sm">
            <a href="/#home" className="text-gray-900 hover:text-green-600 transition-colors">Home</a>
            <a href="/#about" className="text-gray-600 hover:text-green-600 transition-colors">About Us</a>
            <a href="/#services" className="text-gray-600 hover:text-green-600 transition-colors">Services</a>
            <Link to="/manage" className="text-gray-600 hover:text-green-600 transition-colors">Manage Booking</Link>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <Link to="/book" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-medium text-sm transition-colors shadow-sm shadow-green-600/20">
              Book Ride
            </Link>
          </div>

          <button 
            className="md:hidden p-2 text-gray-600 z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-0 left-0 w-full h-screen bg-white z-40 flex flex-col pt-20 px-4">
            <nav className="flex flex-col gap-6 font-medium text-lg text-center">
              <a href="/#home" onClick={() => setMobileMenuOpen(false)} className="text-gray-900 hover:text-green-600 transition-colors">Home</a>
              <a href="/#about" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 hover:text-green-600 transition-colors">About Us</a>
              <a href="/#services" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 hover:text-green-600 transition-colors">Services</a>
              <Link to="/manage" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 hover:text-green-600 transition-colors">Manage Booking</Link>
              <Link to="/book" onClick={() => setMobileMenuOpen(false)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-sm mt-4">
                Book Ride
              </Link>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-50 py-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Ram Autos and Cabs" className="h-8 w-auto object-cover rounded-md" onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2316a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>';
            }} />
            <span className="font-bold text-base text-gray-900">Ram Cabs & Travels</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Ram Cabs & Travels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
