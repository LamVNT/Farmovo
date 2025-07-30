import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/debt/admin`;

export const getDebtNotesByCustomerId = async (customerId, page = 0, size = 10, filters = {}) => {
    console.log(`Fetching debt notes for customer ID: ${customerId}, page: ${page}, size: ${size}`, filters);
    try {
        const params = { page, size, ...filters };
        const response = await axios.get(`${API_URL}/customer/${customerId}/debt-notes`, {
            params,
            withCredentials: true,
        });
        const data = response.data;
        // Chuẩn hoá tên trường để frontend cũ vẫn dùng được
        if (data && data.totalElements !== undefined && data.totalItems === undefined) {
            data.totalItems = data.totalElements;
        }
        return data;
    } catch (error) {
        console.error(`Error fetching debt notes for customer ID: ${customerId}`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};


export const addDebtNote = async (debtNoteData) => {
    console.log("Adding new debt note:", debtNoteData);
    try {
        const response = await axios.post(`${API_URL}/debt-note`, debtNoteData, {
            withCredentials: true, // Sử dụng cookie để xác thực
        });
        console.log(`Successfully added debt note with ID: ${response.data.id}`);
        return response.data;
    } catch (error) {
        console.error("Error adding debt note:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};


export const updateDebtNote = async (debtId, debtNoteData) => {
    console.log(`Updating debt note ID: ${debtId} with data:`, debtNoteData);
    try {
        const response = await axios.put(`${API_URL}/debt-note/${debtId}`, debtNoteData, {
            withCredentials: true, // Sử dụng cookie để xác thực
        });
        console.log(`Successfully updated debt note with ID: ${debtId}`);
        return response.data;
    } catch (error) {
        console.error("Error updating debt note ID: ${debtId}", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};


export const getTotalDebtByCustomerId = async (customerId) => {
    console.log(`Fetching total debt for customer ID: ${customerId}`);
    try {
        const response = await axios.get(`${API_URL}/customer/${customerId}/total-debt`, {
            withCredentials: true, // Sử dụng cookie để xác thực
        });
        console.log(`Successfully fetched total debt: ${response.data} for customer ID: ${customerId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching total debt for customer ID: ${customerId}`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};