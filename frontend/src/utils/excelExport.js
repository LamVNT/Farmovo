import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Hàm xuất danh sách import transactions
export const exportImportTransactions = (transactions) => {
    // Chuẩn bị dữ liệu cho Excel
    const data = transactions.map((transaction, index) => ({
        'STT': index + 1,
        'ID': transaction.id,
        'Tên phiếu nhập': transaction.name,
        'Thời gian': transaction.importDate ? new Date(transaction.importDate).toLocaleString('vi-VN') : '',
        'Nhà cung cấp': transaction.supplierName || '',
        'Tổng tiền': transaction.totalAmount ? transaction.totalAmount.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ',
        'Đã thanh toán': transaction.paidAmount ? transaction.paidAmount.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ',
        'Còn lại': ((transaction.totalAmount || 0) - (transaction.paidAmount || 0)).toLocaleString('vi-VN') + ' VNĐ',
        'Trạng thái': getStatusLabel(transaction.status),
        'Người tạo': transaction.createdBy || '',
        'Ghi chú': transaction.importTransactionNote || ''
    }));

    // Tạo workbook và worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách phiếu nhập');

    // Điều chỉnh độ rộng cột
    const colWidths = [
        { wch: 5 },   // STT
        { wch: 8 },   // ID
        { wch: 25 },  // Tên phiếu nhập
        { wch: 20 },  // Thời gian
        { wch: 20 },  // Nhà cung cấp
        { wch: 15 },  // Tổng tiền
        { wch: 15 },  // Đã thanh toán
        { wch: 15 },  // Còn lại
        { wch: 15 },  // Trạng thái
        { wch: 15 },  // Người tạo
        { wch: 30 }   // Ghi chú
    ];
    ws['!cols'] = colWidths;

    // Xuất file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Danh_sach_phieu_nhap_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
};

// Hàm xuất chi tiết một import transaction
export const exportImportTransactionDetail = (transaction, details, supplierDetails = null, userDetails = null) => {
    // Sheet 1: Thông tin phiếu nhập
    const transactionInfo = [
        { 'Thông tin': 'ID phiếu nhập', 'Giá trị': transaction.id },
        { 'Thông tin': 'Tên phiếu nhập', 'Giá trị': transaction.name },
        { 'Thông tin': 'Thời gian nhập', 'Giá trị': transaction.importDate ? new Date(transaction.importDate).toLocaleString('vi-VN') : '' },
        { 'Thông tin': 'Nhà cung cấp', 'Giá trị': supplierDetails ? supplierDetails.name : (transaction.supplierName || 'N/A') },
        { 'Thông tin': 'Người tạo', 'Giá trị': userDetails ? userDetails.username : (transaction.createdBy || 'N/A') },
        { 'Thông tin': 'Tổng tiền hàng', 'Giá trị': transaction.totalAmount ? transaction.totalAmount.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ' },
        { 'Thông tin': 'Đã thanh toán', 'Giá trị': transaction.paidAmount ? transaction.paidAmount.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ' },
        { 'Thông tin': 'Còn lại', 'Giá trị': (transaction.totalAmount - (transaction.paidAmount || 0)).toLocaleString('vi-VN') + ' VNĐ' },
        { 'Thông tin': 'Trạng thái', 'Giá trị': getStatusLabel(transaction.status) },
        { 'Thông tin': 'Ghi chú', 'Giá trị': transaction.importTransactionNote || '' }
    ];

    // Sheet 2: Chi tiết sản phẩm
    const productDetails = details.map((detail, index) => ({
        'STT': index + 1,
        'Tên sản phẩm': detail.productName || '',
        'Số lượng nhập': detail.importQuantity || 0,
        'Số lượng còn lại': detail.remainQuantity || 0,
        'Đơn giá nhập': detail.unitImportPrice ? detail.unitImportPrice.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ',
        'Đơn giá bán': detail.unitSalePrice ? detail.unitSalePrice.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ',
        'Thành tiền': ((detail.unitImportPrice || 0) * (detail.importQuantity || 0)).toLocaleString('vi-VN') + ' VNĐ',
        'Hạn sử dụng': detail.expireDate ? new Date(detail.expireDate).toLocaleDateString('vi-VN') : '',
        'Khu vực': detail.zones_id || ''
    }));

    // Tạo workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Thông tin phiếu nhập
    const ws1 = XLSX.utils.json_to_sheet(transactionInfo);
    XLSX.utils.book_append_sheet(wb, ws1, 'Thông tin phiếu nhập');

    // Sheet 2: Chi tiết sản phẩm
    const ws2 = XLSX.utils.json_to_sheet(productDetails);
    XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết sản phẩm');

    // Điều chỉnh độ rộng cột cho sheet 1
    ws1['!cols'] = [
        { wch: 20 },  // Thông tin
        { wch: 30 }   // Giá trị
    ];

    // Điều chỉnh độ rộng cột cho sheet 2
    ws2['!cols'] = [
        { wch: 5 },   // STT
        { wch: 25 },  // Tên sản phẩm
        { wch: 12 },  // Số lượng nhập
        { wch: 12 },  // Số lượng còn lại
        { wch: 15 },  // Đơn giá nhập
        { wch: 15 },  // Đơn giá bán
        { wch: 15 },  // Thành tiền
        { wch: 12 },  // Hạn sử dụng
        { wch: 15 }   // Khu vực
    ];

    // Xuất file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Chi_tiet_phieu_nhap_${transaction.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
};

// Hàm helper để chuyển đổi status
const getStatusLabel = (status) => {
    const statusMap = {
        'WAITING_FOR_APPROVE': 'Chờ xử lý',
        'COMPLETE': 'Đã hoàn thành',
        'CANCEL': 'Đã hủy',
        'DRAFT': 'Nháp'
    };
    return statusMap[status] || status;
}; 