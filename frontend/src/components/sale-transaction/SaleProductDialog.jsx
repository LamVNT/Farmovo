import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';

const SaleProductDialog = ({ 
    open, 
    onClose, 
    products, 
    selectedProduct, 
    availableBatches, 
    selectedBatchesForDialog,
    onSelectProduct,
    onSelectBatches,
    onAddProducts,
    formatCurrency 
}) => {
    const [selectedBatches, setSelectedBatches] = useState(selectedBatchesForDialog);
    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState(products);

    useEffect(() => {
        if (productSearch.trim() === '') {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p =>
                p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
                (p.productCode && p.productCode.toLowerCase().includes(productSearch.toLowerCase()))
            ));
        }
    }, [productSearch, products]);

    const handleBatchSelection = (batch) => {
        const isSelected = selectedBatches.some(b => b.batchId === batch.id);
        if (isSelected) {
            setSelectedBatches(prev => prev.filter(b => b.batchId !== batch.id));
        } else {
            setSelectedBatches(prev => [...prev, { id: `${batch.id}-${prev.length}`, batchId: batch.id, batch, quantity: 1 }]);
        }
    };

    const handleQuantityChange = (batchId, quantity) => {
        setSelectedBatches(prev => 
            prev.map(b => b.batchId === batchId ? { ...b, quantity } : b)
        );
    };

    const handleAdd = () => {
        onAddProducts(selectedBatches);
        setSelectedBatches([]);
        onClose();
    };

    const handleClose = () => {
        setSelectedBatches([]);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
            PaperProps={{
                className: 'rounded-xl shadow-lg',
                style: { border: '1px solid #e5e7eb', padding: 0 }
            }}
        >
            <DialogTitle className="flex justify-between items-center font-bold text-blue-800 text-lg border-b border-gray-200 rounded-t-xl bg-blue-50" style={{padding: '18px 24px'}}>
                <span>Thêm sản phẩm</span>
                <IconButton onClick={handleClose} size="small">
                    <span>×</span>
                </IconButton>
            </DialogTitle>
            <DialogContent style={{padding: 0}}>
                <div className="flex flex-col gap-4 p-6">
                    {/* Alert lỗi tổng nếu có batch sai */}
                    {selectedBatches.some(b => b.quantity < 1 || b.quantity > (b.batch?.remainQuantity || 0)) && (
                        <Alert severity="error" className="mb-2">Có lô hàng nhập sai số lượng! Số lượng phải từ 1 đến tồn kho.</Alert>
                    )}
                    {/* Phần trên: Danh sách sản phẩm với filter */}
                    <div className="mb-2">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Tìm sản phẩm theo tên hoặc mã"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            sx={{ mb: 2, background: '#f9fafb', borderRadius: 2 }}
                        />
                        <div className="font-bold text-blue-700 mb-2 ml-1">Sản phẩm</div>
                        <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto bg-white">
                            {filteredProducts.length > 0 ? filteredProducts.map((product, idx) => (
                                <div
                                    key={product.proId}
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all font-medium ${selectedProduct?.proId === product.proId ? 'bg-blue-50 border-blue-400' : ''} ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === filteredProducts.length-1 ? 'rounded-b-xl' : ''}`}
                                    style={{ borderBottom: idx === filteredProducts.length-1 ? 'none' : '1px solid #f1f1f1' }}
                                    onClick={() => onSelectProduct(product)}
                                >
                                    <span className="font-bold text-gray-900">{product.productName}</span>
                                    <span className="text-gray-500 text-xs ml-2">Mã: {product.productCode}</span>
                                </div>
                            )) : (
                                <div className="p-4 text-center text-gray-500">Không có sản phẩm nào</div>
                            )}
                        </div>
                    </div>
                    <div className="font-bold text-blue-700 ml-1">Lô hàng</div>
                    {/* Phần dưới: Danh sách batch của sản phẩm đã chọn */}
                    <div className="border border-gray-200 rounded-xl p-2 max-h-64 overflow-y-auto flex flex-col gap-3 bg-white">
                        {selectedProduct ? (
                            availableBatches.length > 0 ? (
                                <>
                                    {availableBatches.map((batch, idx) => {
                                        const isSelected = selectedBatches.some(b => b.batchId === batch.id);
                                        const selectedBatchData = selectedBatches.find(b => b.batchId === batch.id);
                                        const quantity = selectedBatchData ? selectedBatchData.quantity : 1;
                                        const isError = isSelected && (quantity < 1 || quantity > batch.remainQuantity);
                                        return (
                                            <div
                                                key={batch.id}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition cursor-pointer
                                                    ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                                                    ${isError ? 'border-red-500 bg-red-50' : ''}
                                                    ${idx === 0 ? 'mt-1' : ''}`}
                                                style={{ minHeight: 56, borderBottom: idx === availableBatches.length-1 ? 'none' : isSelected ? '2px solid #2563eb' : '1px solid #f1f1f1' }}
                                                onClick={() => handleBatchSelection(batch)}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-bold text-blue-800">Lô {batch.name}</div>
                                                    <div className="grid grid-cols-4 gap-1 text-xs text-gray-600 mt-1 w-full" style={{ alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                                                        <span className="col-span-1">Số lượng còn: <span className="font-bold text-gray-900">{batch.remainQuantity}</span></span>
                                                        <span className="col-span-1">Giá: <span className="font-bold text-green-700">{formatCurrency(batch.unitSalePrice)}</span></span>
                                                        <span className="col-span-1">Ngày nhập: <span className="font-bold text-indigo-700">{batch.createAt ? new Date(batch.createAt).toLocaleDateString('vi-VN') : 'N/A'}</span></span>
                                                        <span className="col-span-1">Hạn: <span className="font-bold text-red-700">{batch.expireDate ? new Date(batch.expireDate).toLocaleDateString('vi-VN') : 'N/A'}</span></span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end" style={{ minWidth: 80, position: 'relative' }}>
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={quantity}
                                                        error={isError}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            const val = parseInt(e.target.value) || 1;
                                                            if (isSelected) {
                                                                handleQuantityChange(batch.id, val);
                                                            }
                                                        }}
                                                        inputProps={{ min: 1, max: batch.remainQuantity, style: { padding: 4, width: 60 } }}
                                                        variant="standard"
                                                        onFocus={(e) => {
                                                            if (quantity === 1 && e.target.value === '1') {
                                                                e.target.value = '';
                                                                handleQuantityChange(batch.id, '');
                                                            }
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                    {isError && (
                                                        <span className="text-xs text-red-600 mt-1" style={{ whiteSpace: 'nowrap' }}>
                                                            Số lượng phải từ 1 đến {batch.remainQuantity}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="p-4 text-center text-gray-500">Không có batch nào cho sản phẩm này</div>
                            )
                        ) : (
                            <div className="p-4 text-center text-gray-500">Vui lòng chọn một sản phẩm</div>
                        )}
                    </div>
                </div>
            </DialogContent>
            <DialogActions className="px-6 pb-4">
                <Button onClick={handleClose} color="primary">
                    Đóng
                </Button>
                <Button
                    variant="contained"
                    disabled={selectedBatches.length === 0 || selectedBatches.some(b => b.quantity < 1 || b.quantity > (b.batch?.remainQuantity || 0))}
                    onClick={handleAdd}
                    sx={{
                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        boxShadow: '0 3px 15px rgba(76, 175, 80, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                            boxShadow: '0 5px 20px rgba(76, 175, 80, 0.4)',
                            transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                            background: '#ccc',
                            boxShadow: 'none',
                            transform: 'none'
                        },
                        fontWeight: 600,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        px: 3
                    }}
                >
                    Thêm ({selectedBatches.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SaleProductDialog; 