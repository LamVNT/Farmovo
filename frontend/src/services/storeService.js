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
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/debt/admin/upload-evidence`, formData, {
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