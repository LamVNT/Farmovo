import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
} from '@mui/material';

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
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle className="flex justify-between items-center">
                <span>Thêm sản phẩm</span>
                <IconButton onClick={handleClose} size="small">
                    <span>×</span>
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <div className="flex gap-6">
                    {/* Danh sách sản phẩm bên trái */}
                    <div className="w-1/2 border rounded-lg p-2 max-h-96 overflow-y-auto">
                        {products.map(product => (
                            <div
                                key={product.proId}
                                className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${selectedProduct?.proId === product.proId ? 'bg-blue-50 border-blue-200' : ''}`}
                                onClick={() => onSelectProduct(product)}
                            >
                                <div className="font-medium">{product.productName}</div>
                                <div className="text-sm text-gray-500">Mã: {product.productCode}</div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Danh sách batch bên phải */}
                    <div className="w-1/2 border rounded-lg p-2 max-h-96 overflow-y-auto flex flex-col gap-3">
                        {selectedProduct ? (
                            availableBatches.length > 0 ? (
                                <>
                                    {availableBatches.map(batch => {
                                        const isSelected = selectedBatches.some(b => b.batchId === batch.id);
                                        const selectedBatchData = selectedBatches.find(b => b.batchId === batch.id);
                                        const quantity = selectedBatchData ? selectedBatchData.quantity : 1;
                                        
                                        return (
                                            <div
                                                key={batch.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border shadow-sm transition hover:border-blue-400 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                                                style={{ minHeight: 64 }}
                                                onClick={() => handleBatchSelection(batch)}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800">Batch ID: {batch.id}</div>
                                                    <div className="text-xs text-gray-500">
                                                        📦 {batch.remainQuantity} | 💰 {formatCurrency(batch.unitSalePrice)}<br/>
                                                        📅 Ngày nhập: {batch.createAt ? new Date(batch.createAt).toLocaleDateString('vi-VN') : 'N/A'}
                                                    </div>
                                                </div>
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        const val = parseInt(e.target.value) || 1;
                                                        if (isSelected) {
                                                            handleQuantityChange(batch.id, val);
                                                        }
                                                    }}
                                                    inputProps={{ min: 1, max: batch.remainQuantity, style: { padding: 4, width: 60 } }}
                                                    variant="standard"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
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
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Đóng
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    className="!bg-blue-600 hover:!bg-blue-700"
                    disabled={selectedBatches.length === 0 || selectedBatches.some(b => b.quantity <= 0 || b.quantity > b.batch.remainQuantity)}
                    onClick={handleAdd}
                >
                    Thêm ({selectedBatches.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SaleProductDialog; 