import { useEffect } from 'react';

const Notification = ({ message, type, onClose }) => {
    // useEffect ירוץ בכל פעם שההודעה משתנה
    useEffect(() => {
        if (message) {
            // הגדרת טיימר לסגירת ההתראה
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // ההתראה תוסתר לאחר 3 שניות

            // פונקציית ניקוי כדי למנוע דליפות זיכרון
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    // אם אין הודעה, אל תציג כלום
    if (!message) {
        return null;
    }

    // הגדרת סגנון על בסיס סוג ההתראה (success/error)
    const notificationClasses =
        type === 'success'
            ? 'bg-green-500 border-green-700'
            : 'bg-red-500 border-red-700';

    return (
        <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-md shadow-lg transition-transform duration-500 ease-in-out transform scale-100 ${notificationClasses}`}
        >
            {message}
        </div>
    );
};

export default Notification;