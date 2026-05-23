import { useNavigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { useCallback } from 'react';

const useStoreNavigate = () => {
    const navigate = useNavigate();
    const storeContext = useStore();
    const slug = storeContext ? storeContext.slug : null;

    return useCallback((to, options) => {
        if (typeof to === 'string' && to.startsWith('/') && slug) {
            navigate(`/store/${slug}${to === '/' ? '' : to}`, options);
        } else {
            navigate(to, options);
        }
    }, [navigate, slug]);
};

export default useStoreNavigate;
