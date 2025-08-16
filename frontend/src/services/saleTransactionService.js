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

    async listPaged(params) {
        try {
            // If current user is staff, enforce storeId from local storage token payload
            try {
                const userRaw = localStorage.getItem('user');
                const user = userRaw ? JSON.parse(userRaw) : null;
                if (user && Array.isArray(user.roles) && (user.roles.includes('STAFF') || user.roles.includes('ROLE_STAFF')) && user.storeId) {
                    params = { ...params, storeId: user.storeId };
                }
            } catch (_) {}
            const res = await api.get('/sale-transactions/list-all', {params});
            return res.data;
        } catch (error) {
            console.error('Error in listPaged:', error);
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

    // ➤ Phiếu bán thường
    async create(dto) {
        try {
            const res = await api.post('/sale-transactions/save', dto);
            return res.data;
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    },

    // ✅ ➤ Phiếu từ kiểm kê (cân bằng kho)
    async createFromBalance(dto) {
        try {
            const res = await api.post('/sale-transactions/save-from-balance', dto);
            return res.data;
        } catch (error) {
            console.error('Error in createFromBalance:', error);
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
    },

    async cancel(id) {
        try {
            const res = await api.put(`/sale-transactions/${id}/cancel`);
            return res.data;
        } catch (error) {
            console.error('Error in cancel:', error);
            throw error;
        }
    },

    async complete(id) {
        try {
            const res = await api.put(`/sale-transactions/${id}/complete`);
            return res.data;
        } catch (error) {
            console.error('Error in complete:', error);
            throw error;
        }
    },

    async softDelete(id) {
        try {
            const res = await api.delete(`/sale-transactions/sort-delete/${id}`);
            return res.data;
        } catch (error) {
            console.error('Error in softDelete:', error);
            throw error;
        }
    },

    async getNextCode() {
        try {
            const res = await api.get('/sale-transactions/next-code');
            return res.data;
        } catch (error) {
            console.error('Error in getNextCode:', error);
            throw error;
        }
    },

    async getNextBalanceCode() {
        try {
            const res = await api.get('/sale-transactions/next-code-balance');
            return res.data;
        } catch (error) {
            console.error('Error in getNextBalanceCode:', error);
            throw error;
        }
    },

    async exportPdf(id) {
        try {
            const res = await api.get(`/sale-transactions/${id}/export-pdf`, {
                responseType: 'blob',
            });
            return res.data;
        } catch (error) {
            console.error('Error in exportPdf:', error);
            throw error;
        }
    },

    async softDelete(id) {
        try {
            const res = await api.delete(`/sale-transactions/sort-delete/${id}`);
            return res.data;
        } catch (error) {
            console.error('Error in softDelete:', error);
            throw error;
        }
    }
};

export default saleTransactionService;

// Export gọn nếu dùng ở component
const createSaleTransaction = (dto) => saleTransactionService.create(dto);
const createBalanceTransaction = (dto) => saleTransactionService.createFromBalance(dto);

export {createSaleTransaction, createBalanceTransaction};
