import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Room } from '../../types';
import { Loader2, X } from 'lucide-react';

const Gallery = () => {
  const [images, setImages] = useState<{ src: string, roomName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const qRooms = query(collection(db, 'rooms'));
    const qGallery = query(collection(db, 'gallery'));
    
    let roomsImages: { src: string, roomName: string }[] = [];
    let galleryImages: { src: string, roomName: string }[] = [];

    const unsubscribeRooms = onSnapshot(qRooms, (snapshot) => {
      roomsImages = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Room;
        if (data.images && Array.from(data.images).length > 0) {
          data.images.forEach(img => {
            roomsImages.push({ src: img, roomName: data.name });
          });
        }
      });
      combineImages();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rooms');
    });

    const unsubscribeGallery = onSnapshot(qGallery, (snapshot) => {
      galleryImages = snapshot.docs.map(doc => {
        const data = doc.data();
        return { src: data.url, roomName: data.caption || 'Gallery Image' };
      });
      combineImages();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });

    const combineImages = () => {
      const all = [...galleryImages, ...roomsImages];
      if (all.length === 0) {
        setImages([
          { src: '/main-homepage-1.png', roomName: 'Kamara Interior' },
          { src: '/main-homepage-2.png', roomName: 'Serene View' }
        ]);
      } else {
        setImages(all);
      }
      setLoading(false);
    };

    return () => {
      unsubscribeRooms();
      unsubscribeGallery();
    };
  }, []);

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-20">
          <span className="text-brand-dark uppercase tracking-[0.4em] text-xs font-bold mb-4 block">Visual Experience</span>
          <h1 className="font-display text-4xl md:text-6xl text-brand-dark mb-6">Gallery</h1>
          <div className="w-24 h-1 bg-brand-light mx-auto" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="relative aspect-square overflow-hidden rounded-sm group cursor-pointer"
                onClick={() => setSelectedImage(img.src)}
              >
                <img 
                  src={img.src} 
                  alt={img.roomName} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-white font-display text-xl mb-2">{img.roomName}</span>
                  <span className="text-white/70 uppercase tracking-widest text-[10px] font-bold border border-white/20 px-4 py-2 backdrop-blur-sm">Enlarge View</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
              <X className="w-10 h-10" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              className="max-w-full max-h-full object-contain luxury-shadow"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
