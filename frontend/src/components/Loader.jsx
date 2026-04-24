const Loader = ({ text = "טוען נתונים...", subtext = "" }) => {
    return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <p className="text-blue-600 font-medium animate-pulse">
                {text}
            </p>
            {subtext && (
                <p className="text-blue-500/60 text-sm italic">
                    {subtext}
                </p>
            )}
        </div>
    );
};

export default Loader;