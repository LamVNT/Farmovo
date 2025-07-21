/**
 * Format số tiền theo định dạng VND
 * @param {number} value - Số tiền cần format
 * @returns {string} Chuỗi đã format (ví dụ: "1,000,000 VND")
 */
export const formatCurrency = (value) => {
    const number = Number(value);
    return !isNaN(number) ? number.toLocaleString('vi-VN') + ' VND' : '0 VND';
};

/**
 * Format ngày tháng theo định dạng Việt Nam
 * @param {Date|string} date - Ngày cần format
 * @returns {string} Chuỗi đã format (ví dụ: "01/01/2024")
 */
export const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('vi-VN');
};

/**
 * Format ngày giờ theo định dạng Việt Nam
 * @param {Date|string} date - Ngày giờ cần format
 * @returns {string} Chuỗi đã format (ví dụ: "01/01/2024 14:30")
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleString('vi-VN');
};

/**
 * Kiểm tra value có hợp lệ trong danh sách options không
 * @param {any} value - Giá trị cần kiểm tra
 * @param {Array} options - Danh sách options
 * @returns {boolean} true nếu hợp lệ
 */
export const isValidValue = (value, options) => {
    return options.some(opt => String(opt.id) === String(value));
}; 