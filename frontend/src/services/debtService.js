import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/debts`;

export const debtService = {
    getAllDebtNotes: async () => {
        try {
            const response = await axios.get(`${API_URL}/all`, {
                withCredentials: true,
            });
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.data)) {
                return data.data; // Handle case where data is wrapped in { data: [...] }
            } else {
                console.warn('Unexpected response format for getAllDebtNotes:', data);
                return [];
            }
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.response?.data ||
                `Không thể lấy danh sách công nợ: ${error.message}`
            );
        }
    },

    getDebtNoteById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.response?.data ||
                `Không thể lấy thông tin công nợ với ID ${id}: ${error.message}`
            );
        }
    },

    getAllDebtors: async () => {
        try {
            const response = await axios.get(`${API_URL}/debtors`, {
                withCredentials: true,
            });
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.data)) {
                return data.data;
            } else {
                console.warn('Unexpected response format for getAllDebtors:', data);
                return [];
            }
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.response?.data ||
                `Không thể lấy danh sách người nợ: ${error.message}`
            );
        }
    },

    createDebtNote: async (debtData) => {
        try {
            const response = await axios.post(API_URL, debtData, {
                withCredentials: true,
                params: { createdBy: localStorage.getItem('userId') || 1 },
            });
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.response?.data ||
                `Không thể tạo công nợ: ${error.message}`
            );
        }
    },

    updateDebtNote: async (id, debtData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, debtData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.response?.data ||
                `Không thể cập nhật công nợ với ID ${id}: ${error.message}`
            );
        }
    },

    softDeleteDebtNote: async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                withCredentials: true,
                params: { deletedBy: localStorage.getItem('userId') || 1 },
            });
            return true;
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.response?.data ||
                `Không thể xóa công nợ với ID ${id}: ${error.message}`
            );
        }
    },

    getDebtNotesByCustomerId: async (customerId) => {
        try {
            const response = await axios.get(`${API_URL}/customer/${customerId}`, {
                withCredentials: true,
            });
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.data)) {
                return data.data;
            } else {
                console.warn('Unexpected response format for getDebtNotesByCustomerId:', data);
                return [];
            }
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.response?.data ||
                `Không thể lấy danh sách công nợ theo khách hàng ID ${customerId}: ${error.message}`
            );
        }
    },

    getDebtNotesByStoreId: async (storeId) => {
        try {
            const response = await axios.get(`${API_URL}/store/${storeId}`, {
                withCredentials: true,
            });
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.data)) {
                return data.data;
            } else {
                console.warn('Unexpected response format for getDebtNotesByStoreId:', data);
                return [];
            }
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.response?.data ||
                `Không thể lấy danh sách công nợ theo cửa hàng ID ${storeId}: ${error.message}`
            );
        }
    },
};