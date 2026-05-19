import { useState, useEffect, useRef } from 'react';
import { useStore } from '../StoreContext';
import { transformCloudinaryUrl } from '../utils/cloudinary';

const HeroVideo = () => {
    const { store } = useStore();
    const [isLoaded, setIsLoaded] = useState(false);
    const iframeRef = useRef(null);
    const isFullWidth = store?.features?.fullWidthCards;

    const videoUrl = store?.homePageConfig?.mediaUrls?.[0] || '';
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isCloudinary = videoUrl.includes('cloudinary.com');
    const optimizedVideoUrl = isCloudinary ? transformCloudinaryUrl(videoUrl) : videoUrl;

    const getEmbedUrl = (url) => {
        if (!isYouTube) return url;
        let videoId = '';
        if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else {
            videoId = url.split('/').pop();
        }

        const params = [
            'autoplay=1',
            'mute=1',
            'loop=1',
            `playlist=${videoId}`,
            'controls=0',
            'modestbranding=1',
            'rel=0',
            'iv_load_policy=3',
            'disablekb=1',
            'showinfo=0',
            'fs=0',
            'autohide=1',
            'playsinline=1',
            'enablejsapi=1',
            'origin=' + window.location.origin
        ].join('&');

        return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    };

    const handleIframeLoad = () => {
        setTimeout(() => setIsLoaded(true), 2000);
    };

    // Attempt to keep the video playing smoothly by sending periodic "play" commands
    // to mitigate the "pause/restart" UI flash if YouTube tries to show it.
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
        <div className={`relative w-full h-[75vh] sm:h-[700px] overflow-hidden transition-all duration-700 bg-black mb-12 sm:mb-20 ${isFullWidth ? "rounded-none sm:rounded-[4rem]" : "rounded-[3rem] sm:rounded-[4rem] mx-auto max-w-[96%]"
            }`}>
            {/* 1. THE VIDEO LAYER */}
            <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                {isYouTube ? (
                    /* 
                       EXtreme Cover Logic:
                       To hide YouTube's center icons during restarts, we use a very high scale
                       and youtube-nocookie for a cleaner experience.
                    */
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
                        autoPlay
                        muted
                        loop
                        playsInline
                        onCanPlayThrough={() => setIsLoaded(true)}
                        className="w-full h-full object-cover"
                        src={optimizedVideoUrl}
                    />
                )}
            </div>

            {/* 2. THE ULTIMATE SHIELD - Blocks all interaction */}
            <div className="absolute inset-0 z-50 bg-transparent pointer-events-auto"></div>

            {/* 3. DESIGN OVERLAYS */}
            <div className={`absolute inset-0 z-10 bg-black/40 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}></div>

            {/* 4. CONTENT */}
            {isLoaded && (store?.homePageConfig?.heroTitle || store?.homePageConfig?.heroSubtitle) && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-8 text-white">
                    <div className="max-w-4xl mx-auto">
                        {store.homePageConfig.heroTitle && (
                            <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter drop-shadow-2xl animate-in fade-in zoom-in-95 duration-1000 leading-[0.9]">
                                {store.homePageConfig.heroTitle}
                            </h1>
                        )}
                        {store.homePageConfig.heroSubtitle && (
                            <p className="text-xl md:text-3xl text-white/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                                {store.homePageConfig.heroSubtitle}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* 5. PREMIUM LOADER */}
            {!isLoaded && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-[3px] border-white/5 rounded-full"></div>
                            <div className="absolute inset-0 border-[3px] border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="text-white/40 text-sm font-bold tracking-[0.2em] uppercase animate-pulse">
                            Loading Experience
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroVideo;
