import { useEffect, useRef, useState } from 'react';

const RevealOnScroll = ({ children, delay = 0 }) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const rootMarginValue = isMobile ? '0px 0px -25% 0px' : '0px 0px -10% 0px';

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsIntersecting(true);
                    if (ref.current) observer.unobserve(ref.current);
                }
            },
            {
                threshold: 0.05,
                rootMargin: rootMarginValue
            }
        );

        if (ref.current) observer.observe(ref.current);
        return () => { if (ref.current) observer.unobserve(ref.current); };
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-1000 ease-out transform ${isIntersecting
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12 pointer-events-none'
                }`}
        >
            {children}
        </div>
    );
};

export default RevealOnScroll;