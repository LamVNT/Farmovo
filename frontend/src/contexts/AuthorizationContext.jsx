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
        
        // Listen for authentication changes
        const handleAuthChange = () => {
            fetchCurrentUser();
        };
        
        // Listen for storage changes (for multi-tab support)
        window.addEventListener('storage', handleAuthChange);
        
        // Custom event for login/logout
        window.addEventListener('auth-change', handleAuthChange);
        
        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    const fetchCurrentUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await userService.getCurrentUser();
            setUser(userData);
            setPermissions(userData.roles || []);
            // Update localStorage for consistency
            localStorage.setItem("user", JSON.stringify(userData));
            console.log('Current user loaded:', userData);
        } catch (error) {
            console.error('Error fetching user:', error);
            setError(error.message);
            setUser(null);
            setPermissions([]);
            // Clear localStorage on error
            localStorage.removeItem("user");
        } finally {
            setLoading(false);
        }
    };

    const hasRole = (role) => {
        return permissions.includes(role);
    };

    const hasAnyRole = (roles) => {
        if (!Array.isArray(roles)) {
            return hasRole(roles);
        }
        return roles.some(role => permissions.includes(role));
    };

    const hasAllRoles = (roles) => {
        if (!Array.isArray(roles)) {
            return hasRole(roles);
        }
        return roles.every(role => permissions.includes(role));
    };

    const isAdmin = () => hasRole('ROLE_ADMIN');
    const isStaff = () => hasRole('ROLE_STAFF');
    const isAuthenticated = () => !!user;

    const logout = () => {
        setUser(null);
        setPermissions([]);
        setError(null);
        // Clear localStorage
        localStorage.removeItem("user");
        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent('auth-change'));
    };
    
    const updateUser = async () => {
        await fetchCurrentUser();
        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent('auth-change'));
    };
    
    const refreshAuth = () => {
        // Manually trigger auth refresh (useful for debugging)
        fetchCurrentUser();
    };
    
    // Expose refresh function to window for debugging
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
        // User data
        user,
        permissions,
        loading,
        error,
        
        // Permission checking functions
        hasRole,
        hasAnyRole,
        hasAllRoles,
        isAdmin,
        isStaff,
        isAuthenticated,
        
        // Actions
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