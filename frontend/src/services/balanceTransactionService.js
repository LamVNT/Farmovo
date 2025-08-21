import api from './axiosClient';

const balanceTransactionService = {
    async listPaged(params) {
        try {
            try {
                const userRaw = localStorage.getItem('user');
                const user = userRaw ? JSON.parse(userRaw) : null;
                if (user && Array.isArray(user.roles) && (user.roles.includes('STAFF') || user.roles.includes('ROLE_STAFF')) && user.storeId) {
                    params = { ...params, storeId: user.storeId };
                }
            } catch (_) {}
            const res = await api.get('/sale-transactions/list-all', { params: { ...params, isBalanceStock: true } });
            return res.data;
        } catch (error) {
            console.error('Error in listPaged (balance):', error);
            throw error;
        }
    },
    async getById(id) {
        try {
            const res = await api.get(`/sale-transactions/${id}`);
            return res.data;
        } catch (error) {
            console.error('Error in getById (balance):', error);
            throw error;
        }
    },
};

export default balanceTransactionService; 