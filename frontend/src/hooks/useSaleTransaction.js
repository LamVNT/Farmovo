import {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import saleTransactionService from '../services/saleTransactionService';
import {userService} from '../services/userService';
import {getCategories} from '../services/categoryService';
import {getZones} from '../services/zoneService';

function getVNISOString() {
    const now = new Date();
    const tzOffset = 7 * 60 * 60 * 1000; // 7 hours in ms
    const local = new Date(now.getTime() + tzOffset);
    // Return ISO string without milliseconds and Z
    return local.toISOString().slice(0, 19);
}

export const useSaleTransaction = (props = {}) => {
    const navigate = useNavigate();
    const {isBalanceStock = false} = props; // Lấy isBalanceStock từ props, mặc định false

    // States
    const [currentUser, setCurrentUser] = useState({name: 'User', username: 'user'});
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
                setLoading(true);
                // Load current user and form data
                let currentUserData = null;
                try {
                    currentUserData = await userService.getCurrentUser();
                    setCurrentUser(currentUserData || {name: 'User', username: 'user'});
                } catch (userError) {
                    console.warn('Could not load current user:', userError);
                }

                // Load form data
                const formData = await saleTransactionService.getCreateFormData();
                setCustomers(formData.customers || []);
                setStores(formData.stores || []);
                setProducts(formData.products || []);

                // Auto-select store for STAFF users
                if (formData.stores && formData.stores.length === 1) {
                    setSelectedStore(formData.stores[0].id);
                } else if (currentUserData?.storeId && formData.stores) {
                    const userStore = formData.stores.find(store => store.id === currentUserData.storeId);
                    if (userStore) setSelectedStore(userStore.id);
                }

                // Load categories and zones
                const [categoriesData, zonesData] = await Promise.all([
                    getCategories(),
                    getZones()
                ]);
                setCategories(categoriesData || []);
                setZones(zonesData || []);
            } catch (error) {
                console.error('Failed to load data:', error);
                setError('Không thể tải dữ liệu: ' + (error.message || 'Lỗi không xác định'));
            } finally {
                setLoading(false);
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
    const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.total || 0), 0);

    // Get unique products
    const uniqueProducts = products.reduce((acc, product) => {
        const existingProduct = acc.find(p => p.proId === product.proId);
        if (!existingProduct) acc.push(product);
        return acc;
    }, []);

    // Validate data before saving
    const validateData = (data) => {
        if (!data.customerId) throw new Error('Thiếu khách hàng');
        if (!data.storeId) throw new Error('Thiếu cửa hàng');
        if (!data.detail.length) throw new Error('Thiếu sản phẩm');
        if (isBalanceStock && !data.detail.every(p => p.batchCode && p.zoneReal)) {
            throw new Error('Thiếu thông tin batchCode hoặc zoneReal trong chế độ cân bằng kho');
        }
        return true;
    };

    // Handle product selection
    const handleSelectProduct = useCallback(async (product, options = {}) => {
        if (options.directAdd) {
            const existingIndex = selectedProducts.findIndex(item => item.batchId === product.id);
            if (existingIndex >= 0) {
                const updatedProducts = [...selectedProducts];
                const newQuantity = updatedProducts[existingIndex].quantity + (product.quantity || 1);
                if (newQuantity > product.remainQuantity) {
                    setError(`Tổng số lượng vượt quá tồn kho cho batch ${product.batchCode || product.id}. Còn lại: ${product.remainQuantity}`);
                    return;
                }
                updatedProducts[existingIndex].quantity = newQuantity;
                updatedProducts[existingIndex].total = updatedProducts[existingIndex].price * newQuantity;
                setSelectedProducts(updatedProducts);
            } else {
                const newItem = {
                    id: product.id,
                    name: product.name,
                    unit: product.unit || 'quả',
                    price: product.price || 0,
                    quantity: product.quantity || 1,
                    total: (product.price || 0) * (product.quantity || 1),
                    productId: product.proId,
                    remainQuantity: product.remainQuantity || 0,
                    unitSalePrice: product.price || 0,
                    batchId: product.id,
                    batchCode: product.batchCode || '',
                    productCode: product.productCode || '',
                    categoryName: product.categoryName || '',
                    storeName: product.storeName || '',
                    createAt: product.createAt || getVNISOString(),
                    zoneReal: product.zoneReal || '', // Thêm zoneReal nếu có
                };
                setSelectedProducts(prev => [...prev, newItem]);
            }
            setError(null);
            return;
        }
        setSelectedProduct(product);
        try {
            const batches = await saleTransactionService.getBatchesByProductId(product.proId);
            setAvailableBatches(batches || []);
            if (batches?.length > 0) setShowProductDialog(true);
            else setError('Không có batch nào cho sản phẩm này');
        } catch (error) {
            console.error('Error loading batches:', error);
            setError(`Không thể tải danh sách batch: ${error.response?.data?.message || error.message}`);
            setAvailableBatches([]);
        }
    }, [selectedProducts, isBalanceStock]);

    // Handle adding products from dialog
    const handleAddProductsFromDialog = useCallback((selectedBatches) => {
        let hasError = false;
        const newProducts = [];
        for (const {batch, quantity, batchId} of selectedBatches) {
            const unit = batch.unit || 'quả';
            const maxKhay = Math.floor((batch.remainQuantity || 0) / 30);
            if (unit === 'khay' && quantity > maxKhay) {
                setError(`Số lượng khay vượt quá giới hạn cho batch ${batch.id}. Tối đa: ${maxKhay} khay`);
                hasError = true;
                break;
            } else if (unit === 'quả' && quantity > (batch.remainQuantity || 0)) {
                setError(`Số lượng vượt quá tồn kho cho batch ${batch.id}. Còn lại: ${batch.remainQuantity} quả`);
                hasError = true;
                break;
            }
            const existingIndex = selectedProducts.findIndex(item => item.batchId === batchId);
            if (existingIndex >= 0) {
                const updatedDetail = [...selectedProducts];
                const newQuantity = updatedDetail[existingIndex].quantity + quantity;
                const currentUnit = updatedDetail[existingIndex].unit || 'quả';
                if (currentUnit === 'khay' && newQuantity > maxKhay) {
                    setError(`Tổng số lượng khay vượt quá giới hạn cho batch ${batch.id}. Tối đa: ${maxKhay} khay`);
                    hasError = true;
                    break;
                } else if (currentUnit === 'quả' && newQuantity > (batch.remainQuantity || 0)) {
                    setError(`Tổng số lượng vượt quá tồn kho cho batch ${batch.id}. Còn lại: ${batch.remainQuantity} quả`);
                    hasError = true;
                    break;
                }
                updatedDetail[existingIndex].quantity = newQuantity;
                updatedDetail[existingIndex].total = updatedDetail[existingIndex].price * (currentUnit === 'khay' ? newQuantity * 30 : newQuantity);
                setSelectedProducts(updatedDetail);
            } else {
                const price = batch.unitSalePrice || 0;
                const total = price * (unit === 'khay' ? quantity * 30 : quantity);
                newProducts.push({
                    id: batch.id,
                    name: batch.productName || '',
                    unit: unit,
                    price,
                    quantity,
                    total,
                    productId: batch.proId || '',
                    remainQuantity: batch.remainQuantity || 0,
                    unitSalePrice: batch.unitSalePrice || 0,
                    batchId: batch.id,
                    batchCode: batch.batchCode || '',
                    productCode: batch.productCode || '',
                    categoryName: batch.categoryName || '',
                    storeName: batch.storeName || '',
                    createAt: batch.createAt || getVNISOString(),
                    zoneReal: batch.zoneReal || '',
                });
            }
        }
        if (!hasError && newProducts.length > 0) setSelectedProducts(prev => [...prev, ...newProducts]);
    }, [selectedProducts]);

    // Handle quantity change
    const handleQuantityChange = useCallback((id, delta) => {
        setSelectedProducts(prev =>
            prev.map(p => {
                if (p.id === id) {
                    const newQuantity = Math.max(1, p.quantity + delta);
                    const maxKhay = Math.floor((p.remainQuantity || 0) / 30);
                    if (p.unit === 'khay' && newQuantity > maxKhay) {
                        setError(`Số lượng khay vượt quá giới hạn. Tối đa: ${maxKhay} khay`);
                        return p;
                    } else if (p.unit === 'quả' && newQuantity > (p.remainQuantity || 0)) {
                        setError(`Số lượng vượt quá tồn kho. Còn lại: ${p.remainQuantity} quả`);
                        return p;
                    }
                    return {
                        ...p,
                        quantity: newQuantity,
                        total: (p.price || 0) * (p.unit === 'khay' ? newQuantity * 30 : newQuantity),
                    };
                }
                return p;
            })
        );
        setError(null);
    }, []);

    // Handle quantity input change
    const handleQuantityInputChange = useCallback((id, newQuantity) => {
        setSelectedProducts(prev =>
            prev.map(p => {
                if (p.id === id) {
                    const quantity = Math.max(1, newQuantity);
                    const maxKhay = Math.floor((p.remainQuantity || 0) / 30);
                    if (p.unit === 'khay' && quantity > maxKhay) {
                        setError(`Số lượng khay vượt quá giới hạn. Tối đa: ${maxKhay} khay`);
                        return p;
                    } else if (p.unit === 'quả' && quantity > (p.remainQuantity || 0)) {
                        setError(`Số lượng vượt quá tồn kho. Còn lại: ${p.remainQuantity} quả`);
                        return p;
                    }
                    return {
                        ...p,
                        quantity,
                        total: (p.price || 0) * (p.unit === 'khay' ? quantity * 30 : quantity),
                    };
                }
                return p;
            })
        );
        setError(null);
    }, []);

    // Handle price change
    const handlePriceChange = useCallback((id, newPrice) => {
        setSelectedProducts(prev =>
            prev.map(p =>
                p.id === id
                    ? {
                        ...p,
                        price: newPrice,
                        total: newPrice * (p.unit === 'khay' ? p.quantity * 30 : p.quantity),
                    }
                    : p
            )
        );
    }, []);

    // Handle delete product
    const handleDeleteProduct = useCallback((id) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== id));
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
        const customerInfo = customers.find(c => c.id === selectedCustomer);
        const storeInfo = stores.find(s => s.id === selectedStore);
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
        const customerInfo = customers.find(c => c.id === selectedCustomer);
        const storeInfo = stores.find(s => s.id === selectedStore);
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
                saleDate: now,
                detail: selectedProducts.map(product => ({
                    id: product.batchId || product.id,
                    proId: product.productId || product.id,
                    productName: product.name || '',
                    productCode: product.productCode || product.code || '',
                    remainQuantity: product.remainQuantity || 0,
                    quantity: product.quantity || 0,
                    unitSalePrice: product.price || product.unitSalePrice || 0,
                    categoryName: product.categoryName || '',
                    storeName: product.storeName || '',
                    createAt: now,
                    ...(isBalanceStock ? {batchCode: product.batchCode || '', zoneReal: product.zoneReal || ''} : {}),
                })),
            };

            validateData(saleData);

            const saveFunction = isBalanceStock
                ? saleTransactionService.createFromBalance
                : saleTransactionService.create;

            console.log('Sending data to:', isBalanceStock ? '/save-from-balance' : '/save', saleData);
            await saveFunction(saleData);

            const successMessage = pendingAction === 'DRAFT'
                ? 'Đã lưu phiếu bán hàng tạm thời!'
                : 'Đã hoàn thành phiếu bán hàng!';

            setSuccess(successMessage);
            setSelectedProducts([]);
            setSelectedCustomer('');
            setSelectedStore('');
            setPaidAmount(0);
            setNote('');

            setShowSummaryDialog(false);
            setSummaryData(null);
            setPendingAction(null);
        } catch (err) {
            console.error('Error creating sale transaction:', err);
            setError(`Không thể lưu phiếu bán hàng: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    }, [pendingAction, summaryData, selectedCustomer, selectedStore, selectedProducts, paidAmount, totalAmount, note, saleDate, isBalanceStock]);

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
        setSelectedProducts,
        setCustomers,

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