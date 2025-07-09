import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}`;

/**
 * Lấy danh sách tất cả cửa hàng
 * @returns {Promise<Array>} - Danh sách cửa hàng (StoreResponseDto[])
 */
export const getAllStores = async () => {
    console.log("Fetching all stores");
    try {
        const response = await axios.get(`${API_URL}/admin/storeList`);
        console.log(`Successfully fetched ${response.data.length} stores`);
        return response.data;
    } catch (error) {
        console.error("Error fetching stores:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Tải file ảnh lên server
 * @param {File} file - File ảnh được chọn
 * @returns {Promise<string>} - Tên file hoặc URL sau khi tải lên
 */
export const uploadEvidence = async (file) => {
    console.log("Uploading evidence file:", file.name);
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/debt/upload-evidence`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("Successfully uploaded evidence file:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error uploading evidence file:", error.response?.data || error.message);
        throw error;
    }
};