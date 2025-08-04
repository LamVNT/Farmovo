import api from './axiosClient';

const API_URL = '/categories';
export const getCategories = async (params = {}) => {
    try {
        const response = await api.get(`${API_URL}/paged`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
};

export const createCategory = async (data) => {
    try {
        const response = await api.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error('Error creating category:', error);
        throw new Error(error.response?.data?.message || 'Failed to create category');
    }
};

export const updateCategory = async (id, data) => {
    try {
        const response = await api.put(`${API_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating category:', error);
        throw new Error(error.response?.data?.message || 'Failed to update category');
    }
};

export const deleteCategory = async (id) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
};
