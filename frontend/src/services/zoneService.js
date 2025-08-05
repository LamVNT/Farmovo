import api from './axiosClient';

const API_URL = '/zones';
export const getZones = async () => {
    try {
        const response = await api.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching zones:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch zones');
    }
};

export const createZone = async (data) => {
    try {
        const response = await api.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error('Error creating zone:', error);
        throw new Error(error.response?.data?.message || 'Failed to create zone');
    }
};

export const updateZone = async (id, data) => {
    try {
        const response = await api.put(`${API_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating zone:', error);
        throw new Error(error.response?.data?.message || 'Failed to update zone');
    }
};

export const deleteZone = async (id) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting zone:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete zone');
    }
};

// API mới lấy zone có sản phẩm tồn kho
export const getZonesWithProducts = async () => {
    const response = await api.get('/stocktakes/zones-with-products');
    return response.data;
};

// API mới lấy zone theo sản phẩm
export const getZonesByProduct = async (productId) => {
    const response = await api.get(`/stocktakes/zones-by-product?productId=${productId}`);
    return response.data;
};

// API mới lấy sản phẩm theo zone
export const getProductsByZone = async (zoneId) => {
    const response = await api.get(`/stocktakes/products-by-zone?zoneId=${zoneId}`);
    return response.data;
};