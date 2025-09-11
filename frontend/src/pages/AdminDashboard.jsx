import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import UserList from '../components/UserList';
import Notification from '../components/Notification';

const AdminDashboard = ({ showNotification }) => {
    const { isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated || !isAdmin) {
            showNotification('אין לך הרשאה להיכנס לדף זה', 'error');
            navigate('/');
        }
    }, [isAuthenticated, isAdmin, navigate, showNotification]);

    if (isAuthenticated && isAdmin) {
        return (
            <div className="container mx-auto p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">איזור מנהל</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">הוסף מוצר חדש</h3>
                        <ProductForm showNotification={showNotification} />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">רשימת משתמשים</h3>
                        <UserList showNotification={showNotification} />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AdminDashboard;