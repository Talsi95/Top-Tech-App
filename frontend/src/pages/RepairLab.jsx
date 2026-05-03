import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../components/Loader';
import { useAuth } from '../AuthContext';

const RepairLab = () => {
    const { isAdmin, getToken } = useAuth();
    const [phone, setPhone] = useState('');
    const [statusResult, setStatusResult] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [repairPrices, setRepairPrices] = useState([]);
    const [priceSearch, setPriceSearch] = useState('');

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get(`${__API_URL__}/repair-types`);
                setRepairPrices(res.data);
            } catch (err) {
                console.error("Error fetching repair prices:", err);
            }
        };
        fetchPrices();
    }, []);

    const checkStatus = async (e) => {
        e.preventDefault();
        setError('');
        setStatusResult(null);

        if (!phone.trim()) {
            setError('אנא הזן מספר טלפון');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(`${__API_URL__}/repairs/status/${phone.trim()}`);
            setStatusResult(response.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('לא נמצאו תיקונים עבור מספר טלפון זה.');
            } else {
                setError('שגיאה בבדיקת הסטטוס. אנא נסה שוב מאוחר יותר.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRepair = async (id, name) => {
        if (!window.confirm(`האם למחוק את סוג התיקון "${name}"?`)) return;
        try {
            await axios.delete(`${__API_URL__}/repair-types/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setRepairPrices(prev => prev.filter(p => p._id !== id));
            alert('נמחק בהצלחה');
        } catch (err) {
            alert('שגיאה במחיקה');
        }
    };

    const handleUpdateStock = async (item) => {
        const currentStock = item.stock || 0;
        const newStockStr = window.prompt(`עדכון מלאי עבור ${item.name}:`, currentStock);
        if (newStockStr === null) return;
        
        const newStock = parseInt(newStockStr, 10);
        if (isNaN(newStock)) return alert('נא להזין מספר תקין');

        try {
            const res = await axios.put(
                `${__API_URL__}/repair-types/${item._id}`, 
                { ...item, stock: newStock }, 
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setRepairPrices(prev => prev.map(p => p._id === item._id ? res.data.repairType : p));
            alert('מלאי עודכן בהצלחה');
        } catch (err) {
            alert('שגיאה בעדכון מלאי');
        }
    };

    const handleEditRepair = async (item) => {
        const newName = window.prompt(`שם חדש:`, item.name);
        if (newName === null) return;
        const newPrice = window.prompt(`מחיר חדש:`, item.price);
        if (newPrice === null) return;
        const newDesc = window.prompt(`תיאור חדש:`, item.description || '');
        if (newDesc === null) return;

        try {
            const res = await axios.put(
                `${__API_URL__}/repair-types/${item._id}`, 
                { name: newName, price: newPrice, description: newDesc, stock: item.stock }, 
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setRepairPrices(prev => prev.map(p => p._id === item._id ? res.data.repairType : p));
            alert('עודכן בהצלחה');
        } catch (err) {
            alert('שגיאה בעריכה');
        }
    };

    return (
        <div className="w-full pb-16">
            {/* Header / Hero Section */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white py-16 px-4 text-center rounded-b-[2rem] shadow-md mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">מעבדת התיקונים שלנו</h1>
                <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-90">
                    שירות מקצועי, מהיר ואמין למכשיר שלך.
                </p>
            </div>

            <div className="container mx-auto px-4">

                {/* Status Check Section */}
                <div className="bg-white max-w-3xl mx-auto p-8 rounded-2xl shadow-lg border border-gray-100 mb-16">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center"> בדיקת סטטוס תיקון 🔍</h2>
                    <form onSubmit={checkStatus} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                        <input
                            type="text"
                            placeholder="הכנס את מספר הטלפון שלך"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="flex-1 p-4 rounded-xl border border-gray-300 focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition-all text-lg shadow-inner bg-gray-50/50"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-sky-500/30 disabled:bg-gray-400"
                        >
                            {isLoading ? 'בודק...' : 'בדוק סטטוס'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-center font-medium animate-pulse">
                            {error}
                        </div>
                    )}

                    {statusResult && statusResult.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h3 className="font-bold text-lg text-gray-700 text-center mb-4">תוצאות עבור: <span dir="ltr">{phone}</span></h3>
                            {statusResult.map((repair, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xl text-gray-800">{repair.deviceModel}</span>
                                        <span className="text-sm text-gray-500">
                                            נמסר בתאריך: {new Date(repair.createdAt).toLocaleDateString('he-IL')}
                                        </span>
                                    </div>
                                    <div className={`px-6 py-2 rounded-full font-bold text-lg shadow-sm border ${repair.status === 'מוכן'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                        {repair.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pricing List Section */}
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">מחירון תיקונים</h2>
                    <p className="text-center text-gray-500 mb-6">המחירים הינם הערכה כללית ועשויים להשתנות בהתאם לדגם המדויק ומצב המכשיר.</p>

                    {/* Price Search Bar */}
                    <div className="max-w-md mx-auto mb-10">
                        <input
                            type="text"
                            placeholder="חפש לפי סוג תיקון או דגם (לדוגמה: מסך או שיאומי)"
                            value={priceSearch}
                            onChange={(e) => setPriceSearch(e.target.value)}
                            className="w-full p-4 rounded-full border border-gray-300 focus:ring-2 focus:ring-sky-300 focus:border-sky-500 transition-all text-base shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {repairPrices.length === 0 ? (
                            <p className="text-center col-span-full text-gray-500">טוען מחירון...</p>
                        ) : (
                            repairPrices
                                .filter(item =>
                                    item.name.toLowerCase().includes(priceSearch.toLowerCase()) ||
                                    (item.description && item.description.toLowerCase().includes(priceSearch.toLowerCase()))
                                )
                                .map((item) => (
                                    <div key={item._id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:-translate-y-1 transition-transform duration-300 group flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-sky-600 transition-colors">{item.name}</h3>
                                                <span className="text-2xl font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-lg">{item.price} ₪</span>
                                            </div>
                                            <p className="text-gray-600">{item.description}</p>
                                            {isAdmin && (
                                                <p className="text-sm font-bold mt-2 text-sky-700">מלאי זמין: {item.stock || 0}</p>
                                            )}
                                        </div>
                                        {isAdmin && (
                                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                                <button onClick={() => handleEditRepair(item)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs">עריכה</button>
                                                <button onClick={() => handleDeleteRepair(item._id, item.name)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs">מחיקה</button>
                                                <button onClick={() => handleUpdateStock(item)} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-1 px-3 rounded text-xs">עדכון מלאי</button>
                                            </div>
                                        )}
                                    </div>
                                ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RepairLab;
