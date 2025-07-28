import api from './axiosClient';

const importTransactionService = {
    async listAll() {
        const res = await api.get('/import-transaction/list-all');
        return res.data;
    },

    async getById(id) {
        const res = await api.get(`/import-transaction/${id}`);
        return res.data;
    },

    async getWithDetails(id) {
        const res = await api.get(`/import-transaction/${id}`);
        return res.data;
    },

    async create(dto) {
        const res = await api.post('/import-transaction/save', dto);
        return res.data;
    },

    async getCreateFormData() {
        const res = await api.get('/import-transaction/create-form-data');
        return res.data;
    },

    async filterByParams(params) {
        const res = await api.get('/import-transaction/filter', { params });
        return res.data;
    },

    async updateStatus(id) {
        const res = await api.put(`/import-transaction/${id}/cancel`);
        return res.data;
    },

    async openTransaction(id) {
        const res = await api.put(`/import-transaction/${id}/open`);
        return res.data;
    },

    async completeTransaction(id) {
        const res = await api.put(`/import-transaction/${id}/complete`);
        return res.data;
    },

    async closeTransaction(id) {
        const res = await api.put(`/import-transaction/${id}/close-transaction`);
        return res.data;
    },

    async getNextCode() {
        const res = await api.get('/import-transaction/next-code');
        return res.data;
    },

    async exportPdf(id) {
        try {
            const res = await api.get(`/import-transaction/${id}/export`, {
                responseType: 'blob',
            });
            return res.data;
        } catch (error) {
            console.error('Error in exportPdf:', error);
            throw error;
        }
    },

    async listPaged(params) {
        const res = await api.get('/import-transaction/list-all', { params });
        return res.data;
    }
};

export default importTransactionService;
