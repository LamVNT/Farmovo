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
    nextCode,
    zones
}) => {
    if (!saleData) return null;

    const { customer, store, products, totalAmount, paidAmount, note, saleDate, status, name } = saleData;
    const confirmLabel = status === 'DRAFT' ? 'Lưu tạm' : 'Hoàn thành';

    const [currentTime, setCurrentTime] = React.useState(new Date());
    React.useEffect(() => {
        if (!open) return;
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, [open]);

    // Kiểm tra xem có cần hiển thị cột khu vực thực tế không
    const shouldShowZoneColumn = () => {
        // Hiển thị nếu là phiếu cân bằng kho
        if ((note || '').toLowerCase().includes('cân bằng kho')) {
            return true;
        }
        // Hiển thị nếu có ít nhất một sản phẩm có zoneReal hợp lệ
        return products.some(product => {
            const zoneReal = product.zoneReal;
            // Kiểm tra zoneReal có giá trị hợp lệ không
            if (!zoneReal) return false;
            if (Array.isArray(zoneReal) && zoneReal.length === 0) return false;
            if (typeof zoneReal === 'string' && zoneReal.trim() === '') return false;
            return true;
        });
    };

    const showZoneColumn = shouldShowZoneColumn();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="flex justify-between items-center bg-gray-50">
                <div className="flex flex-col items-start">
                    <Typography variant="h6" className="font-bold text-gray-800" style={{ display: 'inline', fontWeight: 700 }}>
                        {(note || '').toLowerCase().includes('cân bằng kho')
                            ? 'PHIẾU CÂN BẰNG: '
                            : 'PHIẾU BÁN HÀNG: '}
                        {name || nextCode || '---'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        {status === 'DRAFT' ? '📝 Phiếu tạm thời' : status === 'WAITING_FOR_APPROVE' ? '⏳ Chờ phê duyệt' : '✅ Phiếu hoàn thành'}
                    </Typography>
                </div>
                <div className="text-right">
                    <Typography variant="body2" className="text-gray-600">
                        Ngày bán: {saleDate ? new Date(saleDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Ngày tạo: {currentTime.toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Giờ tạo: {currentTime.toLocaleTimeString('vi-VN')}
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
                                <TableCell className="font-semibold text-right">
                                    <span>
                                        Đơn giá<span style={{ color: '#6b7280', fontSize: '0.875em' }}>/quả</span>
                                    </span>
                                </TableCell>
                                {showZoneColumn && (
                                    <TableCell className="font-semibold text-center">Khu vực thực tế</TableCell>
                                )}
                                <TableCell className="font-semibold text-right">Thành tiền</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product, index) => (
                                <TableRow key={product.id} className="hover:bg-gray-50">
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{product.name || product.productName || product.batchName || 'Sản phẩm'}</div>
                                            <div className="text-xs text-gray-500">
                                                Mã: {product.productCode || product.code || product.batchCode || product.name || 'N/A'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{product.unit || 'quả'}</TableCell>
                                    <TableCell className="text-center">{product.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                                    {showZoneColumn && (
                                        <TableCell className="text-center">{
                                            (() => {
                                                const zr = product.zoneReal;
                                                const toName = (zid) => {
                                                    const z = zones?.find?.(zz => String(zz.id) === String(zid));
                                                    return z ? z.zoneName : zid;
                                                };
                                                if (Array.isArray(zr)) return zr.map(toName).join(', ');
                                                if (typeof zr === 'string' && zr.includes(',')) return zr.split(',').map(s => s.trim()).map(toName).join(', ');
                                                return zr ? toName(zr) : '';
                                            })()
                                        }</TableCell>
                                    )}
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
                            className={`font-bold text-lg ${totalAmount - paidAmount > 0 ? 'text-red-600' : 'text-green-600'
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
                    className="!bg-blue-600 hover:!bg-blue-700 text-white"
                    startIcon={loading ? null : <FaCheck />}
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SaleSummaryDialog; 