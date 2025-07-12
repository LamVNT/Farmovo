import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
} from '@mui/material';

const ImportCategoryDialog = ({
    open,
    onClose,
    categories,
    selectedCategory,
    categoryProducts,
    onSelectCategory,
    onSelectProduct,
    formatCurrency,
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="flex justify-between items-center">
                <span>Thêm từ danh mục</span>
                <IconButton onClick={onClose} size="small">
                    <span>×</span>
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Danh sách Category */}
                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">Danh mục sản phẩm</h3>
                        <div className="border rounded-lg max-h-80 overflow-y-auto">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    onClick={() => onSelectCategory(category)}
                                    className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${
                                        selectedCategory?.id === category.id ? 'bg-blue-50 border-blue-200' : ''
                                    }`}
                                >
                                    <div className="font-medium">{category.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {categoryProducts.filter(p => p.categoryId === category.id || p.category?.id === category.id).length} sản phẩm
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Danh sách sản phẩm theo category */}
                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">
                            {selectedCategory ? `Sản phẩm - ${selectedCategory.name}` : 'Chọn danh mục để xem sản phẩm'}
                        </h3>
                        <div className="border rounded-lg max-h-80 overflow-y-auto">
                            {selectedCategory ? (
                                categoryProducts.length > 0 ? (
                                    categoryProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => onSelectProduct(product)}
                                            className="p-3 cursor-pointer border-b hover:bg-gray-50"
                                        >
                                            <div className="font-medium">{product.productName}</div>
                                            <div className="text-sm text-gray-500">
                                                Mã: {product.productCode} | Tồn: {product.remainQuantity} | Giá: {formatCurrency(product.unitSalePrice)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">
                                        Không có sản phẩm nào trong danh mục này
                                    </div>
                                )
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    Vui lòng chọn một danh mục
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImportCategoryDialog; 