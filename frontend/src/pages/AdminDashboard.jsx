import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Users, ShoppingBag, Grid, Wrench, FileText, ChevronLeft } from 'lucide-react';
import ProductFormPage from '../pages/ProductFormPage';
import UserList from '../components/UserList';
import AllOrdersList from '../components/AllOrdersList';
import CategoryManagement from '../components/CategoryManagement';
import RepairManagement from '../components/RepairManagement';
import RepairTypeManagement from '../components/RepairTypeManagement';

/**
 * AdminDashboard Component.
 */
const AdminDashboard = ({ showNotification }) => {
    const { isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('addProduct');

    useEffect(() => {
        if (!isAuthenticated || !isAdmin) {
            showNotification('אין לך הרשאה להיכנס לדף זה', 'error');
            navigate('/');
        }
    }, [isAuthenticated, isAdmin, navigate, showNotification]);

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const renderContent = () => {
        switch (activeTab) {
            case 'addProduct': return <ProductFormPage showNotification={showNotification} />;
            case 'users': return <UserList showNotification={showNotification} />;
            case 'orders': return <AllOrdersList showNotification={showNotification} />;
            case 'categories': return <CategoryManagement showNotification={showNotification} />;
            case 'repairs': return <RepairManagement showNotification={showNotification} />;
            case 'repairTypes': return <RepairTypeManagement showNotification={showNotification} />;
            default: return null;
        }
    };

    const tabs = [
        { id: 'addProduct', label: 'מוצרים', icon: Package },
        { id: 'users', label: 'לקוחות', icon: Users },
        { id: 'orders', label: 'הזמנות', icon: ShoppingBag },
        { id: 'categories', label: 'קטגוריות', icon: Grid },
        { id: 'repairs', label: 'תיקונים', icon: Wrench },
        { id: 'repairTypes', label: 'שירותים', icon: FileText },
    ];

    if (isAuthenticated && isAdmin) {
        return (
            <div className="max-w-[1440px] mx-auto px-6 py-12" dir="rtl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">ניהול מערכת</h2>
                        <p className="text-gray-500 font-medium">שלום מנהל, ברוך הבא ללוח הבקרה שלך</p>
                    </div>
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                    >
                        <span>חזרה לחנות</span>
                        <ChevronLeft size={18} />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <aside className="w-full lg:w-[280px] space-y-2">
                        <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-50 sticky top-24">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-4">תפריט ניהול</h3>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-gray-400'} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-h-[600px]">
                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-50 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-50">
                                {tabs.find(t => t.id === activeTab)?.icon && (
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        {(() => {
                                            const Icon = tabs.find(t => t.id === activeTab).icon;
                                            return <Icon size={24} />;
                                        })()}
                                    </div>
                                )}
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h3>
                            </div>
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return null;
};

export default AdminDashboard;