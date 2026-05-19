import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlatformLanding = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    ברוכים הבאים לפלטפורמת המסחר שלנו
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    המערכת לניהול והפעלת חנויות חכמות.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <p className="text-gray-700 mb-6">
                        כדי לגשת לחנות ספציפית, אנא היכנסו דרך הכתובת הייעודית של החנות.
                    </p>
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/store/techshop')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            לחנות ההדגמה (TechShop)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformLanding;
