import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    Box,
} from '@mui/material';
import { FaPrint, FaCheck, FaTimes } from 'react-icons/fa';

const SaleSummaryDialog = ({
    open,
    onClose,
    onConfirm,
    saleData,
    formatCurrency,
    loading,
    currentUser,
    nextCode
}) => {
    if (!saleData) return null;

    const { customer, store, products, totalAmount, paidAmount, note, saleDate, status, name } = saleData;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="flex justify-between items-center bg-gray-50">
                <div className="flex flex-col items-start">
                    <Typography variant="h6" className="font-bold text-gray-800" style={{display: 'inline', fontWeight: 700}}>
                        PHIẾU BÁN HÀNG: {name || nextCode || '---'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        {status === 'DRAFT' ? '📝 Phiếu tạm thời' : '✅ Phiếu hoàn thành'}
                    </Typography>
                </div>
                <div className="text-right">
                    <Typography variant="body2" className="text-gray-600">
                        Ngày: {saleDate ? new Date(saleDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Giờ: {new Date().toLocaleTimeString('vi-VN')}
                    </Typography>
                </div>
            </DialogTitle>

            <DialogContent className="p-6">
                {/* Thông tin khách hàng và cửa hàng */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <Typography variant="subtitle1" className="font-semibold mb-2 text-blue-600">
                            🏪 THÔNG TIN CỬA HÀNG
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Tên cửa hàng:</strong> {store?.storeName || store?.name || 'Chưa chọn'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Địa chỉ:</strong> {store?.storeAddress || store?.address || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Người tạo:</strong> {currentUser?.fullName || currentUser?.name || 'Chưa có'}
                        </Typography>
                        {store?.storeDescription && (
                            <Typography variant="body2" className="mb-1">
                                <strong>Mô tả:</strong> {store.storeDescription}
                            </Typography>
                        )}
                    </div>
                    <div>
                        <Typography variant="subtitle1" className="font-semibold mb-2 text-green-600">
                            👤 THÔNG TIN KHÁCH HÀNG
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Tên khách hàng:</strong> {customer?.customerName || customer?.name || 'Chưa chọn'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Số điện thoại:</strong> {customer?.customerPhone || customer?.phone || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Địa chỉ:</strong> {customer?.customerAddress || customer?.address || 'Chưa có'}
                        </Typography>
                        {customer?.customerEmail && (
                            <Typography variant="body2" className="mb-1">
                                <strong>Email:</strong> {customer.customerEmail}
                            </Typography>
                        )}
                    </div>
                </div>

                <Divider className="my-4" />

                {/* Bảng sản phẩm */}
                <Typography variant="subtitle1" className="font-semibold mb-3 text-gray-800">
                    📦 DANH SÁCH SẢN PHẨM
                </Typography>
                
                <TableContainer component={Paper} className="mb-4">
                    <Table size="small">
                        <TableHead>
                            <TableRow className="bg-gray-100">
                                <TableCell className="font-semibold">STT</TableCell>
                                <TableCell className="font-semibold">Tên sản phẩm</TableCell>
                                <TableCell className="font-semibold text-center">ĐVT</TableCell>
                                <TableCell className="font-semibold text-center">Số lượng</TableCell>
                                <TableCell className="font-semibold text-right">Đơn giá</TableCell>
                                <TableCell className="font-semibold text-right">Thành tiền</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product, index) => (
                                <TableRow key={product.id} className="hover:bg-gray-50">
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-gray-500">
                                                Mã: {product.productCode || product.code || 'N/A'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{product.unit || 'quả'}</TableCell>
                                    <TableCell className="text-center">{product.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(product.price * product.quantity)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Tổng kết */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <Typography variant="body1" className="font-semibold">
                            Tổng tiền hàng:
                        </Typography>
                        <Typography variant="body1" className="font-bold text-lg">
                            {formatCurrency(totalAmount)}
                        </Typography>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                        <Typography variant="body1" className="font-semibold">
                            Số tiền đã trả:
                        </Typography>
                        <Typography variant="body1" className="font-semibold text-blue-600">
                            {formatCurrency(paidAmount)}
                        </Typography>
                    </div>
                    
                    <Divider className="my-2" />
                    
                    <div className="flex justify-between items-center">
                        <Typography variant="body1" className="font-semibold">
                            Còn lại:
                        </Typography>
                        <Typography 
                            variant="body1" 
                            className={`font-bold text-lg ${
                                totalAmount - paidAmount > 0 ? 'text-red-600' : 'text-green-600'
                            }`}
                        >
                            {formatCurrency(totalAmount - paidAmount)}
                        </Typography>
                    </div>
                </div>

                {/* Ghi chú */}
                {note && (
                    <div className="mt-4">
                        <Typography variant="subtitle2" className="font-semibold mb-1 text-gray-700">
                            📝 Ghi chú:
                        </Typography>
                        <Typography variant="body2" className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                            {note}
                        </Typography>
                    </div>
                )}
            </DialogContent>

            <DialogActions className="p-4 bg-gray-50">
                <Button 
                    onClick={onClose} 
                    variant="outlined" 
                    startIcon={<FaTimes />}
                    disabled={loading}
                >
                    Hủy bỏ
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    className={`${
                        status === 'DRAFT' 
                            ? '!bg-blue-600 hover:!bg-blue-700' 
                            : '!bg-green-600 hover:!bg-green-700'
                    } text-white`}
                    startIcon={loading ? null : (status === 'DRAFT' ? <FaPrint /> : <FaCheck />)}
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : (status === 'DRAFT' ? 'Lưu tạm' : 'Hoàn thành')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SaleSummaryDialog; 