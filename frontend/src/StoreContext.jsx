import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StoreContext = createContext();

export const useStore = () => {
    return useContext(StoreContext);
};

export const StoreProvider = ({ children, initialData = {} }) => {
    // Hydrate from SSR preloaded data if available (window.__INITIAL_DATA__ on client)
    const ssrStore = (typeof window !== 'undefined' && window.__INITIAL_DATA__?.store)
        ? window.__INITIAL_DATA__.store
        : (initialData?.store || null);

    const [store, setStore] = useState(ssrStore);
    const [loading, setLoading] = useState(!ssrStore);
    const [error, setError] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    // Extract slug from URL: /store/:slug/*
    const pathParts = location.pathname.split('/');
    const isStoreRoute = pathParts[1] === 'store';
    const slug = isStoreRoute ? pathParts[2] : null;

    // Set global Axios interceptor/header immediately on client
    if (typeof window !== 'undefined' && slug) {
        axios.defaults.headers.common['x-store-slug'] = slug;
    }

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return; // Guard for SSR
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
        if (!isMounted) return;

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

        // Skip fetch if we already have SSR-hydrated store data for this slug
        if (slug && (!store || store.slug !== slug)) {
            setLoading(true);
            fetchStore();
        } else if (!isStoreRoute) {
            setLoading(false);
        }

    }, [slug, isStoreRoute, navigate, isMounted]);

    useEffect(() => {
        if (isStoreRoute && (!slug || !store)) return;

        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const headers = {};
                if (slug) {
                    headers['x-store-slug'] = slug;
                }
                const { data } = await axios.get(`${__API_URL__}/categories`, { headers });
                setCategories(data);
            } catch (err) {
                console.error("Error fetching categories:", err);
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, [store, slug, isStoreRoute]);

    // If it's a store route but loading
    if (isMounted && isStoreRoute && loading) {
        return <div className="min-h-screen flex items-center justify-center">טוען נתוני חנות...</div>;
    }

    if (isMounted && isStoreRoute && error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500 text-xl font-semibold">{error}</div>;
    }


    return (
        <StoreContext.Provider value={{ store, categories, isLoadingCategories, slug, loading, setStore }}>
            {children}
        </StoreContext.Provider>
    );
};
