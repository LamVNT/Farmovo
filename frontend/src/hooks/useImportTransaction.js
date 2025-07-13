import { useState, useEffect, useCallback } from 'react';
import importTransactionService from '../services/importTransactionService';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { userService } from '../services/userService';
import { getCategories } from '../services/categoryService';
import { getZones } from '../services/zoneService';

export const useImportTransaction = () => {
    // States
    const [currentUser, setCurrentUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [zones, setZones] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form states
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [nextImportCode, setNextImportCode] = useState('');
    const [note, setNote] = useState('');
    const [paidAmount, setPaidAmount] = useState(0);

    // Dialog states
    const [showProductDialog, setShowProductDialog] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);

    // Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);

    // Column visibility state
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng': true,
        'Đơn giá': true,
        'Giá bán': true,
        'Zone': true,
        'Thành tiền': true,
    });

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                // Load current user
                const currentUserData = await userService.getCurrentUser();
                setCurrentUser(currentUserData);

                // Load products
                const productsData = await productService.getAllProducts();
                setProducts(productsData);

                // Load suppliers
                const suppliersData = await customerService.getSuppliers();
                setSuppliers(suppliersData);

                // Load categories
                const categoriesData = await getCategories();
                setCategories(categoriesData);

                // Load zones
                const zonesData = await getZones();
                setZones(zonesData);

                // Get next import code
                const code = await importTransactionService.getNextCode();
                setNextImportCode(code);
            } catch (error) {
                console.error('Failed to load data:', error);
                setError('Không thể tải dữ liệu: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Update category products when products change
    useEffect(() => {
        if (selectedCategory) {
            const filteredProducts = products.filter(product => 
                product.categoryId === selectedCategory.id || product.category?.id === selectedCategory.id
            );
            setCategoryProducts(filteredProducts);
        }
    }, [products, selectedCategory]);

    // Update search results when products change
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            const results = products.filter(
                (p) =>
                    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(results);
        }
    }, [products, searchTerm]);

    // Refresh products after creating new one
    const refreshProducts = useCallback(async () => {
        try {
            const productsData = await productService.getAllProducts();
            setProducts(productsData);
        } catch (error) {
            console.error('Failed to refresh products:', error);
        }
    }, []);

    // Add new product to table
    const handleAddNewProduct = useCallback((newProduct) => {
        if (!selectedProducts.find((p) => p.id === newProduct.id)) {
            const price = 0;
            const quantity = 1;
            const total = price * quantity;
            const defaultExpireDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

            setSelectedProducts((prev) => [
                ...prev,
                {
                    id: newProduct.id,
                    name: newProduct.name || newProduct.productName,
                    unit: 'quả',
                    price,
                    quantity,
                    total,
                    productId: newProduct.id,
                    salePrice: 0,
                    zoneId: '',
                    expireDate: defaultExpireDate,
                },
            ]);
        }
    }, [selectedProducts]);

    // Product selection handlers
    const handleSelectProduct = useCallback((product) => {
        const existingProduct = selectedProducts.find(p => p.id === product.id);
        if (!existingProduct) {
            const price = 0;
            const quantity = 1;
            const total = price * quantity;
            const defaultExpireDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

            setSelectedProducts(prev => [
                ...prev,
                {
                    id: product.id,
                    name: product.name || product.productName,
                    unit: 'quả',
                    price,
                    quantity,
                    total,
                    productId: product.id,
                    salePrice: 0,
                    zoneId: '',
                    expireDate: defaultExpireDate,
                }
            ]);
        }
        setSearchTerm('');
        setFilteredProducts([]);
    }, [selectedProducts]);

    // Quantity handlers
    const handleQuantityChange = useCallback((id, delta) => {
        setSelectedProducts(prev => prev.map(product => {
            if (product.id === id) {
                const newQuantity = Math.max(1, (product.quantity || 1) + delta);
                const newTotal = newQuantity * (product.price || 0);
                return { ...product, quantity: newQuantity, total: newTotal };
            }
            return product;
        }));
    }, []);

    const handleQuantityInputChange = useCallback((id, newQuantity) => {
        setSelectedProducts(prev => prev.map(product => {
            if (product.id === id) {
                const quantity = Math.max(1, newQuantity);
                const total = quantity * (product.price || 0);
                return { ...product, quantity, total };
            }
            return product;
        }));
    }, []);

    // Price handlers
    const handlePriceChange = useCallback((id, newPrice) => {
        setSelectedProducts(prev => prev.map(product => {
            if (product.id === id) {
                const price = Math.max(0, newPrice);
                const total = (product.quantity || 1) * price;
                return { ...product, price, total };
            }
            return product;
        }));
    }, []);

    const handleSalePriceChange = useCallback((id, newSalePrice) => {
        setSelectedProducts(prev => prev.map(product => {
            if (product.id === id) {
                return { ...product, salePrice: Math.max(0, newSalePrice) };
            }
            return product;
        }));
    }, []);

    // Delete product
    const handleDeleteProduct = useCallback((id) => {
        setSelectedProducts(prev => prev.filter(product => product.id !== id));
    }, []);

    // Zone change handler
    const handleZoneChange = useCallback((id, zoneId) => {
        setSelectedProducts(prev => prev.map(product => {
            if (product.id === id) {
                return { ...product, zoneId };
            }
            return product;
        }));
    }, []);

    // Expire date change handler
    const handleExpireDateChange = useCallback((id, newDate) => {
        let formatted = '';
        if (newDate instanceof Date && !isNaN(newDate)) {
            formatted = newDate.toISOString().slice(0, 10);
        }
        
        setSelectedProducts(prev => prev.map(product => {
            if (product.id === id) {
                return { ...product, expireDate: formatted };
            }
            return product;
        }));
    }, []);

    // Category dialog handlers
    const handleOpenCategoryDialog = useCallback(() => {
        setShowCategoryDialog(true);
        setSelectedCategory(null);
        setCategoryProducts([]);
    }, []);

    const handleCloseCategoryDialog = useCallback(() => {
        setShowCategoryDialog(false);
        setSelectedCategory(null);
        setCategoryProducts([]);
    }, []);

    const handleSelectCategory = useCallback((category) => {
        setSelectedCategory(category);
        const filteredProducts = products.filter(product => 
            product.categoryId === category.id || product.category?.id === category.id
        );
        setCategoryProducts(filteredProducts);
    }, [products]);

    const handleSelectCategoryProduct = useCallback((product) => {
        handleSelectProduct(product);
    }, [handleSelectProduct]);

    // Search handler
    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') {
            setFilteredProducts([]);
        } else {
            const results = products.filter(
                (p) =>
                    p.name?.toLowerCase().includes(value.toLowerCase()) ||
                    p.code?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredProducts(results);
        }
    }, [products]);

    // Column visibility handler
    const toggleColumn = useCallback((col) => {
        setColumnVisibility((prev) => ({ ...prev, [col]: !prev[col] }));
    }, []);

    // Save draft
    const handleSaveDraft = useCallback(async () => {
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng thêm ít nhất một sản phẩm');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const totalAmount = selectedProducts.reduce((sum, product) => sum + (product.total || 0), 0);

            const importData = {
                supplierId: selectedSupplier,
                totalAmount: totalAmount,
                paidAmount: paidAmount,
                importTransactionNote: note,
                importDate: new Date().toISOString(),
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    expireDate: product.expireDate,
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: product.zoneId
                }))
            };

            await importTransactionService.createImportTransaction(importData);
            
            setSuccess('Lưu nháp thành công!');
            setSelectedProducts([]);
            setSelectedSupplier('');
            setNote('');
            setPaidAmount(0);
            
            // Refresh next code
            const code = await importTransactionService.getNextCode();
            setNextImportCode(code);
        } catch (error) {
            console.error('Failed to save draft:', error);
            setError('Lưu nháp thất bại: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [selectedSupplier, selectedProducts, paidAmount, note]);

    // Complete transaction
    const handleComplete = useCallback(async () => {
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng thêm ít nhất một sản phẩm');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const totalAmount = selectedProducts.reduce((sum, product) => sum + (product.total || 0), 0);

            const importData = {
                supplierId: selectedSupplier,
                totalAmount: totalAmount,
                paidAmount: paidAmount,
                importTransactionNote: note,
                importDate: new Date().toISOString(),
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    expireDate: product.expireDate,
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: product.zoneId
                }))
            };

            await importTransactionService.createImportTransaction(importData);
            
            setSuccess('Hoàn thành phiếu nhập thành công!');
            setSelectedProducts([]);
            setSelectedSupplier('');
            setNote('');
            setPaidAmount(0);
            
            // Refresh next code
            const code = await importTransactionService.getNextCode();
            setNextImportCode(code);
        } catch (error) {
            console.error('Failed to complete transaction:', error);
            setError('Hoàn thành phiếu nhập thất bại: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [selectedSupplier, selectedProducts, paidAmount, note]);

    // Utility functions
    const formatCurrency = useCallback((value) => {
        const number = Number(value);
        return !isNaN(number) ? number.toLocaleString('vi-VN') + ' VND' : '0 VND';
    }, []);

    const formatExpireDateForBackend = useCallback((dateStr) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return date.toISOString();
        } catch (error) {
            console.error('Invalid date format:', dateStr);
            return null;
        }
    }, []);

    const isValidValue = useCallback((value, options) => {
        return options.some(opt => String(opt.id) === String(value));
    }, []);

    return {
        // States
        currentUser,
        products,
        suppliers,
        categories,
        zones,
        selectedProducts,
        loading,
        error,
        success,
        
        // Form states
        selectedSupplier,
        nextImportCode,
        note,
        paidAmount,
        
        // Dialog states
        showProductDialog,
        showCategoryDialog,
        selectedCategory,
        categoryProducts,
        
        // Search states
        searchTerm,
        filteredProducts,
        
        // Column visibility
        columnVisibility,
        
        // Setters
        setSelectedSupplier,
        setNote,
        setPaidAmount,
        setShowProductDialog,
        setError,
        setSuccess,
        
        // Handlers
        refreshProducts,
        handleAddNewProduct,
        handleSelectProduct,
        handleQuantityChange,
        handleQuantityInputChange,
        handlePriceChange,
        handleSalePriceChange,
        handleDeleteProduct,
        handleZoneChange,
        handleExpireDateChange,
        handleOpenCategoryDialog,
        handleCloseCategoryDialog,
        handleSelectCategory,
        handleSelectCategoryProduct,
        handleSearchChange,
        toggleColumn,
        handleSaveDraft,
        handleComplete,
        
        // Utility functions
        formatCurrency,
        formatExpireDateForBackend,
        isValidValue,
    };
}; 