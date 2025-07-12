import { useState, useEffect } from 'react';
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
    const [nextImportCode, setNextImportCode] = useState('');
    
    // Form states
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [note, setNote] = useState('');
    const [paidAmount, setPaidAmount] = useState(0);
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showProductDialog, setShowProductDialog] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    
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
                // Load current user
                const currentUserData = await userService.getCurrentUser();
                setCurrentUser(currentUserData);

                // Load products
                const productsData = await productService.getAllProducts();
                setProducts(productsData);

                // Load suppliers
                const suppliersData = await customerService.getAllCustomers();
                setSuppliers(suppliersData);

                // Load categories
                const categoriesData = await getCategories();
                setCategories(categoriesData);

                // Load zones
                const zonesData = await getZones();
                setZones(zonesData);

                // Load next import code
                const nextCode = await importTransactionService.getNextCode();
                setNextImportCode(nextCode);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Không thể tải dữ liệu');
            }
        };

        loadData();
    }, []);

    // Handle search
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') {
            setFilteredProducts([]);
        } else {
            const results = products.filter(
                (p) =>
                    p.productName?.toLowerCase().includes(value.toLowerCase()) ||
                    p.productCode?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredProducts(results);
        }
    };

    // Handle product selection from search
    const handleSelectProduct = (product) => {
        const existingProduct = selectedProducts.find(p => p.productId === product.id);
        if (existingProduct) {
            setSelectedProducts(prev => 
                prev.map(p => 
                    p.productId === product.id 
                        ? { ...p, quantity: (p.quantity || 1) + 1 }
                        : p
                )
            );
        } else {
            const newProduct = {
                id: Date.now(),
                productId: product.id,
                productName: product.productName || product.name,
                quantity: 1,
                unitImportPrice: 0,
                unitSalePrice: 0,
                remainQuantity: product.remainQuantity || 0,
                zones_id: '',
                expireDate: null,
            };
            setSelectedProducts(prev => [...prev, newProduct]);
        }
        setSearchTerm('');
        setFilteredProducts([]);
    };

    // Handle category selection
    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        const filteredProducts = products.filter(product => 
            product.categoryId === category.id || product.category?.id === category.id
        );
        setCategoryProducts(filteredProducts);
    };

    const handleSelectCategoryProduct = (product) => {
        handleSelectProduct(product);
    };

    // Handle quantity change
    const handleQuantityChange = (productId, change) => {
        setSelectedProducts(prev => 
            prev.map(p => {
                if (p.id === productId) {
                    const newQuantity = Math.max(1, (p.quantity || 1) + change);
                    return { ...p, quantity: newQuantity };
                }
                return p;
            })
        );
    };

    const handleQuantityInputChange = (productId, quantity) => {
        setSelectedProducts(prev => 
            prev.map(p => p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p)
        );
    };

    // Handle price change
    const handleImportPriceChange = (productId, price) => {
        setSelectedProducts(prev => 
            prev.map(p => p.id === productId ? { ...p, unitImportPrice: Math.max(0, price) } : p)
        );
    };

    const handleSalePriceChange = (productId, price) => {
        setSelectedProducts(prev => 
            prev.map(p => p.id === productId ? { ...p, unitSalePrice: Math.max(0, price) } : p)
        );
    };

    // Handle zone change
    const handleZoneChange = (productId, zoneId) => {
        setSelectedProducts(prev => 
            prev.map(p => p.id === productId ? { ...p, zones_id: zoneId } : p)
        );
    };

    // Handle expire date change
    const handleExpireDateChange = (productId, date) => {
        setSelectedProducts(prev => 
            prev.map(p => p.id === productId ? { ...p, expireDate: date } : p)
        );
    };

    // Handle delete product
    const handleDeleteProduct = (productId) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    };

    // Handle save draft
    const handleSaveDraft = async () => {
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng thêm ít nhất một sản phẩm');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dto = {
                supplierId: selectedSupplier,
                storeId: currentUser?.storeId || 1,
                staffId: currentUser?.id,
                paidAmount: paidAmount,
                importTransactionNote: note,
                details: selectedProducts.map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    importQuantity: p.quantity,
                    remainQuantity: p.quantity,
                    unitImportPrice: p.unitImportPrice,
                    unitSalePrice: p.unitSalePrice,
                    zones_id: p.zones_id,
                    expireDate: p.expireDate,
                }))
            };

            await importTransactionService.create(dto);
            setSuccess('Tạo phiếu nhập hàng thành công!');
            setSelectedProducts([]);
            setPaidAmount(0);
            setNote('');
        } catch (err) {
            console.error('Error creating import transaction:', err);
            setError('Không thể tạo phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    // Handle complete
    const handleComplete = async () => {
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng thêm ít nhất một sản phẩm');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dto = {
                supplierId: selectedSupplier,
                storeId: currentUser?.storeId || 1,
                staffId: currentUser?.id,
                paidAmount: paidAmount,
                importTransactionNote: note,
                status: 'COMPLETE',
                details: selectedProducts.map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    importQuantity: p.quantity,
                    remainQuantity: p.quantity,
                    unitImportPrice: p.unitImportPrice,
                    unitSalePrice: p.unitSalePrice,
                    zones_id: p.zones_id,
                    expireDate: p.expireDate,
                }))
            };

            await importTransactionService.create(dto);
            setSuccess('Tạo phiếu nhập hàng thành công!');
            setSelectedProducts([]);
            setPaidAmount(0);
            setNote('');
        } catch (err) {
            console.error('Error creating import transaction:', err);
            setError('Không thể tạo phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setSelectedProducts([]);
        setSelectedSupplier('');
        setPaidAmount(0);
        setNote('');
        setError(null);
        setSuccess(null);
    };

    // Toggle column visibility
    const toggleColumn = (col) => {
        setColumnVisibility((prev) => ({ ...prev, [col]: !prev[col] }));
    };

    // Calculate total amount
    const totalAmount = selectedProducts.reduce((total, product) => {
        return total + ((product.unitImportPrice || 0) * (product.quantity || 0));
    }, 0);

    return {
        // States
        currentUser,
        products,
        suppliers,
        categories,
        zones,
        selectedProducts,
        nextImportCode,
        
        // Form states
        selectedSupplier,
        note,
        paidAmount,
        
        // UI states
        loading,
        error,
        success,
        showProductDialog,
        showCategoryDialog,
        
        // Search and filter states
        searchTerm,
        filteredProducts,
        selectedCategory,
        categoryProducts,
        
        // Column visibility
        columnVisibility,
        
        // Calculated values
        totalAmount,
        
        // Setters
        setSelectedSupplier,
        setNote,
        setPaidAmount,
        setError,
        setSuccess,
        setShowProductDialog,
        setShowCategoryDialog,
        setSelectedCategory,
        setCategoryProducts,
        
        // Handlers
        handleSearchChange,
        handleSelectProduct,
        handleSelectCategory,
        handleSelectCategoryProduct,
        handleQuantityChange,
        handleQuantityInputChange,
        handleImportPriceChange,
        handleSalePriceChange,
        handleZoneChange,
        handleExpireDateChange,
        handleDeleteProduct,
        handleSaveDraft,
        handleComplete,
        handleCancel,
        toggleColumn,
    };
}; 