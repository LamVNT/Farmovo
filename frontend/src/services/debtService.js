import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/debt`;

/**
 * Lấy danh sách giao dịch nợ theo customerId
 * @param {number} customerId - ID của khách hàng
 * @returns {Promise<Array>} - Danh sách giao dịch nợ (DebtNoteResponseDto[])
 */
export const getDebtNotesByCustomerId = async (customerId) => {
    console.log(`Fetching debt notes for customer ID: ${customerId}`);
    try {
        const response = await axios.get(`${API_URL}/customer/${customerId}/debt-notes`);
        console.log(`Successfully fetched ${response.data.length} debt notes for customer ID: ${customerId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching debt notes for customer ID: ${customerId}`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};

/**
 * Thêm giao dịch nợ mới
 * @param {Object} debtNoteData - Dữ liệu giao dịch nợ (DebtNoteRequestDto)
 * @returns {Promise<Object>} - Giao dịch nợ đã tạo (DebtNoteResponseDto)
 */
export const addDebtNote = async (debtNoteData) => {
    console.log("Adding new debt note:", debtNoteData);
    try {
        const response = await axios.post(`${API_URL}/debt-note`, debtNoteData);
        console.log(`Successfully added debt note with ID: ${response.data.id}`);
        return response.data;
    } catch (error) {
        console.error("Error adding debt note:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};

/**
 * Chỉnh sửa giao dịch nợ
 * @param {number} debtId - ID của giao dịch nợ
 * @param {Object} debtNoteData - Dữ liệu giao dịch nợ (DebtNoteRequestDto)
 * @returns {Promise<Object>} - Giao dịch nợ đã cập nhật (DebtNoteResponseDto)
 */
export const updateDebtNote = async (debtId, debtNoteData) => {
    console.log(`Updating debt note ID: ${debtId} with data:`, debtNoteData);
    try {
        const response = await axios.put(`${API_URL}/debt-note/${debtId}`, debtNoteData);
        console.log(`Successfully updated debt note with ID: ${debtId}`);
        return response.data;
    } catch (error) {
        console.error("Error updating debt note ID: ${debtId}", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};

/**
 * Tính tổng nợ của khách hàng
 * @param {number} customerId - ID của khách hàng
 * @returns {Promise<number>} - Tổng nợ (BigDecimal)
 */
export const getTotalDebtByCustomerId = async (customerId) => {
    console.log(`Fetching total debt for customer ID: ${customerId}`);
    try {
        const response = await axios.get(`${API_URL}/customer/${customerId}/total-debt`);
        console.log(`Successfully fetched total debt: ${response.data} for customer ID: ${customerId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching total debt for customer ID: ${customerId}`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};