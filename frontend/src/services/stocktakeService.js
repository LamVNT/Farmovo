import axios from './axiosClient';

export const getStocktakeList = () => {
    return axios.get('/stocktakes');
};

export const getStocktakeById = (id) => {
    return axios.get(`/stocktakes/${id}`);
};

export const createStocktake = (data) => {
    return axios.post('/stocktakes', data);
};

export const updateStocktakeStatus = (id, status) => {
    return axios.put(`/stocktakes/${id}/status?status=${status}`);
};

export const updateStocktake = (id, data) => {
    return axios.put(`/stocktakes/${id}`, data);
};

export const deleteStocktake = (id) => {
    return axios.delete(`/stocktakes/${id}`);
};

// Thêm hàm kiểm tra thiếu zone
export const checkMissingZones = (details) => {
    return axios.post('/stocktakes/check-missing-zones', details);
};
