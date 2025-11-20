import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import UserList from '../components/UserList';
import AllOrdersList from '../components/AllOrdersList';

const AdminDashboard = ({ showNotification }) => {
    const { isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('addProduct');

    useEffect(() => {
        if (!isAuthenticated || !isAdmin) {
            showNotification('אין לך הרשאה להיכנס לדף זה', 'error');
            navigate('/');
        }
    }, [isAuthenticated, isAdmin, navigate, showNotification]);

    const renderContent = () => {
        switch (activeTab) {
            case 'addProduct':
                return <ProductForm showNotification={showNotification} />;
            case 'users':
                return <UserList showNotification={showNotification} />;
            case 'orders':
                return <AllOrdersList showNotification={showNotification} />;
            default:
                return null;
        }
    };

    const TabButton = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`py-2 px-4 font-semibold text-lg transition-colors duration-200 ${activeTab === tabName
                ? 'border-b-4 border-sky-500 text-sky-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
        >
            {label}
        </button>
    );

    if (isAuthenticated && isAdmin) {
        return (
            <div className="container mx-auto p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">איזור מנהל</h2>

                <div className="flex justify-center border-b mb-8 space-x-4">
                    <TabButton tabName="addProduct" label="הוספת מוצר" />
                    <TabButton tabName="users" label="משתמשים" />
                    <TabButton tabName="orders" label="כל ההזמנות" /> {/* 👈 הטאב החדש */}
                </div>

                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </div>
        );
    }

    return null;
};

export default AdminDashboard;