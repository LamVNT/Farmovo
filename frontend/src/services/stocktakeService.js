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
