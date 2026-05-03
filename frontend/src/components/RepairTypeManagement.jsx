import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Loader from '../components/Loader';

const initialNewRepairType = {
    name: '',
    price: '',
    description: ''
};

const RepairTypeManagement = ({ showNotification }) => {
    const { getToken } = useAuth();
    const [repairTypes, setRepairTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newRepairType, setNewRepairType] = useState(initialNewRepairType);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchRepairTypes = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${__API_URL__}/repair-types`);
            setRepairTypes(response.data);
        } catch (error) {
            showNotification('שגיאה בשליפת סוגי התיקונים.', 'error');
            console.error('Fetch repair types error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRepairTypes();
    }, []);

    const handleInputChange = (e) => {
        setNewRepairType({ ...newRepairType, [e.target.name]: e.target.value });
    };

    const createRepairType = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!newRepairType.name || !newRepairType.price) {
            showNotification('שם ומחיר הם שדות חובה.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = getToken();
            await axios.post(`${__API_URL__}/repair-types`, newRepairType, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            showNotification('סוג תיקון נוצר בהצלחה!', 'success');
            setNewRepairType(initialNewRepairType);
            fetchRepairTypes();
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה ביצירת סוג תיקון.';
            showNotification(message, 'error');
            console.error('Create repair type error:', error.response || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteRepairType = async (id, name) => {
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק את סוג התיקון "${name}"?`)) {
            return;
        }
        try {
            const token = getToken();
            await axios.delete(`${__API_URL__}/repair-types/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showNotification(`סוג התיקון "${name}" נמחק בהצלחה.`, 'success');
            fetchRepairTypes();
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה במחיקת סוג תיקון.';
            showNotification(message, 'error');
            console.error('Delete repair type error:', error.response || error);
        }
    };

    if (isLoading) return <Loader text="טוען סוגי תיקונים" />;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">🏷️ ניהול מחירון תיקונים</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* טופס הוספת סוג תיקון */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-sky-100 h-fit">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-sky-700">הוספת סוג תיקון חדש</h3>
                    <form onSubmit={createRepairType} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">שם התיקון (לדוגמה: החלפת מסך)</label>
                            <input
                                type="text"
                                name="name"
                                value={newRepairType.name}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">מחיר (לדוגמה: ₪150 או החל מ-₪200)</label>
                            <input
                                type="text"
                                name="price"
                                value={newRepairType.price}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">תיאור קצר (יוצג ללקוח)</label>
                            <textarea
                                name="description"
                                value={newRepairType.description}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3 rounded-xl text-lg font-bold transition-colors ${isSubmitting ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {isSubmitting ? 'שומר...' : '➕ הוסף למחירון'}
                        </button>
                    </form>
                </div>

                {/* רשימת סוגי התיקונים */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">📋 מחירון קיים ({repairTypes.length})</h3>
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                        {repairTypes.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">לא הוגדרו עדיין סוגי תיקונים.</p>
                        ) : (
                            repairTypes.map(type => (
                                <div key={type._id} className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition duration-150 rounded-lg flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-lg text-sky-800">{type.name}</h4>
                                        <p className="text-gray-600 font-semibold text-sm">{type.price}</p>
                                        {type.description && <p className="text-sm text-gray-500 mt-1">{type.description}</p>}
                                    </div>
                                    <button
                                        onClick={() => deleteRepairType(type._id, type.name)}
                                        className="text-red-500 hover:text-red-700 text-sm font-semibold py-1 px-3 rounded-full border border-red-300 transition-colors ml-2"
                                    >
                                        מחק
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepairTypeManagement;
