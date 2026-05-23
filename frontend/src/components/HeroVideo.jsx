import { useState, useEffect, useRef } from 'react';
import { useStore } from '../StoreContext';
import { transformCloudinaryUrl } from '../utils/cloudinary';

const HeroVideo = () => {
    const { store } = useStore();
    const [isLoaded, setIsLoaded] = useState(false);
    const [startAnimation, setStartAnimation] = useState(false);
    const iframeRef = useRef(null);
    const isFullWidth = store?.features?.fullWidthCards;

    const videoUrl = store?.homePageConfig?.mediaUrls?.[0] || '';
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isCloudinary = videoUrl.includes('cloudinary.com');
    const optimizedVideoUrl = isCloudinary ? transformCloudinaryUrl(videoUrl) : videoUrl;

    let youtubeVideoId = '';
    if (isYouTube && videoUrl) {
        if (videoUrl.includes('v=')) {
            youtubeVideoId = videoUrl.split('v=')[1]?.split('&')[0];
        } else {
            youtubeVideoId = videoUrl.split('/').pop()?.split('?')[0];
        }
    }

    let posterUrl = '';
    if (isYouTube && youtubeVideoId) {
        posterUrl = `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
    } else if (isCloudinary && videoUrl) {
        posterUrl = videoUrl.replace(/\.[^/.]+$/, ".jpg");
    }

    // הפעלת האנימציה בסנכרון מלא
    useEffect(() => {
        if (isLoaded && store?.homePageConfig?.heroTitle) {
            const timer = setTimeout(() => {
                setStartAnimation(true);
            }, 300); // דיליי להתייצבות אחרי ה-Loader הכללי של האתר

            return () => clearTimeout(timer);
        } else if (!isLoaded) {
            setStartAnimation(false);
        }
    }, [isLoaded, store]);

    const getEmbedUrl = (url) => {
        if (!isYouTube) return url;
        let videoId = '';
        if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else {
            videoId = url.split('/').pop();
        }

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const params = [
            'autoplay=1', 'mute=1', 'loop=1', `playlist=${videoId}`,
            'controls=0', 'modestbranding=1', 'rel=0', 'iv_load_policy=3',
            'disablekb=1', 'showinfo=0', 'fs=0', 'autohide=1', 'playsinline=1',
            'enablejsapi=1', 'origin=' + origin
        ].join('&');

        return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    };

    const handleIframeLoad = () => {
        setTimeout(() => setIsLoaded(true), 2000);
    };

    useEffect(() => {
        if (isYouTube && isLoaded && iframeRef.current) {
            const interval = setInterval(() => {
                try {
                    iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                } catch (e) { }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isYouTube, isLoaded]);

    return (
        <div className={`relative w-full h-[75vh] sm:h-[700px] overflow-hidden transition-all duration-700 bg-black mb-12 sm:mb-20 ${isFullWidth ? "rounded-none sm:rounded-[4rem]" : "rounded-[3rem] sm:rounded-[4rem] mx-auto max-w-[96%]"}`}>

            {/* Poster/Thumbnail Overlay while video is loading */}
            {posterUrl && (
                <div className={`absolute inset-0 w-full h-full z-20 overflow-hidden transition-opacity duration-1000 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <img
                        src={posterUrl}
                        alt="Video Poster"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            if (isYouTube && !e.target.src.includes('hqdefault')) {
                                e.target.src = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
                            }
                        }}
                    />
                </div>
            )}

            {/* 1. THE VIDEO LAYER */}
            <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                {isYouTube ? (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-full min-w-[177.77vh] scale-125 sm:scale-110">
                        <iframe
                            ref={iframeRef}
                            src={getEmbedUrl(videoUrl)}
                            onLoad={handleIframeLoad}
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                            className="w-full h-full border-none pointer-events-none"
                            title="Hero Video"
                        />
                    </div>
                ) : (
                    <video
                        autoPlay muted loop playsInline
                        onCanPlayThrough={() => setIsLoaded(true)}
                        className="w-full h-full object-cover"
                        src={optimizedVideoUrl}
                        poster={posterUrl}
                    />
                )}
            </div>

            {/* 2. THE ULTIMATE SHIELD */}
            <div className="absolute inset-0 z-50 bg-transparent pointer-events-auto"></div>

            {/* 3. DESIGN OVERLAYS */}
            <div className={`absolute inset-0 z-10 bg-black/40 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}></div>

            {/* 4. CONTENT LAYER - ניקוי מוחלט של האנימציות הישנות והגדרת זום אין טהור בלבד */}
            {isLoaded && store?.homePageConfig && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-8 text-white">
                    <div className="max-w-4xl mx-auto">

                        {store.homePageConfig.heroTitle && (
                            <h1 className={`text-5xl md:text-8xl font-black mb-6 tracking-tighter drop-shadow-2xl leading-[0.9]
                                /* הגדרות הטרנזישן: משך הזמן וההחלקה */
                                transition-all duration-1000 ease-out transform
                                /* המעבר: אם האנימציה התחילה נהיה גלויים ובגודל מלא, אחרת שקופים ומכווצים ב-5% */
                                ${startAnimation
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-95'
                                }`}
                            >
                                {store.homePageConfig.heroTitle}
                            </h1>
                        )}

                        {store.homePageConfig.heroSubtitle && (
                            <p className={`text-xl md:text-3xl text-white/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-lg
                                /* הגדרות הטרנזישן: משך הזמן וההחלקה */
                                transition-all duration-1000 ease-out transform
                                /* המעבר: זהה לכותרת */
                                ${startAnimation
                                    ? 'opacity-90 scale-100'
                                    : 'opacity-0 scale-95'
                                }`}
                                /* השהיה של 300ms כדי שהתת-כותרת תיכנס אחרי הכותרת הראשית (Staggered Effect) */
                                style={{ transitionDelay: '300px' }}
                            >
                                {store.homePageConfig.heroSubtitle}
                            </p>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroVideo;