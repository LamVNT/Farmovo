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
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [uniqueProducts, setUniqueProducts] = useState([]);
    const [localAvailableBatches, setLocalAvailableBatches] = useState([]); // State local để lưu availableBatches

    // Khởi tạo selectedBatches với id duy nhất
    useEffect(() => {
        if (selectedBatchesForDialog && selectedBatchesForDialog.length > 0) {
            const uniqueBatches = selectedBatchesForDialog.map((batch, idx) => ({
                ...batch,
                id: Date.now() + Math.random() + idx, // Đảm bảo id duy nhất
                batchId: batch.batchId || batch.id || batch.proId
            }));
            setSelectedBatches(uniqueBatches);
        }
    }, [selectedBatchesForDialog]);

    // Xử lý dữ liệu sản phẩm để loại bỏ trùng lặp và tính toán số lô hàng
    useEffect(() => {
        if (products && products.length > 0) {
            // Tạo Map để loại bỏ sản phẩm trùng lặp dựa trên proId
            const productMap = new Map();
            
            products.forEach((product, index) => {
                const key = product.proId || product.id;
                if (key && !productMap.has(key)) {
                    // Đếm số lượng batch có sẵn cho sản phẩm này từ dữ liệu products
                    // Mỗi item trong products thực ra là một batch của sản phẩm
                    // Cần đếm số lượng batch có sẵn, không phải số lượng sản phẩm
                    
                    // Tìm tất cả batch có cùng proId và có mã lô hàng
                    const matchingBatches = products.filter(p => {
                        const sameProduct = (p.proId === key || p.id === key);
                        const hasBatchCode = p.name || p.batchCode;
                        const hasQuantity = p.remainQuantity > 0;
                        
                        return sameProduct && hasBatchCode && hasQuantity;
                    });
                    
                    const batchCount = matchingBatches.length;
                    
                    // Thêm index để tạo uniqueKey duy nhất
                    productMap.set(key, {
                        ...product,
                        uniqueKey: `${key}_${index}`,
                        displayIndex: index,
                        batchCount: batchCount
                    });
                }
            });
            
            const uniqueProductsArray = Array.from(productMap.values());
            setUniqueProducts(uniqueProductsArray);
            setFilteredProducts(uniqueProductsArray);
        } else {
            setUniqueProducts([]);
            setFilteredProducts([]);
        }
    }, [products]); // Chỉ phụ thuộc vào products, không phụ thuộc vào availableBatches

    // Khởi tạo localAvailableBatches khi products thay đổi hoặc khi selectedProduct thay đổi
    useEffect(() => {
        if (products && products.length > 0 && selectedProduct) {
            const productBatches = products.filter(batch => 
                (batch.proId === selectedProduct.proId || batch.id === selectedProduct.proId) && 
                batch.remainQuantity > 0 &&
                (batch.name || batch.batchCode)
            );
            setLocalAvailableBatches(productBatches);
        } else {
            setLocalAvailableBatches([]);
        }
    }, [products, selectedProduct]);

    useEffect(() => {
        if (productSearch.trim() === '') {
            setFilteredProducts(uniqueProducts);
        } else {
            setFilteredProducts(uniqueProducts.filter(p =>
                p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
                (p.productCode && p.productCode.toLowerCase().includes(productSearch.toLowerCase()))
            ));
        }
    }, [productSearch, uniqueProducts]);

    const handleBatchSelection = (batch) => {
        // Sử dụng batch.id gốc để kiểm tra selection
        const originalBatchId = batch.id || batch.batchId || batch.proId;
        
        // Tạo id duy nhất cho selectedBatches để tránh trùng lặp
        const uniqueId = Date.now() + Math.random() + Math.floor(Math.random() * 1000);
        
        const isSelected = selectedBatches.some(b => b.batchId === originalBatchId);
        if (isSelected) {
            setSelectedBatches(prev => prev.filter(b => b.batchId !== originalBatchId));
        } else {
            setSelectedBatches(prev => [...prev, { 
                id: uniqueId, 
                batchId: originalBatchId, 
                batch, 
                quantity: 1,
                proId: batch.proId || batch.productId || selectedProduct?.proId || selectedProduct?.id // Đảm bảo proId luôn có giá trị
            }]);
        }
    };

    const handleQuantityChange = (batchId, quantity) => {
        // Đảm bảo batchId là số hợp lệ
        const validBatchId = (/^\d+$/.test(String(batchId))) ? Number(batchId) : batchId;
        
        setSelectedBatches(prev => 
            prev.map(b => b.batchId === validBatchId ? { ...b, quantity } : b)
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

    // Cập nhật localAvailableBatches khi chọn sản phẩm
    const handleProductSelection = (product) => {
        // Lọc batch từ products array cho sản phẩm đã chọn
        const productBatches = products.filter(batch => 
            (batch.proId === product.proId || batch.id === product.proId) && 
            batch.remainQuantity > 0 &&
            (batch.name || batch.batchCode)
        );
        
        // Cập nhật localAvailableBatches
        setLocalAvailableBatches(productBatches);
        
        // Gọi callback gốc để cập nhật selectedProduct
        onSelectProduct(product);
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
                            {filteredProducts.length > 0 ? filteredProducts.map((product, idx) => {
                                // Sử dụng batchCount đã được tính toán sẵn
                                const batchCount = product.batchCount || 0;
                                
                                return (
                                    <div
                                        key={product.uniqueKey}
                                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all font-medium ${selectedProduct?.proId === product.proId ? 'bg-blue-50 border-blue-400' : ''} ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === filteredProducts.length-1 ? 'rounded-b-xl' : ''}`}
                                        style={{ borderBottom: idx === filteredProducts.length-1 ? 'none' : '1px solid #f1f1f1' }}
                                        onClick={() => handleProductSelection(product)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{product.productName}</span>
                                            <span className="text-gray-500 text-xs mt-1">Mã: {product.productCode}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            {batchCount > 0 ? (
                                                <span className="text-blue-600 text-xs bg-blue-100 px-3 py-1 rounded-full font-medium">
                                                    {batchCount} lô
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs bg-gray-100 px-3 py-1 rounded-full">
                                                    0 lô
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-4 text-center text-gray-500">Không có sản phẩm nào</div>
                            )}
                        </div>
                    </div>
                    <div className="font-bold text-blue-700 ml-1">Lô hàng</div>
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
                        Debug: Selected product: {selectedProduct?.productName || 'None'} (proId: {selectedProduct?.proId || 'None'}), 
                        Local available batches: {localAvailableBatches?.length || 0}
                    </div>
                    {/* Phần dưới: Danh sách batch của sản phẩm đã chọn */}
                    <div className="border border-gray-200 rounded-xl p-2 max-h-64 overflow-y-auto flex flex-col gap-3 bg-white">
                        {selectedProduct ? (
                            (() => {
                                // Sử dụng localAvailableBatches (luôn có dữ liệu từ products)
                                const productBatches = localAvailableBatches;
                                
                                return productBatches.length > 0 ? (
                                    <>
                                        {productBatches.map((batch, idx) => {
                                            // Sử dụng batch.id gốc để kiểm tra selection
                                            const originalBatchId = batch.id || batch.batchId || batch.proId;
                                            
                                            // Tạo uniqueKey duy nhất cho mỗi batch
                                            const uniqueKey = `${originalBatchId}_${batch.name || batch.batchCode || 'batch'}_${batch.remainQuantity || 0}_${batch.unitSalePrice || 0}_${batch.createAt || 'no-date'}_${idx}`;
                                            
                                            const isSelected = selectedBatches.some(b => b.batchId === originalBatchId);
                                            const selectedBatchData = selectedBatches.find(b => b.batchId === originalBatchId);
                                            const quantity = selectedBatchData ? selectedBatchData.quantity : 1;
                                            const isError = isSelected && (quantity < 1 || quantity > batch.remainQuantity);
                                            return (
                                                <div
                                                    key={uniqueKey}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition cursor-pointer
                                                        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                                                        ${isError ? 'border-red-500 bg-red-50' : ''}
                                                        ${idx === 0 ? 'mt-1' : ''}`}
                                                    style={{ minHeight: 56, borderBottom: idx === productBatches.length-1 ? 'none' : isSelected ? '2px solid #2563eb' : '1px solid #f1f1f1' }}
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
                                                                    handleQuantityChange(originalBatchId, val);
                                                                }
                                                            }}
                                                            inputProps={{ min: 1, max: batch.remainQuantity, style: { padding: 4, width: 60 } }}
                                                            variant="standard"
                                                            onFocus={(e) => {
                                                                if (quantity === 1 && e.target.value === '1') {
                                                                    e.target.value = '';
                                                                    handleQuantityChange(originalBatchId, '');
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
                                );
                            })()
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