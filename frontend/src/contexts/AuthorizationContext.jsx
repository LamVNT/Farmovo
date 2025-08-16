import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';

const AuthorizationContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthorizationContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthorizationProvider');
    }
    return context;
};

export const AuthorizationProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCurrentUser();
        const handleAuthChange = () => { fetchCurrentUser(); };
        window.addEventListener('storage', handleAuthChange);
        window.addEventListener('auth-change', handleAuthChange);
        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    const expandRoles = (roles = []) => {
        const set = new Set();
        roles.forEach(r => {
            if (!r) return;
            const upper = r.toString().toUpperCase();
            const plain = upper.startsWith('ROLE_') ? upper.slice(5) : upper;
            set.add(upper);
            set.add(plain);
            set.add('ROLE_' + plain);
        });
        return Array.from(set);
    };

    const fetchCurrentUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await userService.getCurrentUser();
            if (userData) {
                const roles = Array.isArray(userData.roles) ? userData.roles : [];
                setUser(userData);
                setPermissions(expandRoles(roles));
                localStorage.setItem("user", JSON.stringify({ ...userData, roles: expandRoles(roles) }));
                console.log('Current user loaded:', userData);
            } else {
                setUser(null);
                setPermissions([]);
                localStorage.removeItem("user");
            }
        } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                setUser(null);
                setPermissions([]);
                localStorage.removeItem("user");
            } else {
                console.error('Error fetching user:', error);
                setError(error.message);
                setUser(null);
                setPermissions([]);
                localStorage.removeItem("user");
            }
        } finally {
            setLoading(false);
        }
    };

    const hasRole = (role) => {
        if (!role) return false;
        const upper = role.toString().toUpperCase();
        const plain = upper.startsWith('ROLE_') ? upper.slice(5) : upper;
        return permissions.includes(upper) || permissions.includes(plain) || permissions.includes('ROLE_' + plain);
    };

    const hasAnyRole = (roles) => {
        if (!Array.isArray(roles)) {
            return hasRole(roles);
        }
        return roles.some(r => hasRole(r));
    };

    const hasAllRoles = (roles) => {
        if (!Array.isArray(roles)) {
            return hasRole(roles);
        }
        return roles.every(r => hasRole(r));
    };

    const isAdmin = () => hasRole('ADMIN');
    const isStaff = () => hasRole('STAFF');
    const isAuthenticated = () => !!user;

    const logout = () => {
        setUser(null);
        setPermissions([]);
        setError(null);
        localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent('auth-change'));
    };

    const updateUser = async () => {
        await fetchCurrentUser();
        window.dispatchEvent(new CustomEvent('auth-change'));
    };

    const refreshAuth = () => { fetchCurrentUser(); };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.refreshAuth = refreshAuth;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete window.refreshAuth;
            }
        };
    }, []);

    const contextValue = {
        user,
        permissions,
        loading,
        error,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        isAdmin,
        isStaff,
        isAuthenticated,
        refetch: fetchCurrentUser,
        updateUser,
        refreshAuth,
        logout
    };

    return (
        <AuthorizationContext.Provider value={contextValue}>
            {children}
        </AuthorizationContext.Provider>
    );
};

export default AuthorizationProvider;