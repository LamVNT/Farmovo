import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export const getAllStores = async () => {
    console.log("Fetching all stores");
    try {
        const response = await axios.get(`${API_URL}/admin/storeList`, {
            withCredentials: true, // Sử dụng cookie để xác thực
        });
        console.log(`Successfully fetched ${response.data.length} stores`);
        return response.data;
    } catch (error) {
        console.error("Error fetching stores:", error.response?.data || error.message);
        throw error;
    }
};

export const uploadEvidence = async (file) => {
    console.log("Uploading evidence file:", file.name);
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/debt/admin/upload-evidence`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
        });
        console.log("Successfully uploaded evidence file:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error uploading evidence file:", error.response?.data || error.message);
        throw error;
    }
};

export const getStoreById = async (storeId) => {
    console.log(`Fetching store with ID: ${storeId}`);
    try {
        const response = await axios.get(`${API_URL}/store/${storeId}`, {
            withCredentials: true, // Sử dụng cookie để xác thực
        });
        console.log(`Successfully fetched store with ID: ${storeId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching store with ID: ${storeId}`, error.response?.data || error.message);
        throw error;
    }
};

export const createStore = async (store) => {
    try {
        const response = await axios.post(`${API_URL}/store`, store, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error("Error creating store:", error.response?.data || error.message);
        throw error;
    }
};

export const updateStore = async (id, store) => {
    try {
        const response = await axios.put(`${API_URL}/store/${id}`, store, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error("Error updating store:", error.response?.data || error.message);
        throw error;
    }
};

export const deleteStore = async (id) => {
    try {
        await axios.delete(`${API_URL}/store/${id}`, {
            withCredentials: true,
        });
    } catch (error) {
        console.error("Error deleting store:", error.response?.data || error.message);
        throw error;
    }
};