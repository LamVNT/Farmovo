import React from 'react';
import { useAuth } from '../contexts/AuthorizationContext';

/**
 * PermissionGate component để kiểm soát việc hiển thị UI dựa trên quyền hạn
 * 
 * @param {Array|string} roles - Danh sách roles yêu cầu hoặc một role duy nhất
 * @param {string} mode - 'any' (có ít nhất 1 role) hoặc 'all' (có tất cả roles). Default: 'any'
 * @param {React.ReactNode} children - Nội dung hiển thị khi có quyền
 * @param {React.ReactNode} fallback - Nội dung hiển thị khi không có quyền (default: null)
 * @param {boolean} requireAuth - Có yêu cầu đăng nhập không (default: true)
 * @param {React.ReactNode} loadingComponent - Component hiển thị khi đang loading
 */
const PermissionGate = ({ 
    roles = [], 
    mode = 'any',
    children, 
    fallback = null,
    requireAuth = true,
    loadingComponent = null
}) => {
    const { hasAnyRole, hasAllRoles, isAuthenticated, loading } = useAuth();

    // Hiển thị loading component nếu đang tải
    if (loading) {
        return loadingComponent || <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
    }

    // Kiểm tra đăng nhập nếu được yêu cầu
    if (requireAuth && !isAuthenticated()) {
        return fallback;
    }

    // Nếu không yêu cầu roles cụ thể, hiển thị children
    if (!roles || (Array.isArray(roles) && roles.length === 0)) {
        return children;
    }

    // Kiểm tra quyền hạn
    let hasPermission = false;
    
    if (mode === 'all') {
        hasPermission = hasAllRoles(roles);
    } else {
        hasPermission = hasAnyRole(roles);
    }

    return hasPermission ? children : fallback;
};

/**
 * AdminOnly component - chỉ hiển thị cho ADMIN
 */
export const AdminOnly = ({ children, fallback = null, loadingComponent = null }) => {
    return (
        <PermissionGate 
            roles={['ROLE_ADMIN']} 
            fallback={fallback}
            loadingComponent={loadingComponent}
        >
            {children}
        </PermissionGate>
    );
};

/**
 * StaffOnly component - chỉ hiển thị cho STAFF (không phải ADMIN)
 */
export const StaffOnly = ({ children, fallback = null, loadingComponent = null }) => {
    return (
        <PermissionGate 
            roles={['ROLE_STAFF']} 
            fallback={fallback}
            loadingComponent={loadingComponent}
        >
            {children}
        </PermissionGate>
    );
};

/**
 * AuthenticatedOnly component - chỉ hiển thị cho user đã đăng nhập
 */
export const AuthenticatedOnly = ({ children, fallback = null, loadingComponent = null }) => {
    return (
        <PermissionGate 
            roles={[]} 
            requireAuth={true}
            fallback={fallback}
            loadingComponent={loadingComponent}
        >
            {children}
        </PermissionGate>
    );
};

/**
 * ConditionalRender component - hiển thị component khác nhau dựa trên role
 */
export const ConditionalRender = ({ 
    adminComponent = null, 
    staffComponent = null, 
    defaultComponent = null,
    loadingComponent = null
}) => {
    const { isAdmin, isStaff, loading } = useAuth();

    if (loading) {
        return loadingComponent || <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
    }

    if (isAdmin()) {
        return adminComponent || defaultComponent;
    }
    
    if (isStaff()) {
        return staffComponent || defaultComponent;
    }
    
    return defaultComponent;
};

export default PermissionGate;