import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, RefreshCw, Info, Download } from 'lucide-react';

/**
 * ImportProducts Component.
 * A premium, highly interactive dashboard component for bulk importing products from Excel/CSV.
 */
const ImportProducts = ({ showNotification }) => {
    const { getToken } = useAuth();
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, completed, error
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [jobId, setJobId] = useState(null);
    const [stats, setStats] = useState(null); // To store stats of the processed import
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    const validateAndSetFile = (selectedFile) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        const fileExt = selectedFile.name.split('.').pop().toLowerCase();
        
        if (validTypes.includes(selectedFile.type) || ['xlsx', 'csv'].includes(fileExt)) {
            setFile(selectedFile);
            setStatus('idle');
            setMessage('');
            setProgress(0);
            setStats(null);
        } else {
            setStatus('error');
            setMessage('אנא העלה קובץ XLSX (אקסל) או CSV בלבד.');
            if (showNotification) showNotification('אנא העלה קובץ אקסל או CSV תקין', 'error');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        setMessage('מעלה קובץ ומכין את התור...');
        setProgress(15);
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = getToken();
            const response = await axios.post(`${__API_URL__}/products/import`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 202 && response.data?.jobId) {
                setStatus('processing');
                setJobId(response.data.jobId);
                setProgress(30);
                setMessage('הקובץ התקבל בהצלחה. מתחיל בעיבוד הנתונים...');
            } else {
                setStatus('error');
                setMessage(response.data?.error || 'אירעה שגיאה בשרת בעת העלאת הקובץ.');
            }
        } catch (error) {
            setStatus('error');
            const errMsg = error.response?.data?.error || 'שגיאת שרת. לא ניתן להתחבר לשרת או שהקובץ אינו תקין.';
            setMessage(errMsg);
            if (showNotification) showNotification(errMsg, 'error');
        }
    };

    // Polling mechanism to check job status
    useEffect(() => {
        let interval;
        
        const checkStatus = async () => {
            if (!jobId) return;

            try {
                const token = getToken();
                const response = await axios.get(`${__API_URL__}/products/import/status/${jobId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    const data = response.data;
                    
                    if (data.state === 'completed') {
                        setStatus('completed');
                        setProgress(100);
                        const processedCount = data.result?.processedCount || 0;
                        setStats(data.result);
                        setMessage(`העיבוד הושלם! ${processedCount} מוצרים יובאו/עודכנו בהצלחה.`);
                        if (showNotification) showNotification(`ייבוא המוצרים הושלם בהצלחה! סך הכל יובאו ${processedCount} מוצרים`, 'success');
                        clearInterval(interval);
                    } else if (data.state === 'failed') {
                        setStatus('error');
                        setMessage(`שגיאה בעיבוד הקובץ: ${data.failedReason || 'שגיאה לא ידועה'}`);
                        if (showNotification) showNotification('עיבוד קובץ הייבוא נכשל', 'error');
                        clearInterval(interval);
                    } else {
                        // processing, active, waiting, delayed
                        // calculate progress nicely or map from queue progress
                        const queueProgress = data.progress || 0;
                        // Map queueProgress (which goes from 0-100) to our UI scale (starts at 30)
                        const currentProgress = Math.max(30, Math.min(95, 30 + (queueProgress * 0.65)));
                        setProgress(Math.round(currentProgress));
                        setMessage(`מעבד את שורות הקובץ... (${queueProgress}% הושלם)`);
                    }
                }
            } catch (error) {
                console.error("Status polling failed", error);
            }
        };

        if (status === 'processing' && jobId) {
            interval = setInterval(checkStatus, 1500); // Poll every 1.5 seconds for snappier feedback
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status, jobId, getToken, showNotification]);

    const handleDownloadTemplate = () => {
        // Create an example CSV and trigger download
        const headers = ["name", "sku", "price", "stock", "description", "category", "subcategory", "imageUrls", "variants"];
        const exampleRow = ["עגבניה אורגנית", "TOM-001", "12.9", "150", "עגבניות טריות מהערבה", "ירקות", "עגבניות", "https://example.com/tomato.jpg", ""];
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), exampleRow.join(",")].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "products_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">
            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-6">
                
                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <FileSpreadsheet size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">ייבוא מהיר של קטלוג מוצרים</h2>
                            <p className="text-sm text-gray-500 mt-0.5">העלה קובץ אקסל או CSV לעדכון או יצירת מוצרים מרובים במקביל</p>
                        </div>
                    </div>
                    
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-100"
                    >
                        <Download size={14} className="text-gray-500" />
                        <span>הורד קובץ דוגמה (CSV)</span>
                    </button>
                </div>

                {/* Info Card */}
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30 flex items-start gap-3 text-sm text-blue-900/95 leading-relaxed">
                    <Info size={18} className="text-primary mt-0.5 shrink-0" />
                    <div>
                        <span className="font-bold block mb-1">הוראות חשובות להעלאה:</span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-blue-950/80">
                            <li>עמודות חובה בקובץ: <strong className="font-semibold">name</strong> (שם המוצר), ו-<strong className="font-semibold">sku</strong> (מזהה ייחודי למניעת כפילויות).</li>
                            <li>ביצוע ה-Upsert מתבצע לפי שילוב של מזהה החנות וה-SKU. מוצר קיים יעודכן, מוצר חדש ייווצר.</li>
                            <li>ניתן להגדיר מספר תמונות בעמודת <strong className="font-semibold">imageUrls</strong> על ידי הפרדת הכתובות בפסיקים.</li>
                            <li>במידה ויש וריאציות (למשל גדלים או צבעים), ניתן להגדיר אותן תחת עמודת <strong className="font-semibold">variants</strong> במבנה JSON.</li>
                        </ul>
                    </div>
                </div>

                {/* Drag & Drop Area */}
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => status !== 'uploading' && status !== 'processing' && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                        isDragging 
                        ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner' 
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50/80'
                    } ${status === 'uploading' || status === 'processing' ? 'pointer-events-none opacity-60' : ''}`}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden"
                        accept=".xlsx, .csv"
                    />
                    
                    {file ? (
                        <div className="space-y-2 flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                                <FileSpreadsheet size={32} />
                            </div>
                            <h4 className="text-lg font-black text-gray-800">{file.name}</h4>
                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB • מוכן לייבוא</p>
                            
                            {status === 'idle' && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 font-bold transition-all mt-1"
                                >
                                    הסר קובץ
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 flex flex-col items-center py-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                <UploadCloud size={32} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-bold text-gray-800">גרור ושחרר את קובץ האקסל לכאן</h4>
                                <p className="text-xs text-gray-400 font-medium">או לחץ על האזור לבחירת קובץ מהמחשב</p>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                                XLSX, CSV
                            </span>
                        </div>
                    )}
                </div>

                {/* Progress / Status feedback */}
                {status !== 'idle' && (
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                        status === 'error' 
                        ? 'bg-red-50/70 border-red-100 text-red-900' 
                        : status === 'completed'
                        ? 'bg-green-50/70 border-green-100 text-green-900'
                        : 'bg-primary/5 border-primary/10 text-primary'
                    }`}>
                        <div className="flex items-center gap-3 font-bold text-sm">
                            {status === 'error' ? (
                                <AlertCircle size={20} className="text-red-500 shrink-0 animate-bounce" />
                            ) : status === 'completed' ? (
                                <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                            ) : (
                                <RefreshCw size={20} className="text-primary shrink-0 animate-spin" />
                            )}
                            <span className="text-sm font-black">{message}</span>
                        </div>

                        {/* Progress Bar */}
                        {(status === 'uploading' || status === 'processing') && (
                            <div className="mt-4 space-y-1.5">
                                <div className="h-2 w-full bg-gray-200/80 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-400">
                                    <span>עיבוד קובץ</span>
                                    <span>{progress}%</span>
                                </div>
                            </div>
                        )}

                        {/* Completed Stats */}
                        {status === 'completed' && stats && (
                            <div className="mt-4 pt-4 border-t border-green-200/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-white/60 p-3 rounded-xl border border-green-100/50">
                                    <span className="block text-lg font-black text-green-700">{stats.processedCount}</span>
                                    <span className="text-[10px] font-bold text-gray-500">עובדו בהצלחה</span>
                                </div>
                                <div className="bg-white/60 p-3 rounded-xl border border-green-100/50">
                                    <span className="block text-lg font-black text-green-700">{stats.createdCount || 0}</span>
                                    <span className="text-[10px] font-bold text-gray-500">מוצרים חדשים</span>
                                </div>
                                <div className="bg-white/60 p-3 rounded-xl border border-green-100/50">
                                    <span className="block text-lg font-black text-green-700">{stats.updatedCount || 0}</span>
                                    <span className="text-[10px] font-bold text-gray-500">מוצרים שפורטו/עודכנו</span>
                                </div>
                                <div className="bg-white/60 p-3 rounded-xl border border-green-100/50">
                                    <span className="block text-lg font-black text-red-600">{stats.errorCount || 0}</span>
                                    <span className="text-[10px] font-bold text-gray-500">שגיאות</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Import Trigger Button */}
                <button 
                    type="button"
                    onClick={handleUpload}
                    disabled={!file || status === 'uploading' || status === 'processing'}
                    className={`w-full py-4 rounded-2xl font-black text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                        !file || status === 'uploading' || status === 'processing'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-primary text-white hover:scale-[1.02] active:scale-[0.98] shadow-primary/20 hover:shadow-xl'
                    }`}
                >
                    {status === 'uploading' || status === 'processing' ? (
                        <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>מבצע ייבוא מוצרים...</span>
                        </>
                    ) : (
                        <>
                            <UploadCloud size={18} />
                            <span>התחל ייבוא קטלוג</span>
                        </>
                    )}
                </button>

            </div>
        </div>
    );
};

export default ImportProducts;
