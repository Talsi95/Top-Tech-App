import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../AuthContext';
import Notification from '../components/Notification';
import axios from 'axios';

const ProductFormPage = ({ showNotification }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin, getToken } = useAuth();
    const [existingProduct, setExistingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageNotification, setPageNotification] = useState({ message: '', type: '' });

    useEffect(() => {
        const fetchProduct = async () => {
            if (!isAdmin) {
                setPageNotification({ message: 'אין לך הרשאה להיכנס לדף זה', type: 'error' });
                navigate('/');
                return;
            }

            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const token = getToken();
                if (!token) {
                    showNotification('נדרשת התחברות בכדי להיכנס לדף זה', 'error');
                    navigate('/');
                    return;
                }

                const response = await axios.get(`/api/products/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setExistingProduct(response.data);

            } catch (err) {
                if (err.response) {
                    setError(err.response.data.message || 'אירעה שגיאה בשליפת הנתונים');
                    showNotification(`Error: ${err.response.data.message || 'אירעה שגיאה:'}`, 'error');
                } else {
                    setError(err.message);
                    showNotification(`Error: ${err.message}`, 'error');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, isAdmin, getToken, navigate, setPageNotification, showNotification]);

    const handleUpdateSuccess = () => {
        showNotification('מוצר עודכן בהצלחה', 'success');
        navigate('/');
    };

    if (loading) {
        return <div className="text-center">טוען...</div>;
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