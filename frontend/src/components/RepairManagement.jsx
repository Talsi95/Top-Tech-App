import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Loader from '../components/Loader';

const initialNewRepair = {
    customerName: '',
    phoneNumber: '',
    deviceModel: '',
    repairType: ''
};

const RepairManagement = ({ showNotification }) => {
    const { getToken } = useAuth();
    const [repairs, setRepairs] = useState([]);
    const [repairTypes, setRepairTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newRepair, setNewRepair] = useState(initialNewRepair);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = getToken();
            const [repairsRes, typesRes] = await Promise.all([
                axios.get(`${__API_URL__}/repairs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                axios.get(`${__API_URL__}/repair-types`)
            ]);
            setRepairs(repairsRes.data);
            setRepairTypes(typesRes.data);
        } catch (error) {
            showNotification('שגיאה בשליפת נתונים', 'error');
            console.error('Fetch data error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        setNewRepair({ ...newRepair, [e.target.name]: e.target.value });
    };

    const createRepair = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!newRepair.customerName || !newRepair.phoneNumber || !newRepair.deviceModel || !newRepair.repairType) {
            showNotification('כל השדות הם חובה (כולל סוג התיקון)', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = getToken();
            await axios.post(`${__API_URL__}/repairs`, newRepair, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            showNotification('תיקון נפתח בהצלחה', 'success');
            setNewRepair(initialNewRepair);
            fetchData();
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה בפתיחת תיקון';
            showNotification(message, 'error');
            console.error('Create repair error:', error.response || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'בתיקון' ? 'מוכן' : 'בתיקון';
        
        try {
            const token = getToken();
            await axios.put(`${__API_URL__}/repairs/${id}/status`, { status: newStatus }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            showNotification('סטטוס עודכן בהצלחה', 'success');
            fetchData();
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה בעדכון הסטטוס';
            showNotification(message, 'error');
            console.error('Update status error:', error.response || error);
        }
    };

    if (isLoading) return <Loader text="טוען נתוני מעבדה" />;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">🔧 ניהול מעבדת תיקונים</h2>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* טופס פתיחת תיקון חדש */}
                <div className="xl:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-sky-100 h-fit">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-sky-700">פתיחת טופס תיקון חדש</h3>
                    <form onSubmit={createRepair} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">שם לקוח</label>
                            <input
                                type="text"
                                name="customerName"
                                value={newRepair.customerName}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">מספר טלפון</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={newRepair.phoneNumber}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">דגם מכשיר</label>
                            <input
                                type="text"
                                name="deviceModel"
                                value={newRepair.deviceModel}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">סוג התיקון</label>
                            <select
                                name="repairType"
                                value={newRepair.repairType}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 bg-white"
                                required
                            >
                                <option value="" disabled>בחר סוג תיקון</option>
                                {repairTypes.map(type => (
                                    <option key={type._id} value={type.name}>
                                        {type.name} - {type.price}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3 mt-4 rounded-xl text-lg font-bold transition-colors ${isSubmitting ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {isSubmitting ? 'פותח תיקון...' : '➕ הוסף למעבדה'}
                        </button>
                    </form>
                </div>

                {/* רשימת תיקונים קיימים */}
                <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">📋 רשימת מכשירים ({repairs.length})</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                    <th className="p-3">תאריך פתיחה</th>
                                    <th className="p-3">שם לקוח</th>
                                    <th className="p-3">טלפון</th>
                                    <th className="p-3">דגם מכשיר</th>
                                    <th className="p-3">סוג תיקון</th>
                                    <th className="p-3">סטטוס</th>
                                    <th className="p-3 text-center">פעולה</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repairs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center p-6 text-gray-500">
                                            אין מכשירים במעבדה.
                                        </td>
                                    </tr>
                                ) : (
                                    repairs.map((repair) => (
                                        <tr key={repair._id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-3 text-sm text-gray-600">
                                                {new Date(repair.createdAt).toLocaleDateString('he-IL', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'
                                                })}
                                            </td>
                                            <td className="p-3 font-semibold text-gray-800">{repair.customerName}</td>
                                            <td className="p-3 text-gray-600" dir="ltr">{repair.phoneNumber}</td>
                                            <td className="p-3 text-gray-700">{repair.deviceModel}</td>
                                            <td className="p-3 text-sky-700 font-semibold">{repair.repairType}</td>
                                            <td className="p-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${repair.status === 'מוכן' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {repair.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => updateStatus(repair._id, repair.status)}
                                                    className={`px-4 py-2 text-sm rounded-lg font-semibold text-white transition-colors ${repair.status === 'בתיקון' ? 'bg-sky-500 hover:bg-sky-600' : 'bg-gray-500 hover:bg-gray-600'}`}
                                                >
                                                    {repair.status === 'בתיקון' ? 'סמן כמוכן' : 'החזר לתיקון'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepairManagement;
