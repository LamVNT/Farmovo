import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export const userService = {
    getAllUsers: async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/userList`, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy danh sách người dùng');
        }
    },

    getUserById: async (id) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/${id}`, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy thông tin người dùng');
        }
    },

    getCurrentUser: async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/staff/me`, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy thông tin người dùng hiện tại');
        }
    },

    createUser: async (userData) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/createUser`, userData, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể tạo người dùng');
        }
    },

    updateUser: async (id, userData) => {
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/admin/${id}`, userData, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể cập nhật người dùng');
        }
    },

    updateCurrentUser: async (userData) => {
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/staff/me`, userData, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể cập nhật thông tin người dùng hiện tại');
        }
    },

    deleteUser: async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/admin/${id}`, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return true;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể xóa người dùng');
        }
    },

    toggleUserStatus: async (id) => {
        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/admin/${id}/toggle-status`, null, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể chuyển đổi trạng thái người dùng');
        }
    },

    updateUserStatus: async (id, status) => {
        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/admin/${id}/status`, { status }, {
                withCredentials: true, // Sử dụng cookie để xác thực
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể cập nhật trạng thái người dùng');
        }
    },

    // Paged search (page, size, username, email, status, fromDate, toDate)
    getUsersPaged: async (params = {}) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
                params,
                withCredentials: true,
            });
            return response.data; // Expect PageResponse<UserResponseDto>
        } catch (error) {
            console.error('Error in getUsersPaged:', error.response?.data || error.message);
            throw error;
        }
    },
};