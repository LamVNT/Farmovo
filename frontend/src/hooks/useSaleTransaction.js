import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import saleTransactionService from '../services/saleTransactionService';
import { userService } from '../services/userService';
import { getCategories } from '../services/categoryService';
import { getZones } from '../services/zoneService';

export const useSaleTransaction = () => {
    const navigate = useNavigate();
    
    // States
    const [currentUser, setCurrentUser] = useState({ name: 'User', username: 'user' });
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [stores, setStores] = useState([]);
    const [categories, setCategories] = useState([]);
    const [zones, setZones] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form states
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedStore, setSelectedStore] = useState('');
    const [saleDate, setSaleDate] = useState(new Date());
    const [note, setNote] = useState('');
    const [status, setStatus] = useState('DRAFT');
    const [paidAmount, setPaidAmount] = useState(0);

    // Dialog states
    const [showProductDialog, setShowProductDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [availableBatches, setAvailableBatches] = useState([]);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load current user
                try {
                    const currentUserData = await userService.getCurrentUser();
                    setCurrentUser(currentUserData);
                } catch (userError) {
                    console.warn('Could not load current user:', userError);
                }

                // Load form data
                const formData = await saleTransactionService.getCreateFormData();
                setCustomers(formData.customers || []);
                setStores(formData.stores || []);
                setProducts(formData.products || []);

                // Load categories and zones
                const [categoriesData, zonesData] = await Promise.all([
                    getCategories(),
                    getZones()
                ]);
                setCategories(categoriesData);
                setZones(zonesData);
            } catch (error) {
                console.error('Failed to load data:', error);
                setError('Không thể tải dữ liệu: ' + error.message);
            }
        };

        loadData();
    }, []);

    // Auto hide success message
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Calculate total amount
    const totalAmount = selectedProducts.reduce((sum, p) => sum + p.total, 0);

    // Get unique products
    const uniqueProducts = products.reduce((acc, product) => {
        const existingProduct = acc.find(p => p.proId === product.proId);
        if (!existingProduct) {
            acc.push(product);
        }
        return acc;
    }, []);

    // Handle product selection
    const handleSelectProduct = useCallback(async (product) => {
        setSelectedProduct(product);
        
        try {
            const batches = await saleTransactionService.getBatchesByProductId(product.proId);
            setAvailableBatches(batches);
            
            // Auto add if only 1 batch
            if (batches.length === 1) {
                const batch = batches[0];
                const price = batch.unitSalePrice || 0;
                const total = price * 1;
                
                const existingIndex = selectedProducts.findIndex(item => item.id === batch.id);
                if (existingIndex >= 0) {
                    const updatedDetail = [...selectedProducts];
                    const newQuantity = updatedDetail[existingIndex].quantity + 1;
                    
                    if (newQuantity <= batch.remainQuantity) {
                        updatedDetail[existingIndex].quantity = newQuantity;
                        updatedDetail[existingIndex].total = updatedDetail[existingIndex].price * newQuantity;
                        setSelectedProducts(updatedDetail);
                        setSuccess(`Đã thêm ${product.productName} vào bảng`);
                    } else {
                        setError(`Số lượng vượt quá tồn kho. Còn lại: ${batch.remainQuantity}`);
                    }
                } else {
                    const newItem = {
                        id: batch.id,
                        name: batch.productName,
                        unit: 'quả',
                        price,
                        quantity: 1,
                        total,
                        productId: batch.proId,
                        remainQuantity: batch.remainQuantity,
                        unitSalePrice: batch.unitSalePrice,
                        batchId: batch.id,
                        productCode: batch.productCode,
                        categoryName: batch.categoryName,
                        storeName: batch.storeName,
                        createAt: batch.createAt,
                    };
                    setSelectedProducts([...selectedProducts, newItem]);
                    setSuccess(`Đã thêm ${product.productName} vào bảng`);
                }
            } else if (batches.length > 1) {
                setShowProductDialog(true);
            } else {
                setError('Không có batch nào cho sản phẩm này');
            }
        } catch (error) {
            console.error('Error loading batches:', error);
            setError('Không thể tải danh sách batch');
            setAvailableBatches([]);
        }
    }, [selectedProducts]);

    // Handle adding products from dialog
    const handleAddProductsFromDialog = useCallback((selectedBatches) => {
        let hasError = false;
        const newProducts = [];
        
        for (const selectedBatchData of selectedBatches) {
            const { batch, quantity } = selectedBatchData;
            
            if (quantity > batch.remainQuantity) {
                setError(`Số lượng vượt quá tồn kho cho batch ${batch.id}. Còn lại: ${batch.remainQuantity}`);
                hasError = true;
                break;
            }
            
            const existingIndex = selectedProducts.findIndex(item => item.id === batch.id);
            if (existingIndex >= 0) {
                const updatedDetail = [...selectedProducts];
                const newQuantity = updatedDetail[existingIndex].quantity + quantity;
                
                if (newQuantity > batch.remainQuantity) {
                    setError(`Tổng số lượng vượt quá tồn kho cho batch ${batch.id}. Còn lại: ${batch.remainQuantity}`);
                    hasError = true;
                    break;
                }
                
                updatedDetail[existingIndex].quantity = newQuantity;
                updatedDetail[existingIndex].total = updatedDetail[existingIndex].price * newQuantity;
                setSelectedProducts(updatedDetail);
            } else {
                const price = batch.unitSalePrice || 0;
                const total = price * quantity;
                
                const newItem = {
                    id: batch.id,
                    name: batch.productName,
                    unit: 'quả',
                    price,
                    quantity,
                    total,
                    productId: batch.proId,
                    remainQuantity: batch.remainQuantity,
                    unitSalePrice: batch.unitSalePrice,
                    batchId: batch.id,
                    productCode: batch.productCode,
                    categoryName: batch.categoryName,
                    storeName: batch.storeName,
                    createAt: batch.createAt,
                };
                newProducts.push(newItem);
            }
        }
        
        if (!hasError && newProducts.length > 0) {
            setSelectedProducts([...selectedProducts, ...newProducts]);
        }
    }, [selectedProducts]);

    // Handle quantity change
    const handleQuantityChange = useCallback((id, delta) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    const newQuantity = Math.max(1, p.quantity + delta);
                    if (newQuantity > p.remainQuantity) {
                        setError(`Số lượng vượt quá tồn kho. Còn lại: ${p.remainQuantity}`);
                        return p;
                    }
                    return {
                        ...p,
                        quantity: newQuantity,
                        total: (p.price || 0) * newQuantity,
                    };
                }
                return p;
            })
        );
        setError(null);
    }, []);

    // Handle quantity input change
    const handleQuantityInputChange = useCallback((id, newQuantity) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    const quantity = Math.max(1, newQuantity);
                    if (quantity > p.remainQuantity) {
                        setError(`Số lượng vượt quá tồn kho. Còn lại: ${p.remainQuantity}`);
                        return p;
                    }
                    return {
                        ...p,
                        quantity,
                        total: (p.price || 0) * quantity,
                    };
                }
                return p;
            })
        );
        setError(null);
    }, []);

    // Handle price change
    const handlePriceChange = useCallback((id, newPrice) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        price: newPrice,
                        total: newPrice * p.quantity,
                    }
                    : p
            )
        );
    }, []);

    // Handle delete product
    const handleDeleteProduct = useCallback((id) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
    }, []);

    // Handle save draft
    const handleSaveDraft = useCallback(async () => {
        if (!selectedCustomer) {
            setError('Vui lòng chọn khách hàng');
            return;
        }

        if (!selectedStore) {
            setError('Vui lòng chọn cửa hàng');
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        if (paidAmount > totalAmount) {
            setError('Số tiền đã trả không được vượt quá tổng tiền hàng');
            return;
        }

        // Đảm bảo status là DRAFT khi lưu tạm
        setStatus('DRAFT');

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const saleData = {
                customerId: selectedCustomer,
                storeId: selectedStore,
                totalAmount,
                paidAmount,
                saleTransactionNote: note,
                status: 'DRAFT',
                saleDate,
                detail: selectedProducts.map(product => ({
                    id: product.batchId || product.id, // importtransactiondetailID
                    proId: product.productId || product.id, // product ID
                    productName: product.name,
                    productCode: product.productCode || product.code || '',
                    remainQuantity: product.remainQuantity || 0,
                    quantity: product.quantity,
                    unitSalePrice: product.price || product.unitSalePrice,
                    categoryName: product.categoryName || '',
                    storeName: product.storeName || '',
                    createAt: product.createAt || new Date().toISOString()
                }))
            };

            await saleTransactionService.create(saleData);
            setSuccess('Đã lưu phiếu bán hàng tạm thời!');
            setSelectedProducts([]);
            // Reset form sau khi lưu tạm
            setSelectedCustomer('');
            setSelectedStore('');
            setPaidAmount(0);
            setNote('');
        } catch (err) {
            console.error('Error creating sale transaction:', err);
            setError('Không thể lưu phiếu bán hàng tạm thời');
        } finally {
            setLoading(false);
        }
    }, [selectedCustomer, selectedStore, selectedProducts, paidAmount, totalAmount, note, saleDate]);

    // Handle complete
    const handleComplete = useCallback(async () => {
        if (!selectedCustomer) {
            setError('Vui lòng chọn khách hàng');
            return;
        }

        if (!selectedStore) {
            setError('Vui lòng chọn cửa hàng');
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        if (paidAmount > totalAmount) {
            setError('Số tiền đã trả không được vượt quá tổng tiền hàng');
            return;
        }

        // Đảm bảo status là COMPLETE khi hoàn thành
        setStatus('COMPLETE');

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const saleData = {
                customerId: selectedCustomer,
                storeId: selectedStore,
                totalAmount,
                paidAmount,
                saleTransactionNote: note,
                status: 'COMPLETE',
                saleDate,
                detail: selectedProducts.map(product => ({
                    id: product.batchId || product.id, // importtransactiondetailID
                    proId: product.productId || product.id, // product ID
                    productName: product.name,
                    productCode: product.productCode || product.code || '',
                    remainQuantity: product.remainQuantity || 0,
                    quantity: product.quantity,
                    unitSalePrice: product.price || product.unitSalePrice,
                    categoryName: product.categoryName || '',
                    storeName: product.storeName || '',
                    createAt: product.createAt || new Date().toISOString()
                }))
            };

            await saleTransactionService.create(saleData);
            setSuccess('Đã hoàn thành phiếu bán hàng!');
            setSelectedProducts([]);
            // Reset form sau khi hoàn thành
            setSelectedCustomer('');
            setSelectedStore('');
            setPaidAmount(0);
            setNote('');
        } catch (err) {
            console.error('Error creating sale transaction:', err);
            setError('Không thể hoàn thành phiếu bán hàng');
        } finally {
            setLoading(false);
        }
    }, [selectedCustomer, selectedStore, selectedProducts, paidAmount, totalAmount, note, saleDate]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        navigate("/sale");
    }, [navigate]);

    return {
        // States
        currentUser,
        products: uniqueProducts,
        customers,
        stores,
        categories,
        zones,
        selectedProducts,
        loading,
        error,
        success,
        
        // Form states
        selectedCustomer,
        selectedStore,
        saleDate,
        note,
        status,
        paidAmount,
        totalAmount,
        
        // Dialog states
        showProductDialog,
        selectedProduct,
        availableBatches,
        
        // Setters
        setSelectedCustomer,
        setSelectedStore,
        setSaleDate,
        setNote,
        setStatus,
        setPaidAmount,
        setShowProductDialog,
        setError,
        setSuccess,
        
        // Handlers
        handleSelectProduct,
        handleAddProductsFromDialog,
        handleQuantityChange,
        handleQuantityInputChange,
        handlePriceChange,
        handleDeleteProduct,
        handleSaveDraft,
        handleComplete,
        handleCancel,
    };
}; 