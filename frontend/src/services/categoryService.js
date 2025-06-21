import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/categories`;

export const getCategories = async () => {
    const response = await axios.get(API_URL, { withCredentials: true });
    return response.data;
};

export const createCategory = async (data) => {
    const response = await axios.post(API_URL, data, { withCredentials: true });
    return response.data;
};

export const updateCategory = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data, { withCredentials: true });
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};
