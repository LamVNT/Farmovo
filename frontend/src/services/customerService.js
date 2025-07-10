import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/customers`;


export const getAllCustomers = async () => {
    console.log("Fetching all customers");
    try {
        const response = await axios.get(`${API_URL}/admin/customerList`, {
            withCredentials: true, // Sử dụng cookie để xác thực
        });
        console.log(`Successfully fetched ${response.data.length} customers`);
        return response.data;
    } catch (error) {
        console.error("Error fetching customers:", error.response?.data || error.message);
        throw error;
    }
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