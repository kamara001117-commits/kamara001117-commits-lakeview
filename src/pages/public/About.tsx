import { motion } from 'motion/react';

const About = () => {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 bg-luxury-cream min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-dark uppercase tracking-[0.4em] text-xs font-bold mb-4 block"
          >
            Our Story
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl text-brand-dark mb-8 leading-tight"
          >
            Authentic Warmth.<br />
            <span className="italic">Timeless Elegance.</span>
          </motion.h1>
          <div className="w-24 h-1 bg-brand-light mx-auto" />
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-2xl relative group"
          >
            <img 
              src="/main-homepage-2.png" 
              alt="Hotel Interior" 
              className="w-full aspect-video md:aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-brand-dark/10 group-hover:bg-transparent transition-colors" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-start gap-4">
              <span className="text-brand-light font-display text-6xl opacity-30 mt-[-10px]">"</span>
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed italic font-light">
                At Kamara Lakeview Hotel, we believe that true hospitality is not just about where you stay—but how you feel.
              </p>
            </div>

            <p className="text-gray-600 leading-relaxed text-base md:text-lg">
              Nestled in the calm surroundings of Bamahu, Wa, our hotel offers a peaceful retreat where modern elegance meets authentic Ghanaian warmth. Every room is thoughtfully designed with comfort, privacy, and beauty in mind—creating an experience that feels both luxurious and personal.
            </p>

            <p className="text-gray-600 leading-relaxed text-base md:text-lg">
              Whether you are visiting for business, relaxation, or exploration, Kamara Lakeview Hotel is your home away from home—where every detail is crafted to give you rest, clarity, and unforgettable moments.
            </p>

            <div className="pt-8">
              <div className="flex items-center gap-6">
                <div className="h-[1px] w-12 bg-brand-dark opacity-30" />
                <span className="text-brand-dark uppercase tracking-widest text-sm font-semibold">Management Team</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
