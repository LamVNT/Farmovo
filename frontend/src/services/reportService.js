import axios from './axiosClient';

export const getRemainByProduct = () => {
    return axios.get('/reports/remain-by-product');
};

export const getStocktakeDiff = () => {
    return axios.get('/reports/stocktake-diff');
};

export const getExpiringLots = () => {
    return axios.get('/reports/expiring-lots');
}; 