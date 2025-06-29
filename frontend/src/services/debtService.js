import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/debts`;

export const debtService = {
    getAllDebtNotes: async () => {
        try {
            const response = await axios.get(API_URL, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy danh sách công nợ');
        }
    },

    getDebtNoteById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy thông tin công nợ');
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
            throw new Error(error.response?.data || 'Không thể tạo công nợ');
        }
    },

    updateDebtNote: async (id, debtData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, debtData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể cập nhật công nợ');
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
            throw new Error(error.response?.data || 'Không thể xóa công nợ');
        }
    },

    getDebtNotesByCustomerId: async (customerId) => {
        try {
            const response = await axios.get(`${API_URL}/customer/${customerId}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy danh sách công nợ theo khách hàng');
        }
    },

    getDebtNotesByStoreId: async (storeId) => {
        try {
            const response = await axios.get(`${API_URL}/store/${storeId}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy danh sách công nợ theo cửa hàng');
        }
    },
};