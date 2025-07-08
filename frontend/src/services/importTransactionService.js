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
    }
};

export default importTransactionService;
