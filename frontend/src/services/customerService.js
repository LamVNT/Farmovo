import axios from 'axios';

export const customerService = {
    getAllCustomers: async () => {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/admin/customerList`, {
            withCredentials: true,
        });
        return response.data;
    },

    getSuppliers: async () => {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/suppliers`, {
            withCredentials: true,
        });
        return response.data;
    },

    getCustomerById: async (id) => {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/${id}`, {
            withCredentials: true,
        });
        return response.data;
    },

    createCustomer: async (customerDto) => {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/customer`, customerDto, {
            withCredentials: true,
        });
        return response.data;
    },

    updateCustomer: async (id, customerDto) => {
        const response = await axios.put(`${import.meta.env.VITE_API_URL}/customer/${id}`, customerDto, {
            withCredentials: true,
        });
        return response.data;
    },

    deleteCustomer: async (id, deletedBy) => {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/customer/${id}`, {
            data: { deletedBy },
            withCredentials: true,
        });
        return response.data;
    },

    searchCustomersByName: async (name) => {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/search?name=${encodeURIComponent(name)}`, {
            withCredentials: true,
        });
        return response.data;
    },
};
