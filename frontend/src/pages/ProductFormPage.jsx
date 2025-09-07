// src/pages/ProductFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../AuthContext';
import Notification from '../components/Notification';

const ProductFormPage = ({ showNotification }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    // Get isAdmin from the context, and a way to get the token
    const { isAdmin, getToken } = useAuth();
    const [existingProduct, setExistingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageNotification, setPageNotification] = useState({ message: '', type: '' });

    useEffect(() => {
        const fetchProduct = async () => {
            if (id) {
                try {
                    // Get the token from the AuthContext
                    const token = localStorage.getItem('token');
                    if (!token) {
                        showNotification('You must be logged in to view this page.', 'error');
                        navigate('/');
                        return;
                    }

                    const response = await fetch(`http://localhost:5001/api/products/${id}`, {
                        headers: {
                            // Add the Authorization header with the token
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch product');
                    }
                    const data = await response.json();
                    setExistingProduct(data);
                } catch (err) {
                    setError(err.message);
                    showNotification(`Error: ${err.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        if (isAdmin) {
            fetchProduct();
        } else {
            setPageNotification({ message: 'You do not have permission to view this page.', type: 'error' });
            navigate('/');
        }
    }, [id, isAdmin, navigate]); // Depend on id and isAdmin

    const handleUpdateSuccess = () => {
        showNotification('Product updated successfully!', 'success');
        navigate('/');
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <ProductForm
                showNotification={showNotification}
                existingProduct={existingProduct}
                onUpdateSuccess={handleUpdateSuccess}
            />
            <Notification message={pageNotification.message} type={pageNotification.type} onClose={() => setPageNotification({ message: '', type: '' })} />
        </div>
    );
};

export default ProductFormPage;