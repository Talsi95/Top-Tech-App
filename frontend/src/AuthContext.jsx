import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useStore } from './StoreContext';

// Context for authentication state and operations.
const AuthContext = createContext(null);

/**
 * Provider component that manages the authentication state.
 * Handles token initialization, user decoding, and auth actions.
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - Child elements.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const { store } = useStore();

    // Load token from local storage on mount and validate it.
    useEffect(() => {
        const token = localStorage.getItem('token');
        const guestToken = localStorage.getItem('guestToken');

        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded && decoded.exp * 1000 > Date.now()) {
                    setUser(decoded);
                    setIsGuest(false);
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        } else if (guestToken) {
            try {
                const decoded = jwtDecode(guestToken);
                if (decoded && decoded.exp * 1000 > Date.now()) {
                    setUser(decoded);
                    setIsGuest(true);
                } else {
                    localStorage.removeItem('guestToken');
                }
            } catch (error) {
                localStorage.removeItem('guestToken');
            }
        }
        setLoading(false);
    }, []);

    // Verify that the logged-in user belongs to the current store
    // Super admins bypass this check and stay logged in across all stores
    useEffect(() => {
        if (store && user && !user.isSuperAdmin) {
            const userStoreId = user.storeId?.toString();
            const currentStoreId = store._id?.toString();
            if (userStoreId && currentStoreId && userStoreId !== currentStoreId) {
                console.log(`[Auth] Logging out user due to store mismatch: user store (${userStoreId}) !== current store (${currentStoreId})`);
                logout();
            }
        }
    }, [store, user]);

    /**
     * Logs the user in by saving the token and decoding user data.
     * @param {string} token - The JWT token.
     */
    const login = (token, isGuestLogin = false) => {
        if (isGuestLogin) {
            localStorage.setItem('guestToken', token);
            localStorage.removeItem('token');
            setIsGuest(true);
        } else {
            localStorage.setItem('token', token);
            localStorage.removeItem('guestToken');
            setIsGuest(false);
        }
        const decoded = jwtDecode(token);
        setUser(decoded);
    };

    /**
     * Logs the user out by clearing the token and user state.
     */
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('guestToken');
        setUser(null);
        setIsGuest(false);
    };

    /**
     * Retrieves the current auth token from local storage.
     * @returns {string|null} The token or null if not found.
     */
    const getToken = () => {
        return localStorage.getItem('token') || localStorage.getItem('guestToken');
    };

    // Consolidated authentication state.
    const authState = {
        user,
        isAuthenticated: !!user,
        isGuest,
        isAdmin: user ? user.isAdmin : false,
        isSuperAdmin: user ? user.isSuperAdmin : false,
        login,
        logout,
        getToken,
    };

    return (
        <AuthContext.Provider value={authState}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook to easily access the authentication context.
 * @returns {Object} The auth context state and methods.
 */
export const useAuth = () => {
    return useContext(AuthContext);
};