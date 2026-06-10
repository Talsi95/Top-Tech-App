import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import ImportProducts from '../components/ImportProducts';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthContext';
import Notification from '../components/Notification';
import axios from 'axios';
import Loader from '../components/Loader.jsx';
import useStoreNavigate from '../hooks/useStoreNavigate';

/**
 * ProductFormPage Component.
 * An administrative page for creating new products or editing existing ones.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const ProductFormPage = ({ showNotification }) => {
    const { id } = useParams();
    const navigate = useStoreNavigate();
    const { isAdmin, getToken } = useAuth();
    const [existingProduct, setExistingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageNotification, setPageNotification] = useState({ message: '', type: '' });
    const [adminCategories, setAdminCategories] = useState({});
    const [adminVariantFields, setAdminVariantFields] = useState({});
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [activeMode, setActiveMode] = useState('manual'); // 'manual' or 'import'

    /**
     * Fetches descriptive metadata for categories to populate form fields.
     */
    useEffect(() => {
        const fetchCategoriesData = async () => {
            if (!isAdmin) return;

            try {
                const token = getToken();
                if (!token) return;

                const response = await axios.get(`${__API_URL__}/categories/admin-data`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setAdminCategories(response.data.adminCategories || {});
                setAdminVariantFields(response.data.adminVariantFields || {});
            } catch (error) {
                showNotification('שגיאה בטעינת נתוני קטגוריות.', 'error');
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategoriesData();
    }, [isAdmin, getToken, showNotification]);

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

                const response = await axios.get(`${__API_URL__}/products/${id}`, {
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

    const isDataLoading = loading || isLoadingCategories;

    if (isDataLoading) return <Loader text="טוען נתונים" />;

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {/* Show selector only if creating a new product (no id in params) */}
            {!id && (
                <div className="max-w-4xl mx-auto mb-8 flex justify-center">
                    <div className="bg-gray-100/80 p-1.5 rounded-2xl flex gap-1.5 border border-gray-200/50 backdrop-blur-sm">
                        <button
                            type="button"
                            onClick={() => setActiveMode('manual')}
                            className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 ${
                                activeMode === 'manual'
                                ? 'bg-white text-primary shadow-md shadow-gray-200/50'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            הוספה ידנית
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveMode('import')}
                            className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 ${
                                activeMode === 'import'
                                ? 'bg-white text-primary shadow-md shadow-gray-200/50'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            ייבוא מהיר מאקסל / CSV
                        </button>
                    </div>
                </div>
            )}

            {!id && activeMode === 'import' ? (
                <div className="max-w-4xl mx-auto mb-16 animate-in fade-in duration-500" dir="rtl">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">
                                ייבוא מוצרים
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">
                                העלאת קטלוג מוצרים שלם במהירות מתוך קובץ אקסל או CSV.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 font-bold transition-all text-sm self-start md:self-auto"
                        >
                            <ArrowLeft size={16} />
                            <span>חזרה ללוח הבקרה</span>
                        </button>
                    </div>
                    <ImportProducts showNotification={showNotification} />
                </div>
            ) : (
                <ProductForm
                    showNotification={showNotification}
                    existingProduct={existingProduct}
                    onUpdateSuccess={handleUpdateSuccess}
                    adminCategories={adminCategories}
                    adminVariantFields={adminVariantFields}
                    isLoadingCategories={isLoadingCategories}
                />
            )}
            <Notification message={pageNotification.message} type={pageNotification.type} onClose={() => setPageNotification({ message: '', type: '' })} />
        </div>
    );
};

export default ProductFormPage;