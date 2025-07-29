import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import saleTransactionService from '../services/saleTransactionService';
import { userService } from '../services/userService';
import { getCategories } from '../services/categoryService';
import { getZones } from '../services/zoneService';

function getVNISOString() {
  const now = new Date();
  const tzOffset = 7 * 60 * 60 * 1000; // 7 hours in ms
  const local = new Date(now.getTime() + tzOffset);
  // Return ISO string without milliseconds and Z
  return local.toISOString().slice(0, 19);
}

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
    
    // Summary dialog states
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [pendingAction, setPendingAction] = useState(null); // 'DRAFT' or 'COMPLETE'

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
    const handleSelectProduct = useCallback(async (product, options = {}) => {
        // Nếu gọi từ AddSalePage (chọn lô), thêm luôn vào bảng, không bật dialog
        if (options.directAdd) {
            // Tạo object sản phẩm từ batch
            const newItem = {
                id: product.id, // id của importtransactiondetail (batch)
                name: product.name,
                unit: product.unit || 'quả',
                price: product.price,
                quantity: product.quantity || 1,
                total: (product.price || 0) * (product.quantity || 1),
                productId: product.proId,
                remainQuantity: product.remainQuantity,
                unitSalePrice: product.price,
                batchId: product.id,
                productCode: product.productCode,
                categoryName: product.categoryName,
                storeName: product.storeName,
                createAt: product.createAt,
            };
            setSelectedProducts(prev => [...prev, newItem]);
            setError(null);
            return;
        }
        // Nếu gọi từ dialog Thêm sản phẩm thì vẫn giữ logic cũ
        setSelectedProduct(product);
        try {
            const batches = await saleTransactionService.getBatchesByProductId(product.proId);
            setAvailableBatches(batches);
            if (batches.length > 0) {
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
            const { batch, quantity, batchId } = selectedBatchData;
            
            if (quantity > batch.remainQuantity) {
                setError(`Số lượng vượt quá tồn kho cho batch ${batch.id}. Còn lại: ${batch.remainQuantity}`);
                hasError = true;
                break;
            }
            
            const existingIndex = selectedProducts.findIndex(item => item.batchId === batchId);
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

        // Tìm thông tin khách hàng và cửa hàng
        const customerInfo = customers.find(c => c.id === selectedCustomer);
        const storeInfo = stores.find(s => s.id === selectedStore);

        // Chuẩn bị dữ liệu cho dialog tổng kết
        const summaryData = {
            customer: customerInfo,
            store: storeInfo,
            products: selectedProducts,
            totalAmount,
            paidAmount,
            note,
            saleDate,
            status: 'DRAFT'
        };

        setSummaryData(summaryData);
        setPendingAction('DRAFT');
        setShowSummaryDialog(true);
        setError(null);
    }, [selectedCustomer, selectedStore, selectedProducts, paidAmount, totalAmount, note, saleDate, customers, stores]);

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

        // Tìm thông tin khách hàng và cửa hàng
        const customerInfo = customers.find(c => c.id === selectedCustomer);
        const storeInfo = stores.find(s => s.id === selectedStore);

        // Chuẩn bị dữ liệu cho dialog tổng kết
        const summaryData = {
            customer: customerInfo,
            store: storeInfo,
            products: selectedProducts,
            totalAmount,
            paidAmount,
            note,
            saleDate,
            status: 'COMPLETE'
        };

        setSummaryData(summaryData);
        setPendingAction('COMPLETE');
        setShowSummaryDialog(true);
        setError(null);
    }, [selectedCustomer, selectedStore, selectedProducts, paidAmount, totalAmount, note, saleDate, customers, stores]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        navigate("/sale");
    }, [navigate]);

    // Handle confirm from summary dialog
    const handleConfirmSummary = useCallback(async () => {
        if (!pendingAction || !summaryData) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const now = getVNISOString();
            const saleData = {
                customerId: selectedCustomer,
                storeId: selectedStore,
                totalAmount,
                paidAmount,
                saleTransactionNote: note,
                status: pendingAction,
                saleDate: now, // always use Vietnam time
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
                    createAt: now // always use Vietnam time
                }))
            };

            await saleTransactionService.create(saleData);
            
            const successMessage = pendingAction === 'DRAFT' 
                ? 'Đã lưu phiếu bán hàng tạm thời!' 
                : 'Đã hoàn thành phiếu bán hàng!';
            
            setSuccess(successMessage);
            setSelectedProducts([]);
            // Reset form sau khi lưu
            setSelectedCustomer('');
            setSelectedStore('');
            setPaidAmount(0);
            setNote('');
            
            // Đóng dialog tổng kết
            setShowSummaryDialog(false);
            setSummaryData(null);
            setPendingAction(null);
        } catch (err) {
            console.error('Error creating sale transaction:', err);
            setError('Không thể lưu phiếu bán hàng');
        } finally {
            setLoading(false);
        }
    }, [pendingAction, summaryData, selectedCustomer, selectedStore, selectedProducts, paidAmount, totalAmount, note, saleDate]);

    // Handle close summary dialog
    const handleCloseSummary = useCallback(() => {
        setShowSummaryDialog(false);
        setSummaryData(null);
        setPendingAction(null);
    }, []);

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
        
        // Summary dialog states
        showSummaryDialog,
        summaryData,
        pendingAction,
        
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
        setShowSummaryDialog,
        setSummaryData,
        setPendingAction,
        setSelectedProducts, // thêm dòng này để export
        setCustomers, // thêm dòng này để export
        
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
        handleConfirmSummary,
        handleCloseSummary,
    };
}; 