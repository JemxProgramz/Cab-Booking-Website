import { motion } from 'motion/react';
import { Clock, PhoneCall, CalendarDays, ShieldCheck } from 'lucide-react';

export default function ServiceAvailability() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Always Here For You</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Our services are operational 24 hours a day, 7 days a week. Whether it's an early morning flight or a late-night emergency, we're just a call or click away.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "24/7 Booking",
              description: "Book your ride at any hour through our seamless online platform.",
              icon: <Clock size={28} className="text-green-600" />
            },
            {
              title: "Round-the-clock Support",
              description: "Our dedicated customer service team is always awake and ready to assist.",
              icon: <PhoneCall size={28} className="text-green-600" />
            },
            {
              title: "Advanced Scheduling",
              description: "Plan your trips days or weeks in advance with guaranteed availability.",
              icon: <CalendarDays size={28} className="text-green-600" />
            },
            {
              title: "Safe Night Travels",
              description: "Enhanced tracking and verified drivers ensure safety during late-night rides.",
              icon: <ShieldCheck size={28} className="text-green-600" />
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-100 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-green-600 rounded-3xl p-8 sm:p-12 text-center text-white flex flex-col md:flex-row items-center justify-between overflow-hidden relative"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-green-500 opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-green-700 opacity-50 blur-3xl"></div>

          <div className="text-left mb-6 md:mb-0 relative z-10">
            <h3 className="text-3xl font-bold mb-3">Need an urgent ride right now?</h3>
            <p className="text-green-100 text-lg">Our emergency dispatch is available 24/7. Don't wait, give us a call.</p>
          </div>
          <a 
            href="tel:+919342469403" 
            className="relative z-10 inline-flex items-center justify-center space-x-2 bg-white text-green-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-green-50 hover:scale-105 transition-all shadow-lg"
          >
            <PhoneCall size={24} />
            <span>Call Dispatch</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
