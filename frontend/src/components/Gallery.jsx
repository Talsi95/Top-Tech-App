import { useState, useEffect, useRef } from 'react';
import { useStore } from '../StoreContext';
import { FaPlay, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { transformCloudinaryUrl } from '../utils/cloudinary';

const Gallery = () => {
    const { store } = useStore();
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const galleryRef = useRef(null);

    const galleryItems = store?.gallery || [];

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '200px 0px', // Preloads gallery 200px before reaching viewport for professional smooth UX
                threshold: 0.01
            }
        );

        if (galleryRef.current) {
            observer.observe(galleryRef.current);
        }

        return () => observer.disconnect();
    }, []);

    if (galleryItems.length === 0) return null;

    const openModal = (item, index) => {
        setSelectedItem(item);
        setSelectedIndex(index);
    };

    const closeModal = () => setSelectedItem(null);

    const nextItem = (e) => {
        e.stopPropagation();
        const nextIdx = (selectedIndex + 1) % galleryItems.length;
        setSelectedIndex(nextIdx);
        setSelectedItem(galleryItems[nextIdx]);
    };

    const prevItem = (e) => {
        e.stopPropagation();
        const prevIdx = (selectedIndex - 1 + galleryItems.length) % galleryItems.length;
        setSelectedIndex(prevIdx);
        setSelectedItem(galleryItems[prevIdx]);
    };

    const renderMedia = (item) => {
        if (item.type === 'video') {
            const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');
            if (isYouTube) {
                const videoId = item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop();
                return (
                    <div className="w-full h-full min-h-[60vh] md:min-h-[80vh] flex items-center justify-center">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&playsinline=1`}
                            allow="autoplay; encrypted-media; fullscreen"
                            className="w-full h-full aspect-video rounded-3xl shadow-2xl"
                            title={item.title || "Gallery Video"}
                        />
                    </div>
                );
            }
            const isCloudinary = item.url?.includes('cloudinary.com');
            const optimizedUrl = isCloudinary ? transformCloudinaryUrl(item.url) : item.url;
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <video 
                        src={optimizedUrl} 
                        controls 
                        autoPlay 
                        className="w-full h-full max-h-[85vh] object-cover rounded-3xl shadow-2xl" 
                    />
                </div>
            );
        }
        const isCloudinary = item.url?.includes('cloudinary.com');
        const optimizedUrl = isCloudinary ? transformCloudinaryUrl(item.url) : item.url;
        return (
            <div className="w-full h-full flex items-center justify-center">
                <img 
                    src={optimizedUrl} 
                    alt={item.title} 
                    className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl" 
                />
            </div>
        );
    };

    return (
        <div ref={galleryRef} className="mt-20 mb-20 px-6 sm:px-12 min-h-[300px]">
            {isVisible ? (
                <>
                    <h2 className="text-4xl font-black text-gray-900 mb-12 tracking-tight border-r-8 border-primary pr-6">
                        תמונה אחת שווה אלף מילים
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {galleryItems.map((item, index) => {
                            const isCloudinary = item.url?.includes('cloudinary.com');
                            const optimizedUrl = isCloudinary ? transformCloudinaryUrl(item.url) : item.url;
                            return (
                                <div
                                    key={index}
                                    onClick={() => openModal(item, index)}
                                    className="group relative aspect-square overflow-hidden rounded-3xl cursor-pointer bg-gray-100 border border-gray-100 hover:shadow-2xl transition-all duration-500"
                                >
                                    {item.type === 'video' ? (
                                        <div className="w-full h-full relative pointer-events-none">
                                            {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[150%]">
                                                    <iframe
                                                        src={`https://www.youtube-nocookie.com/embed/${item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop()}?autoplay=1&mute=1&loop=1&playlist=${item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop()}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`}
                                                        allow="autoplay; encrypted-media"
                                                        className="w-full h-full border-none"
                                                    />
                                                </div>
                                            ) : (
                                                <video
                                                    src={optimizedUrl}
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                                                <FaPlay size={12} />
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={optimizedUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                                    <span className="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        {item.title || (item.type === 'video' ? 'צפה בסרטון' : 'הגדל תמונה')}
                                    </span>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400 font-medium space-y-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm tracking-wider">טוען גלריה...</span>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={closeModal}
                >
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2 transition-colors z-[110]" onClick={closeModal}>
                        <FaTimes size={32} />
                    </button>

                    <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-4 transition-colors z-[110]" onClick={prevItem}>
                        <FaChevronLeft size={48} />
                    </button>

                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-4 transition-colors z-[110]" onClick={nextItem}>
                        <FaChevronRight size={48} />
                    </button>

                    <div className="w-[90%] max-w-6xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        {renderMedia(selectedItem)}
                        {selectedItem.title && (
                            <div className="mt-6 text-white text-2xl font-black tracking-tight bg-black/50 px-8 py-3 rounded-full backdrop-blur-md">
                                {selectedItem.title}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
