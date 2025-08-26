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
    Chip,
    CircularProgress,
} from '@mui/material';
// Không cần import FaFileExport nữa vì đã dùng Material-UI icons
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import TableChartIcon from '@mui/icons-material/TableChart';
import { exportImportTransactionPdf } from '../../utils/pdfExport';

const ImportDetailDialog = ({
    open,
    onClose,
    transaction,
    details,
    formatCurrency,
    supplierDetails,
    userDetails,
    storeDetails,
    onExport,
    onOpenTransaction, // Thêm prop mới
    onCloseTransaction, // Thay đổi tên prop
    onCancelTransaction, // Thêm prop mới
    onCompleteTransaction, // Thêm prop mới cho hoàn thành
    loading = false, // Thêm prop loading
    zones = [], // Thêm zones data
    onExportPdf, // Thêm prop mới
    isStaff = false, // Thêm prop để kiểm tra role STAFF
}) => {
    if (!transaction) return null;

    const statusMap = {
        'DRAFT': { label: '📝 Phiếu tạm thời', color: '#6b7280' },
        'WAITING_FOR_APPROVE': { label: '⏳ Chờ duyệt', color: '#f59e0b' },
        'COMPLETE': { label: '✅ Phiếu hoàn thành', color: '#10b981' },
        'CANCEL': { label: '❌ Đã huỷ', color: '#ef4444' },
    };
    const status = statusMap[transaction.status] || { label: transaction.status, color: '#6b7280' };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle className="flex justify-between items-center bg-gray-50">
                <div>
                    <Typography variant="h6" className="font-bold text-gray-800">
                        {`CHI TIẾT PHIẾU NHẬP HÀNG${transaction.name ? `: ${transaction.name}` : ''}`}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        {status.label}
                    </Typography>
                </div>
                <div className="text-right">
                    <Typography variant="body2" className="text-gray-600">
                        Ngày: {transaction.importDate ? new Date(transaction.importDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Giờ: {transaction.importDate ? new Date(transaction.importDate).toLocaleTimeString('vi-VN') : 'N/A'}
                    </Typography>
                </div>
            </DialogTitle>
            <DialogContent className="p-6">
                {/* Thông tin cửa hàng và nhà cung cấp */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <Typography variant="subtitle1" className="font-semibold mb-2 text-blue-600 flex items-center">
                            <StorefrontIcon fontSize="small" className="mr-1" />
                            THÔNG TIN CỬA HÀNG
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Tên cửa hàng:</strong> {storeDetails?.name || transaction.storeName || storeDetails?.storeName || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Địa chỉ:</strong> {transaction.storeAddress || storeDetails?.storeAddress || storeDetails?.address || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Người tạo:</strong> {userDetails?.fullName || userDetails?.name || userDetails?.username || transaction.createdBy || 'Chưa có'}
                        </Typography>
                    </div>
                    <div>
                        <Typography variant="subtitle1" className="font-semibold mb-2 text-green-600 flex items-center">
                            <PersonIcon fontSize="small" className="mr-1" />
                            THÔNG TIN NHÀ CUNG CẤP
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Tên nhà cung cấp:</strong> {supplierDetails?.name || transaction.supplierName || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Số điện thoại:</strong> {supplierDetails?.phone || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Địa chỉ:</strong> {supplierDetails?.address || 'Chưa có'}
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
                                <TableCell className="font-semibold text-center">SL nhập</TableCell>
                                <TableCell className="font-semibold text-right">Giá nhập</TableCell>
                                <TableCell className="font-semibold text-right">Giá bán</TableCell>
                                <TableCell className="font-semibold text-right">Thành tiền</TableCell>
                                <TableCell className="font-semibold text-center">HSD</TableCell>
                                <TableCell className="font-semibold text-center">Khu vực</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {details && details.length > 0 ? details.map((detail, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell style={{ width: '150px', minWidth: '150px' }}>
                                        <div>
                                            <div className="font-medium">{detail.productName || 'Chưa có'}</div>
                                            <div className="text-xs text-gray-500">
                                                Mã: {detail.productCode || 'N/A'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{detail.unit || 'quả'}</TableCell>
                                    <TableCell className="text-center">{detail.importQuantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(detail.unitImportPrice)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(detail.unitSalePrice)}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency((detail.unitImportPrice || 0) * (detail.importQuantity || 0))}
                                    </TableCell>
                                    <TableCell className="text-center">{detail.expireDate ? new Date(detail.expireDate).toLocaleDateString('vi-VN') : ''}</TableCell>
                                    <TableCell className="text-center">
                                        {(() => {
                                            if (!detail.zones_id || !Array.isArray(detail.zones_id)) return '';
                                            const zoneNames = detail.zones_id.map(zoneId => {
                                                const zone = zones.find(z => z.id === Number(zoneId) || z.id === zoneId);
                                                return zone ? (zone.name || zone.zoneName) : zoneId;
                                            });
                                            return zoneNames.join(', ');
                                        })()}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">Không có sản phẩm</TableCell>
                                </TableRow>
                            )}
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
                            {formatCurrency(transaction.totalAmount)}
                        </Typography>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <Typography variant="body1" className="font-semibold">
                            Số tiền đã trả:
                        </Typography>
                        <Typography variant="body1" className="font-semibold text-blue-600">
                            {formatCurrency(transaction.paidAmount)}
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
                                transaction.totalAmount - transaction.paidAmount > 0 ? 'text-red-600' : 'text-green-600'
                            }`}
                        >
                            {formatCurrency(transaction.totalAmount - transaction.paidAmount)}
                        </Typography>
                    </div>
                </div>

                {/* Ghi chú */}
                {transaction.importTransactionNote && (
                    <div className="mt-4">
                        <Typography variant="subtitle2" className="font-semibold mb-1 text-gray-700">
                            📝 Ghi chú:
                        </Typography>
                        <Typography variant="body2" className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                            {transaction.importTransactionNote}
                        </Typography>
                    </div>
                )}
            </DialogContent>
            <DialogActions className="p-4 bg-gray-50">
                {transaction.status === 'DRAFT' && onOpenTransaction && (
                    <Button 
                        variant="contained"
                        color="primary"
                        onClick={onOpenTransaction}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOpenIcon />}
                    >
                        {loading ? 'Đang xử lý...' : 'Mở phiếu'}
                    </Button>
                )}
                {/* Hiển thị nút "Đóng phiếu" chỉ khi trạng thái là WAITING_FOR_APPROVE và không phải STAFF */}
                {transaction.status === 'WAITING_FOR_APPROVE' && onCloseTransaction && !isStaff && (
                    <Button 
                        variant="contained"
                        color="secondary"
                        onClick={onCloseTransaction}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    >
                        {loading ? 'Đang xử lý...' : 'Đóng phiếu'}
                    </Button>
                )}
                {(transaction.status === 'DRAFT' || transaction.status === 'WAITING_FOR_APPROVE') && onCancelTransaction && (
                    <Button 
                        variant="contained"
                        color="error"
                        onClick={onCancelTransaction}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
                    >
                        {loading ? 'Đang xử lý...' : 'Hủy phiếu'}
                    </Button>
                )}
                {/* Hiển thị nút "Hoàn thành" chỉ khi trạng thái là WAITING_FOR_APPROVE và không phải STAFF */}
                {transaction.status === 'WAITING_FOR_APPROVE' && onCompleteTransaction && !isStaff && (
                    <Button 
                        variant="contained"
                        color="success"
                        onClick={onCompleteTransaction}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                    >
                        {loading ? 'Đang xử lý...' : 'Hoàn thành'}
                    </Button>
                )}
                <Button 
                    variant="outlined"
                    color="success"
                    onClick={onExportPdf}
                    startIcon={<PictureAsPdfIcon />}
                >
                    Xuất PDF
                </Button>
                <Button 
                    onClick={onExport} 
                    variant="outlined" 
                    color="success"
                    startIcon={<TableChartIcon />}
                >
                    Xuất Excel
                </Button>
                <Button 
                    onClick={onClose} 
                    variant="outlined" 
                    color="inherit"
                    startIcon={<CloseIcon />}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImportDetailDialog; 