import axiosClient from './axiosClient';

const userService = {
    // Lấy danh sách tất cả người dùng
    getAllUsers: async () => {
        try {
            const response = await axiosClient.get('/users/userList');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy danh sách người dùng');
        }
    },

    // Lấy chi tiết người dùng theo ID
    getUserById: async (id) => {
        try {
            const response = await axiosClient.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể lấy thông tin người dùng');
        }
    },

    // Tạo người dùng mới
    createUser: async (userData) => {
        try {
            const response = await axiosClient.post('/users/createUser', userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể tạo người dùng');
        }
    },

    // Cập nhật thông tin người dùng
    updateUser: async (id, userData) => {
        try {
            const response = await axiosClient.put(`/users/${id}`, userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể cập nhật người dùng');
        }
    },

    // Xóa người dùng
    deleteUser: async (id) => {
        try {
            await axiosClient.delete(`/users/${id}`);
            return true;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể xóa người dùng');
        }
    },

    // Chuyển đổi trạng thái người dùng
    toggleUserStatus: async (id) => {
        try {
            const response = await axiosClient.patch(`/users/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể chuyển đổi trạng thái người dùng');
        }
    },

    // Cập nhật trạng thái người dùng với giá trị cụ thể
    updateUserStatus: async (id, status) => {
        try {
            const response = await axiosClient.patch(`/users/${id}/status`, status);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Không thể cập nhật trạng thái người dùng');
        }
    },
};

export default userService;