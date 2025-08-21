import axios from './axiosClient';

export const getRemainByProduct = () => {
    let storeId;
    try {
        const userRaw = localStorage.getItem('user');
        const user = userRaw ? JSON.parse(userRaw) : null;
        if (user && Array.isArray(user.roles) && (user.roles.includes('STAFF') || user.roles.includes('ROLE_STAFF')) && user.storeId) {
            storeId = user.storeId;
        }
    } catch (_) {}
    return axios.get('/reports/remain-by-product', { params: { storeId } });
};

export const getStocktakeDiff = (params) => {
    return axios.get('/reports/stocktake-diff', { params });
};

export const getExpiringLots = () => {
    let storeId;
    try {
        const userRaw = localStorage.getItem('user');
        const user = userRaw ? JSON.parse(userRaw) : null;
        if (user && Array.isArray(user.roles) && (user.roles.includes('STAFF') || user.roles.includes('ROLE_STAFF')) && user.storeId) {
            storeId = user.storeId;
        }
    } catch (_) {}
    return axios.get('/reports/expiring-lots', { params: { storeId } });
};

// New report APIs
export const getDailyRevenue = ({ from, to, storeId }) => {
    return axios.get('/reports/daily-revenue', { params: { from, to, storeId } });
};

export const getSalesTotal = ({ from, to, groupBy = 'shift', storeId, cashierId }) => {
    return axios.get('/reports/sales-total', { params: { from, to, groupBy, storeId, cashierId } });
};

export const getImportsTotal = ({ from, to, groupBy = 'day', storeId, supplierId }) => {
    return axios.get('/reports/imports-total', { params: { from, to, groupBy, storeId, supplierId } });
};

export const getExpiringLotsAdvanced = ({ days = 7, storeId, categoryId, productId, includeZeroRemain = false }) => {
    return axios.get('/reports/expiring-lots-advanced', { params: { days, storeId, categoryId, productId, includeZeroRemain } });
}; 