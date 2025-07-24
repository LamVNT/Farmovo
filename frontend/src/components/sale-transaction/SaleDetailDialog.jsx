import React, { useState } from 'react';
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
    Chip,
} from '@mui/material';
import { FaTimes, FaFileExport } from 'react-icons/fa';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import TableChartIcon from '@mui/icons-material/TableChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SaleDetailDialog = ({
    open,
    onClose,
    transaction,
    formatCurrency,
    onExport,
    userDetails,
    customerDetails,
    onCancel,
    onComplete,
    onExportPdf
}) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState(null); // 'complete' | 'cancel'
    const handleConfirm = () => {
        setConfirmOpen(false);
        if (confirmType === 'complete') onComplete && onComplete();
        if (confirmType === 'cancel') onCancel && onCancel();
    };
    if (!transaction) return null;

    const { customerName, storeName, saleDate, status, totalAmount, paidAmount, saleTransactionNote, detail } = transaction;

    // Parse detail if it's a string
    const products = typeof detail === 'string' ? JSON.parse(detail || '[]') : (detail || []);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="flex justify-between items-center bg-gray-50">
                <div>
                    <Typography variant="h6" className="font-bold text-gray-800">
                        CHI TIẾT PHIẾU BÁN HÀNG{transaction.name ? `: ${transaction.name}` : ''}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        {status === 'DRAFT' ? '📝 Phiếu tạm thời' : '✅ Phiếu hoàn thành'}
                    </Typography>
                </div>
                <div className="text-right">
                    <Typography variant="body2" className="text-gray-600">
                        Ngày: {saleDate ? new Date(saleDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Giờ: {saleDate ? new Date(saleDate).toLocaleTimeString('vi-VN') : 'N/A'}
                    </Typography>
                </div>
            </DialogTitle>

            <DialogContent className="p-6">
                {/* Thông tin khách hàng và cửa hàng */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <Typography variant="subtitle1" className="font-semibold mb-2 text-blue-600 flex items-center">
                            <StorefrontIcon fontSize="small" className="mr-1" />
                            THÔNG TIN CỬA HÀNG
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Tên cửa hàng:</strong> {storeName || transaction.storeName || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Địa chỉ:</strong> {transaction.storeAddress || transaction.store?.storeAddress || transaction.store?.address || userDetails?.storeAddress || userDetails?.address || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Người tạo:</strong> {userDetails?.fullName || userDetails?.name || 'Chưa có'}
                        </Typography>
                    </div>
                    <div>
                        <Typography variant="subtitle1" className="font-semibold mb-2 text-green-600 flex items-center">
                            <PersonIcon fontSize="small" className="mr-1" />
                            THÔNG TIN KHÁCH HÀNG
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Tên khách hàng:</strong> {customerDetails?.name || customerName || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Số điện thoại:</strong> {transaction.customerPhone || customerDetails?.phone || customerDetails?.customerPhone || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Địa chỉ:</strong> {transaction.customerAddress || customerDetails?.address || customerDetails?.customerAddress || 'Chưa có'}
                        </Typography>
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
                                <TableRow key={product.id || index} className="hover:bg-gray-50">
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{product.productName || product.name}</div>
                                            <div className="text-xs text-gray-500">
                                                Mã: {product.code || product.productCode || 'N/A'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">quả</TableCell>
                                    <TableCell className="text-center">{product.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(product.unitSalePrice || product.price)}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency((product.unitSalePrice || product.price) * product.quantity)}
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
                {saleTransactionNote && (
                    <div className="mt-4">
                        <Typography variant="subtitle2" className="font-semibold mb-1 text-gray-700">
                            📝 Ghi chú:
                        </Typography>
                        <Typography variant="body2" className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                            {saleTransactionNote}
                        </Typography>
                    </div>
                )}
            </DialogContent>

            <DialogActions className="p-4 bg-gray-50">
                <Button 
                    onClick={onExport} 
                    variant="outlined" 
                    startIcon={<TableChartIcon />}
                    color="secondary"
                    sx={{ ml: 0 }}
                >
                    Xuất chi tiết
                </Button>
                {onExportPdf && (
                    <Button
                        onClick={onExportPdf}
                        variant="outlined"
                        startIcon={<FaFileExport />}
                        color="primary"
                        sx={{ ml: 1 }}
                    >
                        Xuất PDF
                    </Button>
                )}
                {status !== 'COMPLETE' && status !== 'CANCEL' && (
                    <Button
                        onClick={() => {
                            setConfirmType('complete');
                            setConfirmOpen(true);
                        }}
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        sx={{ ml: 1 }}
                    >
                        Hoàn thành
                    </Button>
                )}
                <Button
                    onClick={() => {
                        setConfirmType('cancel');
                        setConfirmOpen(true);
                    }}
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    sx={{ ml: 1 }}
                    disabled={status === 'CANCEL'}
                >
                    Hủy phiếu
                </Button>
                <Button 
                    onClick={onClose} 
                    variant="contained" 
                    startIcon={<FaTimes />}
                    sx={{ ml: 1 }}
                >
                    Đóng
                </Button>
            </DialogActions>
            {/* Dialog xác nhận chuyên nghiệp */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle className="flex items-center gap-2">
                    {confirmType === 'complete' ? (
                        <CheckCircleIcon color="success" fontSize="large" />
                    ) : (
                        <CancelIcon color="error" fontSize="large" />
                    )}
                    {confirmType === 'complete' ? 'Xác nhận hoàn thành phiếu' : 'Xác nhận hủy phiếu'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {confirmType === 'complete'
                            ? 'Bạn có chắc chắn muốn hoàn thành phiếu bán hàng này? Sau khi hoàn thành, phiếu sẽ không thể chỉnh sửa.'
                            : 'Bạn có chắc chắn muốn hủy phiếu bán hàng này? Thao tác này không thể hoàn tác.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} color="inherit">Huỷ</Button>
                    <Button onClick={handleConfirm} color={confirmType === 'complete' ? 'success' : 'error'} variant="contained">
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default SaleDetailDialog; 