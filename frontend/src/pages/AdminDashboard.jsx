import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import ProductFormPage from '../pages/ProductFormPage';
import UserList from '../components/UserList';
import AllOrdersList from '../components/AllOrdersList';
import CategoryManagement from '../components/CategoryManagement';
import RepairManagement from '../components/RepairManagement';
import RepairTypeManagement from '../components/RepairTypeManagement';

/**
 * AdminDashboard Component.
 * The central management interface for administrators, featuring tabs for products, users, orders, and categories.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
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

    /**
     * Renders the component corresponding to the active tab.
     * @returns {ReactNode} The component to render.
     */
    const renderContent = () => {
        switch (activeTab) {
            case 'addProduct':
                return <ProductFormPage showNotification={showNotification} />;
            case 'users':
                return <UserList showNotification={showNotification} />;
            case 'orders':
                return <AllOrdersList showNotification={showNotification} />;
            case 'categories':
                return <CategoryManagement showNotification={showNotification} />;
            case 'repairs':
                return <RepairManagement showNotification={showNotification} />;
            case 'repairTypes':
                return <RepairTypeManagement showNotification={showNotification} />;
            default:
                return null;
        }
    };

    /**
     * Helper component for rendering a tab navigation button.
     * @param {Object} props - Component props.
     * @param {string} props.tabName - The identifier for the tab.
     * @param {string} props.label - The display name for the tab.
     */
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
                    <TabButton tabName="orders" label="כל ההזמנות" />
                    <TabButton tabName="categories" label="ניהול קטגוריות" />
                    <TabButton tabName="repairs" label="תיקונים" />
                    <TabButton tabName="repairTypes" label="סוגי תיקונים" />
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