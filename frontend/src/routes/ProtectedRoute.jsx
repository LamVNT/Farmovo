import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthorizationContext';

/**
 * ProtectedRoute component để bảo vệ routes dựa trên authentication và authorization
 * 
 * @param {React.ReactNode} children - Nội dung hiển thị khi có quyền truy cập
 * @param {Array|string} allowedRoles - Danh sách roles được phép truy cập (optional)
 * @param {string} redirectTo - Route để redirect khi không có quyền (default: '/login')
 * @param {string} unauthorizedRedirect - Route để redirect khi đã đăng nhập nhưng không có quyền (default: '/unauthorized')
 */
const ProtectedRoute = ({ 
    children, 
    allowedRoles = [], 
    redirectTo = '/login',
    unauthorizedRedirect = '/unauthorized'
}) => {
    const { isAuthenticated, hasAnyRole, loading } = useAuth();

    // Hiển thị loading trong khi kiểm tra authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Kiểm tra authentication
    if (!isAuthenticated()) {
        return <Navigate to={redirectTo} replace />;
    }

    // Nếu không yêu cầu roles cụ thể, cho phép truy cập
    if (!allowedRoles || (Array.isArray(allowedRoles) && allowedRoles.length === 0)) {
        return children;
    }

    // Kiểm tra authorization
    if (!hasAnyRole(allowedRoles)) {
        return <Navigate to={unauthorizedRedirect} replace />;
    }

    return children;
};

export default ProtectedRoute;