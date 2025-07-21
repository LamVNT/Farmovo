import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/products`;

export const productService = {
    getAllProducts: async () => {
        try {
            const response = await axios.get(`${API_URL}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Không thể lấy danh sách sản phẩm');
        }
    },

    getProductById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Không thể lấy thông tin sản phẩm');
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await axios.post(`${API_URL}`, productData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Không thể tạo sản phẩm');
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, productData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Không thể cập nhật sản phẩm');
        }
    },

    deleteProduct: async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                withCredentials: true,
            });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Không thể xóa sản phẩm');
        }
    },

    // API mới lấy sản phẩm theo zone
    getProductsByZone: async (zoneId) => {
        const apiBase = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiBase}/stocktakes/products-by-zone?zoneId=${zoneId}`, {
            withCredentials: true,
        });
        return response.data;
    },

    // Lấy nhiều sản phẩm theo mảng id (filter từ getAllProducts)
    getProductsByIds: async (ids) => {
        const all = await productService.getAllProducts();
        return all.filter(p => ids.includes(p.proId));
    },
};
