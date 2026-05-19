import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { Plus, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';

const SuperAdminDashboard = ({ showNotification }) => {
    const { getToken, isSuperAdmin } = useAuth();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStore, setNewStore] = useState({ name: '', slug: '' });
    const navigate = useNavigate();

    useEffect(() => {
        if (!isSuperAdmin) {
            navigate('/');
            return;
        }
        fetchStores();
    }, [isSuperAdmin, navigate]);

    const fetchStores = async () => {
        try {
            const res = await axios.get(`${__API_URL__}/stores`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setStores(res.data);
        } catch (error) {
            console.error(error);
            showNotification('שגיאה בטעינת חנויות', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStore = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${__API_URL__}/stores`, newStore, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            showNotification('חנות נוצרה בהצלחה', 'success');
            setNewStore({ name: '', slug: '' });
            fetchStores();
        } catch (error) {
            console.error(error);
            showNotification(error.response?.data?.message || 'שגיאה ביצירת חנות', 'error');
        }
    };

    const handleDeleteStore = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק חנות זו? כל הנתונים יימחקו!')) return;
        try {
            await axios.delete(`${__API_URL__}/stores/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            showNotification('חנות נמחקה', 'success');
            fetchStores();
        } catch (error) {
            console.error(error);
            showNotification('שגיאה במחיקת חנות', 'error');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 text-right" dir="rtl">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary">
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter">ניהול פלטפורמה</h1>
                    <p className="text-gray-500 font-medium">ניהול חנויות והגדרות מערכת גלובליות</p>
                </div>
            </div>

            {/* Create Store Form */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-12">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-primary" />
                    הוספת חנות חדשה
                </h2>
                <form onSubmit={handleCreateStore} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">שם החנות</label>
                        <input 
                            type="text"
                            value={newStore.name}
                            onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 ring-primary/20 transition-all"
                            placeholder="למשל: חנות ירקות"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Slug (מזהה ב-URL)</label>
                        <input 
                            type="text"
                            value={newStore.slug}
                            onChange={(e) => setNewStore({...newStore, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 ring-primary/20 transition-all"
                            placeholder="veg-store"
                            required
                        />
                    </div>
                    <div className="flex items-end">
                        <button 
                            type="submit"
                            className="w-full p-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            צור חנות
                        </button>
                    </div>
                </form>
            </div>

            {/* Stores List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map(store => (
                    <div key={store._id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                {store.name[0]}
                            </div>
                            <div className="flex gap-2">
                                <a 
                                    href={`/store/${store.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                                >
                                    <ExternalLink size={20} />
                                </a>
                                <button 
                                    onClick={() => handleDeleteStore(store._id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-1">{store.name}</h3>
                        <p className="text-gray-400 text-sm font-medium mb-4">/store/{store.slug}</p>
                        
                        <div className="flex items-center gap-4 py-4 border-t border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">סטטוס</span>
                                <span className="text-xs font-bold text-green-500">פעיל</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
