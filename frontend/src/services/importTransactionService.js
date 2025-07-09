import api from './axiosClient';

const importTransactionService = {
    async listAll() {
        const res = await api.get('/importtransaction/list-all');
        return res.data;
    },

    async getById(id) {
        const res = await api.get(`/importtransaction/${id}`);
        return res.data;
    },

    async getWithDetails(id) {
        const res = await api.get(`/importtransaction/${id}`);
        return res.data;
    },

    async create(dto) {
        const res = await api.post('/importtransaction', dto);
        return res.data;
    },

    async getCreateFormData() {
        const res = await api.get('/importtransaction/create-form-data');
        return res.data;
    },

    async filterByParams(params) {
        const res = await api.get('/importtransaction/filter', { params });
        return res.data;
    },

    async updateStatus(id) {
        const res = await api.put(`/importtransaction/${id}/cancel`);
        return res.data;
    },

    async openTransaction(id) {
        const res = await api.put(`/importtransaction/${id}/open`);
        return res.data;
    },

    async getNextCode() {
        const res = await api.get('/importtransaction/next-code');
        return res.data;
    }
};

export default importTransactionService;
