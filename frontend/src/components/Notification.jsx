import { useEffect } from 'react';

const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) {
        return null;
    }

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