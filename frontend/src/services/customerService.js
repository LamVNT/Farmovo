import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/customers`;

/**
 * Lấy danh sách tất cả khách hàng
 * @returns {Promise<Array>} - Danh sách khách hàng (CustomerResponseDto[])
 */
export const getAllCustomers = async () => {
    console.log("Fetching all customers");
    try {
        const response = await axios.get(`${API_URL}/admin/customerList`);
        console.log(`Successfully fetched ${response.data.length} customers`);
        return response.data;
    } catch (error) {
        console.error("Error fetching customers:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Lấy thông tin khách hàng theo ID
 * @param {number} customerId - ID của khách hàng
 * @returns {Promise<Object>} - Thông tin khách hàng (CustomerResponseDto)
 */
export const getCustomerById = async (customerId) => {
    console.log(`Fetching customer with ID: ${customerId}`);
    try {
        const response = await axios.get(`${API_URL}/${customerId}`);
        console.log(`Successfully fetched customer with ID: ${customerId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching customer with ID: ${customerId}`, error.response?.data || error.message);
        throw error;
    }
};