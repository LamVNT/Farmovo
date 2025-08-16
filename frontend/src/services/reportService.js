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

export const getStocktakeDiff = () => {
    return axios.get('/reports/stocktake-diff');
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