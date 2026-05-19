import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StoreContext = createContext();

export const useStore = () => {
    return useContext(StoreContext);
};

export const StoreProvider = ({ children }) => {
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Extract slug from URL: /store/:slug/*
    const pathParts = location.pathname.split('/');
    const isStoreRoute = pathParts[1] === 'store';
    const slug = isStoreRoute ? pathParts[2] : null;

    useEffect(() => {
        if (store) {
            document.title = store.name || 'Top Tech';
            if (store.design) {
                const root = document.documentElement;
                if (store.design.primaryColor) {
                    root.style.setProperty('--color-primary', store.design.primaryColor);
                }
                if (store.design.secondaryColor) {
                    root.style.setProperty('--color-secondary', store.design.secondaryColor);
                }
                const link = document.querySelector("link[rel~='icon']");
                if (link) {
                    link.href = store.design.faviconUrl || '/top-tech.svg';
                }
            }
        } else {
            document.title = 'Top Tech';
            const link = document.querySelector("link[rel~='icon']");
            if (link) {
                link.href = '/top-tech.svg';
            }
        }
    }, [store]);

    useEffect(() => {
        if (!isStoreRoute) {
            setStore(null);
            setLoading(false);
            return;
        }

        if (!slug) {
            navigate('/');
            return;
        }

        // Set global Axios interceptor/header
        axios.defaults.headers.common['x-store-slug'] = slug;

        const fetchStore = async () => {
            try {
                const { data } = await axios.get(`${__API_URL__}/stores/${slug}`);
                setStore(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching store:", err);
                setError("החנות לא נמצאה");
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if store is not loaded or slug changed
        if (slug && (!store || store.slug !== slug)) {
            setLoading(true);
            fetchStore();
        } else if (!isStoreRoute) {
            setLoading(false);
        }

    }, [slug, isStoreRoute, navigate]);

    // If it's a store route but loading
    if (isStoreRoute && loading) {
        return <div className="min-h-screen flex items-center justify-center">טוען נתוני חנות...</div>;
    }

    if (isStoreRoute && error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500 text-xl font-semibold">{error}</div>;
    }

    return (
        <StoreContext.Provider value={{ store, slug, loading, setStore }}>
            {children}
        </StoreContext.Provider>
    );
};
