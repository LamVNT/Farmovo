import axios from './axiosClient';

export const getStocktakeList = (filters = {}) => {
    return axios.get('/stocktakes/paged', { params: filters })
        .then(res => res.data);
};

export const getStocktakeById = (id) => {
    return axios.get(`/stocktakes/${id}`).then(res => res.data);
};

export const createStocktake = (data) => {
    return axios.post('/stocktakes', data).then(res => res.data);
};

export const updateStocktakeStatus = (id, status) => {
    return axios.put(`/stocktakes/${id}/status?status=${status}`).then(res => res.data);
};

export const updateStocktake = (id, data) => {
    return axios.put(`/stocktakes/${id}`, data).then(res => res.data);
};

export const deleteStocktake = (id) => {
    return axios.delete(`/stocktakes/${id}`).then(res => res.data);
};

export const checkMissingZones = (details) => {
    return axios.post('/stocktakes/check-missing-zones', details).then(res => res.data);
};

export const getStocktakeDiff = (stocktakeId) => {
    return axios.get(`/reports/stocktake-diff?stocktakeId=${stocktakeId}`).then(res => res.data);
};

export const getStocktakeLots = (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.store) searchParams.append('store', params.store);
    if (params.zone) searchParams.append('zone', params.zone);
    if (params.product) searchParams.append('product', params.product);
    if (params.isCheck !== undefined) searchParams.append('isCheck', params.isCheck);
    if (params.batchCode) searchParams.append('batchCode', params.batchCode);
    if (params.search) searchParams.append('search', params.search);
    if (params.createdAtFrom) searchParams.append('createdAtFrom', params.createdAtFrom);
    if (params.createdAtTo) searchParams.append('createdAtTo', params.createdAtTo);
    return axios.get(`/import-details/stocktake-lot?${searchParams.toString()}`).then(res => res.data);
};
