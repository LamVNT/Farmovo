import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/customer`;


export const getAllCustomers = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/admin/customerList`, {
        withCredentials: true,
    });
    return response.data;
};

export const getCustomers = async (page = 0, size = 10, searchTerm = '') => {
    console.log(`Fetching customers with page: ${page}, size: ${size}, search: ${searchTerm}`);
    try {
        const params = {
            page: page,
            size: size,
            sort: 'name,asc'
        };
        
        if (searchTerm) {
            params.search = searchTerm;
        }
        
        const response = await axios.get(`${API_URL}/admin/customerPage`, {
            params: params,
            withCredentials: true,
        });
        console.log(`Successfully fetched customers: ${response.data.content?.length || 0} items`);
        return response.data;
    } catch (error) {
        console.error("Error fetching customers:", error.response?.data || error.message);
        throw error;
    }
};

export const customerService = {

    getCustomersPaged: async (params = {}) => {
        try {
            const response = await axios.get(`${API_URL}/admin`, {
                params,
                withCredentials: true,
            });
            return response.data; // PageResponse
        } catch (error) {
            console.error('Error in getCustomersPaged:', error.response?.data || error.message);
            throw error;
        }
    },

    getSuppliers: async () => {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/suppliers`, {
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
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/customer/${id}?deletedBy=${deletedBy}`, {
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


export const getCustomerById = async (customerId) => {
    console.log(`Fetching customer with ID: ${customerId}`);
    try {
        const response = await axios.get(`${API_URL}/admin/${customerId}`, {
            withCredentials: true, // Sử dụng cookie để xác thực
        });
        console.log(`Successfully fetched customer with ID: ${customerId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching customer with ID: ${customerId}`, error.response?.data || error.message);
        throw error;
    }
};