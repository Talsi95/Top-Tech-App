const Logo = ({ className = "h-12 w-auto" }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 300"
            className={className}
        >
            <defs>

                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="50%" stopColor="#4FACFE" />
                    <stop offset="100%" stopColor="#0000FF" />
                </linearGradient>


                <linearGradient id="accentGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7F00FF" />
                    <stop offset="100%" stopColor="#E100FF" />
                </linearGradient>


                <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#334155" />
                </linearGradient>


                <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="2" dy="8" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
                </filter>
            </defs>

            <g transform="translate(50, 50)">
                <g filter="url(#softShadow)">
                    <path d="M 40,100 C 40,40 100,40 130,100 C 160,160 220,160 220,100 C 220,40 160,40 130,100 C 100,160 40,160 40,100 Z"
                        fill="none"
                        stroke="url(#flowGradient)"
                        strokeWidth="24"
                        strokeLinecap="round"
                        strokeLinejoin="round" />

                    <circle cx="220" cy="100" r="14" fill="url(#accentGradient)" />
                    <circle cx="40" cy="100" r="8" fill="#00F2FE" />
                </g>

                <g transform="translate(280, 120)">
                    <text font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                        font-size="82"
                        font-weight="800"
                        fill="url(#textGradient)"
                        letter-spacing="-1.5">Flow</text>

                    <text x="185" y="0"
                        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                        font-size="82"
                        font-weight="400"
                        fill="url(#accentGradient)"
                        letter-spacing="-1">io</text>

                    <circle cx="203" cy="-76" r="9" fill="url(#flowGradient)" />
                </g>
            </g>
        </svg>
    );
};

export default Logo;
