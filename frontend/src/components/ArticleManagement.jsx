import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Loader from './Loader';
import { FaTrash, FaEdit, FaPlus, FaTimes, FaBookOpen } from 'react-icons/fa';

/**
 * ArticleManagement Component.
 * Provides a premium CRUD interface for store managers to write and update blog posts.
 */
const ArticleManagement = ({ showNotification }) => {
    const { getToken } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    
    // Form fields
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');

    // Delete Confirmation Modal
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Fetch all articles
    const fetchArticles = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${__API_URL__}/articles`);
            setArticles(data);
        } catch (error) {
            console.error("Error fetching articles:", error);
            showNotification('שגיאה בטעינת המאמרים', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    // Auto-generate slug from title (Hebrew support included)
    useEffect(() => {
        if (!editingArticle && title) {
            const generated = title
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\u0590-\u05fe-]+/g, ''); // keeps english characters, Hebrew letters, and dashes
            setSlug(generated);
        }
    }, [title, editingArticle]);

    const openCreateForm = () => {
        setEditingArticle(null);
        setTitle('');
        setSlug('');
        setContent('');
        setImage('');
        setFormOpen(true);
    };

    const openEditForm = (article) => {
        setEditingArticle(article);
        setTitle(article.title || '');
        setSlug(article.slug || '');
        setContent(article.content || '');
        setImage(article.image || '');
        setFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !slug || !content) {
            showNotification('נא למלא את כל שדות החובה', 'error');
            return;
        }

        const payload = { title, slug, content, image };

        try {
            if (editingArticle) {
                // Update
                await axios.put(`${__API_URL__}/articles/${editingArticle._id}`, payload, {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                showNotification('המאמר עודכן בהצלחה!', 'success');
            } else {
                // Create
                await axios.post(`${__API_URL__}/articles`, payload, {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                showNotification('המאמר פורסם בהצלחה!', 'success');
            }
            setFormOpen(false);
            fetchArticles();
        } catch (error) {
            console.error("Error saving article:", error);
            showNotification(error.response?.data?.message || 'שגיאה בשמירת המאמר', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${__API_URL__}/articles/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            showNotification('המאמר נמחק בהצלחה', 'success');
            setDeleteConfirmId(null);
            fetchArticles();
        } catch (error) {
            console.error("Error deleting article:", error);
            showNotification('שגיאה במחיקת המאמר', 'error');
        }
    };

    if (loading && articles.length === 0) return <Loader />;

    return (
        <div className="space-y-8 text-right" dir="rtl">
            
            {/* Header & Create Button */}
            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <div>
                    <h4 className="text-xl font-black text-gray-900">ניהול בלוג ומאמרים</h4>
                    <p className="text-gray-500 font-medium text-sm">צרו, ערכו ונהלו כתבות תוכן שיעזרו ללקוחות ויקדמו את האתר בגוגל</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                    <FaPlus size={14} />
                    <span>כתבה חדשה</span>
                </button>
            </div>

            {/* Articles List */}
            {articles.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <FaBookOpen size={28} />
                    </div>
                    <p className="text-gray-400 font-black">אין עדיין מאמרים באתר. לחצו על "כתבה חדשה" כדי להתחיל!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                        <div key={article._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                            <div className="space-y-4">
                                {article.image && (
                                    <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                                        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-xl font-black text-gray-900 leading-tight">{article.title}</h4>
                                    <span className="text-xs font-bold text-gray-400 block mt-1" dir="ltr">/articles/{article.slug}</span>
                                </div>
                                <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed font-medium">
                                    {article.content?.replace(/<[^>]*>/g, '') || ''}
                                </p>
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50">
                                <span className="text-xs font-bold text-gray-400">
                                    {new Date(article.createdAt).toLocaleDateString('he-IL')}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditForm(article)}
                                        className="p-3 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        title="ערוך מאמר"
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(article._id)}
                                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="מחק מאמר"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Overlay Modal */}
            {formOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center p-8 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="text-2xl font-black text-gray-900">
                                {editingArticle ? 'עריכת מאמר' : 'כתיבת מאמר חדש'}
                            </h3>
                            <button
                                onClick={() => setFormOpen(false)}
                                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 rounded-xl text-gray-400 transition-all border border-gray-100"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {/* Body Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">כותרת המאמר *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-4 bg-gray-50 hover:bg-gray-50/50 rounded-2xl border border-gray-200 focus:border-primary outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">כתובת Slug (יווצר אוטומטית) *</label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-primary outline-none transition-all font-semibold"
                                    dir="ltr"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">כתובת תמונה ראשית (URL)</label>
                                <input
                                    type="text"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-primary outline-none transition-all"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">תוכן המאמר *</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={10}
                                    className="w-full p-4 bg-gray-50 hover:bg-gray-50/50 rounded-2xl border border-gray-200 focus:border-primary outline-none transition-all font-medium leading-relaxed"
                                    required
                                ></textarea>
                            </div>

                            {/* Footer Submit */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(false)}
                                    className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3.5 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {editingArticle ? 'שמור שינויים' : 'פרסם כעת'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                            <FaTrash size={24} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900">מחיקת מאמר</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                האם אתם בטוחים שברצונכם למחוק את המאמר הזה? פעולה זו היא סופית ולא ניתן לבטלה.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-500/25 transition-all"
                            >
                                מחיקה סופית
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ArticleManagement;
