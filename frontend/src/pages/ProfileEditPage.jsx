import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { User, Mail, Phone, Save, ArrowRight, Loader } from 'lucide-react';

/**
 * ProfileEditPage Component.
 * Allows registered users to update their profile information (username, email, phone).
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const ProfileEditPage = ({ showNotification }) => {
    const navigate = useNavigate();
    const { user, login, getToken } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = getToken();
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get(`${__API_URL__}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const { username, email, phone } = response.data;
                setFormData({
                    username: username || '',
                    email: email || '',
                    phone: phone || ''
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
                showNotification('שגיאה בטעינת נתוני הפרופיל', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate, getToken, showNotification]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = getToken();
            const response = await axios.put(`${__API_URL__}/auth/profile`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local auth state with new token and user data
            login(response.data.token);
            
            showNotification('הפרופיל עודכן בהצלחה!', 'success');
            navigate('/profile');
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה בעדכון הפרופיל';
            showNotification(message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-gray-600 text-lg font-medium">טוען נתונים...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-blue-600 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <User className="ml-2" size={24} /> עריכת פרופיל
                    </h2>
                    <button 
                        onClick={() => navigate('/profile')}
                        className="text-white/80 hover:text-white transition-colors"
                        title="חזור לאזור האישי"
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <User className="ml-2 text-blue-500" size={18} /> שם משתמש
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="הזן שם משתמש"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Mail className="ml-2 text-blue-500" size={18} /> כתובת אימייל
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="example@mail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Phone className="ml-2 text-blue-500" size={18} /> מספר טלפון
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="05X-XXXXXXX"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all active:scale-95 ${
                                saving 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <Loader className="animate-spin ml-2" size={20} /> מעדכן...
                                </>
                            ) : (
                                <>
                                    <Save className="ml-2" size={20} /> שמור שינויים
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEditPage;
