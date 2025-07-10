import api from './axiosClient';

const saleTransactionService = {
    async listAll() {
        try {
            const res = await api.get('/sale-transactions/list-all');
            return res.data;
        } catch (error) {
            console.error('Error in listAll:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const res = await api.get(`/sale-transactions/${id}`);
            return res.data;
        } catch (error) {
            console.error('Error in getById:', error);
            throw error;
        }
    },

    async create(dto) {
        try {
            const res = await api.post('/sale-transactions/save', dto);
            return res.data;
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    },

    async update(id, dto) {
        try {
            const res = await api.put(`/sale-transactions/${id}`, dto);
            return res.data;
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    },

    async getCreateFormData() {
        try {
            console.log('Calling getCreateFormData...');
            const res = await api.get('/sale-transactions/create-form-data');
            console.log('getCreateFormData response:', res);
            return res.data;
        } catch (error) {
            console.error('Error in getCreateFormData:', error);
            console.error('Error response:', error.response);
            throw error;
        }
    },

    async getBatchesByProductId(productId) {
        try {
            console.log('Calling getBatchesByProductId for product:', productId);
            const res = await api.get(`/sale-transactions/product-response/${productId}`);
            console.log('getBatchesByProductId response:', res);
            return res.data;
        } catch (error) {
            console.error('Error in getBatchesByProductId:', error);
            console.error('Error response:', error.response);
            throw error;
        }
    }
};

export default saleTransactionService; 