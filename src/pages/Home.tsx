import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Clock, Phone, PhoneCall, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import ServiceAvailability from '../components/ServiceAvailability';

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white pt-16 pb-32 overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-green-50/50" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0% 100%)' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                உங்களது தேவையே! <br />
                எங்களது சேவை! <br />
                <span className="text-green-600 text-2xl md:text-3xl lg:text-4xl block mt-4 font-bold leading-snug">
                  என்றென்றும் மக்கள் சேவையில்<br />மங்கை ராம் ஆட்டோ
                </span>
                <span className="text-gray-700 text-xl md:text-2xl block mt-2 font-semibold">
                  24 / 7 Services Available
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Book your ride in seconds. Safe, affordable, and available whenever you need. Experience premium travel with Ram Autos & Cabs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/book" className="bg-green-600 text-white px-8 py-4 rounded-full font-medium shadow-lg shadow-green-600/30 hover:bg-green-700 transition-colors flex items-center gap-3 text-lg">
                  Book Now
                </Link>
                <a href="tel:+919342469403" className="bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-full font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-3 text-lg">
                  <Phone size={24} /> Call Us
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Vehicles Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vehicles</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We maintain a diverse fleet of well-maintained vehicles to cater to all your travel needs.</p>
          </div>
          
          <div className="relative group/carousel">
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 sm:-ml-6 z-10 bg-white shadow-md rounded-full p-2 text-gray-800 hover:text-green-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:block border border-gray-100"
              aria-label="Previous vehicle"
            >
              <ChevronLeft size={24} />
            </button>
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            >
              {[
                { name: 'Auto Rickshaw 1', img: '/auto1.png', imageClass: 'object-cover scale-110 group-hover:scale-125' },
                { name: 'Auto Rickshaw 2', img: '/auto2.png', imageClass: 'object-cover scale-110 group-hover:scale-125' },
                { name: 'Auto Rickshaw 3', img: '/auto3.png', imageClass: 'object-contain p-4 group-hover:scale-105' },
                { name: 'Economy Sedan', img: '/car1.png', imageClass: 'object-cover scale-110 group-hover:scale-125' },
                { name: 'Hatchback', img: '/car2.png', imageClass: 'object-cover scale-110 group-hover:scale-125' }
              ].map((vehicle, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/3] shadow-sm border border-gray-100 flex-none w-[80vw] sm:w-[320px] snap-center bg-white"
                >
                  <img 
                    src={vehicle.img} 
                    alt={vehicle.name} 
                    className={`w-full h-full transition-transform duration-500 ${vehicle.imageClass}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-white font-semibold text-lg">{vehicle.name}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 sm:-mr-6 z-10 bg-white shadow-md rounded-full p-2 text-gray-800 hover:text-green-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:block border border-gray-100"
              aria-label="Next vehicle"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Service Availability Section */}
      <ServiceAvailability />

      {/* Services/Features Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We provide premium transportation services with a focus on safety, comfort, and reliability.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Fast & Reliable', desc: 'Quick response times and punctual drivers you can always count on.', icon: <Clock size={24} className="text-green-600" /> },
              { title: 'Safe Travel', desc: 'All our vehicles are regularly inspected and driven by verified professionals.', icon: <CheckCircle2 size={24} className="text-green-600" /> },
              { title: 'Affordable Pricing', desc: 'Transparent pricing with no hidden charges. Premium service at competitive rates.', icon: <MapPin size={24} className="text-green-600" /> },
              { title: '24/7 Service', desc: 'Available round the clock for all your transportation needs, day or night.', icon: <PhoneCall size={24} className="text-green-600" /> }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:hidden text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-900">About Ram Autos & Cabs</h2>
          </motion.div>
          <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 hidden md:block">About Ram Autos & Cabs</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Ram Autos & Cabs started with a simple vision: to make everyday travel seamless, secure, and stress-free for everyone. Over the years, we have grown from a small local taxi service into a trusted travel partner for thousands of commuters.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Whether it's a quick trip to the market, a daily office commute, or a long-distance outstation journey, our fleet of well-maintained vehicles and professional drivers ensure you reach your destination comfortably and on time. We take pride in our customer-first approach and our dedication to continuous improvement.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="relative rounded-full overflow-hidden shadow-xl w-64 h-64 md:w-80 md:h-80 mb-6 border-4 border-white ring-4 ring-gray-50">
                <img 
                  src="/owner.png" 
                  alt="Owner" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Mr. Ram</h3>
              <p className="text-green-600 font-medium mb-4">Founder & Owner</p>
              <p className="text-gray-600 max-w-sm">
                "மகிழ்வித்து மகிழ்!<br />
                சேவை செய்து வாழ்வோம், துன்பம் துடைத்து அன்பைத் தந்து மகிழ்வோம்!<br />
                வாழ்க வளமுடன்!"
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
