// routes/GuestRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthorizationContext";

/**
 * GuestRoute component – prevents authenticated users from accessing guest-only pages
 *
 * @param {React.ReactNode} children – The page/component that should only be visible to unauthenticated users
 * @param {string} redirectTo – Where to send the user if they are already authenticated (default: '/')
 */
const GuestRoute = ({ children, redirectTo = "/" }) => {
    const { isAuthenticated, loading } = useAuth();

    // While we are still checking authentication state just render nothing/spinner to avoid flicker
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // If the user is already logged in, redirect them away from guest pages
    if (isAuthenticated()) {
        return <Navigate to={redirectTo} replace />;
    }

    // Otherwise, render the requested guest page
    return children;
};

export default GuestRoute;
