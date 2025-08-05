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
    Tooltip,
} from '@mui/material';
import { FaPrint, FaCheck, FaTimes } from 'react-icons/fa';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';

const ImportSummaryDialog = ({
    open,
    onClose,
    onConfirm,
    importData,
    formatCurrency,
    loading,
    currentUser,
    supplierDetails,
    storeDetails
}) => {
    if (!importData) return null;

    const { supplier, store, products, totalAmount, paidAmount, note, importDate, status } = importData;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle className="flex justify-between items-center bg-gray-50">
                <div>
                    <Typography variant="h6" className="font-bold text-gray-800">
                        {`PHIẾU NHẬP HÀNG${importData.importCode ? `: ${importData.importCode}` : ''}`}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        {status === 'DRAFT' ? '📝 Phiếu tạm thời' : status === 'WAITING_FOR_APPROVE' ? '⏳ Chờ duyệt' : '✅ Phiếu hoàn thành'}
                    </Typography>
                </div>
                <div className="text-right">
                    <Typography variant="body2" className="text-gray-600">
                        Ngày: {importDate ? new Date(importDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Giờ: {new Date().toLocaleTimeString('vi-VN')}
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
                            <strong>Tên cửa hàng:</strong> {store?.storeName || store?.name || storeDetails?.storeName || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Địa chỉ:</strong> {store?.storeAddress || store?.address || storeDetails?.storeAddress || storeDetails?.address || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Người tạo:</strong> {currentUser?.fullName || currentUser?.name || 'Chưa có'}
                        </Typography>
                    </div>
                    <div>
                        <Typography variant="subtitle1" className="font-semibold mb-2 text-green-600 flex items-center">
                            <PersonIcon fontSize="small" className="mr-1" />
                            THÔNG TIN NHÀ CUNG CẤP
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Tên nhà cung cấp:</strong> {supplier?.name || supplierDetails?.name || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Số điện thoại:</strong> {supplier?.phone || supplierDetails?.phone || 'Chưa có'}
                        </Typography>
                        <Typography variant="body2" className="mb-1">
                            <strong>Địa chỉ:</strong> {supplier?.address || supplierDetails?.address || 'Chưa có'}
                        </Typography>
                    </div>
                </div>

                <Divider className="my-4" />

                {/* Bảng sản phẩm */}
                <Typography variant="subtitle1" className="font-semibold mb-3 text-gray-800">
                    📦 DANH SÁCH SẢN PHẨM
                </Typography>
                
                <TableContainer component={Paper} className="mb-4">
                    <Table size="small" sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow className="bg-gray-100">
                                <TableCell className="font-semibold" sx={{ whiteSpace: 'nowrap' }}>STT</TableCell>
                                <TableCell className="font-semibold" sx={{ whiteSpace: 'nowrap' }}>Tên sản phẩm</TableCell>
                                <TableCell className="font-semibold text-center" sx={{ whiteSpace: 'nowrap' }}>ĐVT</TableCell>
                                <TableCell className="font-semibold text-center" sx={{ whiteSpace: 'nowrap' }}>Số lượng</TableCell>
                                <TableCell className="font-semibold text-right" sx={{ whiteSpace: 'nowrap' }}>Đơn giá</TableCell>
                                <TableCell className="font-semibold text-right" sx={{ whiteSpace: 'nowrap' }}>Giá bán</TableCell>
                                <TableCell className="font-semibold text-center" sx={{ whiteSpace: 'nowrap' }}>Vị trí</TableCell>
                                <TableCell className="font-semibold text-center" sx={{ whiteSpace: 'nowrap' }}>Ngày hết hạn</TableCell>
                                <TableCell className="font-semibold text-right" sx={{ whiteSpace: 'nowrap' }}>Thành tiền</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products && products.length > 0 ? products.map((product, index) => {
                                const selectedZoneIds = Array.isArray(product.zoneIds) ? product.zoneIds : [];
                                const zones = importData.zones || [];
                                
                                return (
                                    <TableRow key={product.id || index} className="hover:bg-gray-50">
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            <div>
                                                <div className="font-medium">{product.name || product.productName || 'Chưa có'}</div>
                                                <div className="text-xs text-gray-500">
                                                    Mã: {product.code || product.productCode || 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center" sx={{ whiteSpace: 'nowrap' }}>{product.unit || 'quả'}</TableCell>
                                        <TableCell className="text-center" sx={{ whiteSpace: 'nowrap' }}>{product.quantity || product.importQuantity || 0}</TableCell>
                                        <TableCell className="text-right" sx={{ whiteSpace: 'nowrap' }}>{formatCurrency(product.price || product.unitImportPrice || 0)}</TableCell>
                                        <TableCell className="text-right" sx={{ whiteSpace: 'nowrap' }}>{formatCurrency(product.salePrice || product.unitSalePrice || 0)}</TableCell>
                                        <TableCell className="text-center" sx={{ whiteSpace: 'nowrap' }}>
                                            {selectedZoneIds.length > 0 ? (
                                                <Tooltip title={selectedZoneIds.map(zoneId => {
                                                    const zone = zones.find(z => z.id === zoneId);
                                                    return zone ? (zone.name || zone.zoneName) : '';
                                                }).filter(name => name).join(', ')}>
                                                    <div className="flex gap-1 justify-center" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                        {selectedZoneIds.slice(0, 2).map((zoneId) => {
                                                            const zone = zones.find(z => z.id === zoneId);
                                                            return zone ? (
                                                                <span
                                                                    key={zoneId}
                                                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex-shrink-0"
                                                                >
                                                                    {zone.name || zone.zoneName}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                        {selectedZoneIds.length > 2 && (
                                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
                                                                +{selectedZoneIds.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Chưa chọn</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center" sx={{ whiteSpace: 'nowrap' }}>
                                            {product.expireDate ? (
                                                <span className="text-sm">
                                                    {new Date(product.expireDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Chưa có</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold" sx={{ whiteSpace: 'nowrap' }}>
                                            {formatCurrency((product.price || product.unitImportPrice || 0) * (product.quantity || product.importQuantity || 0))}
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
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
                    {loading ? 'Đang xử lý...' : (status === 'DRAFT' ? 'Lưu tạm' : (status === 'WAITING_FOR_APPROVE' ? 'Chờ duyệt' : 'Hoàn thành'))}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImportSummaryDialog; 