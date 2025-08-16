import {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import saleTransactionService from '../services/saleTransactionService';
import {userService} from '../services/userService';
import {getCategories} from '../services/categoryService';
import {getZones} from '../services/zoneService';

function getVNISOString() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const HH = pad(now.getHours());
    const MM = pad(now.getMinutes());
    const SS = pad(now.getSeconds());
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`; // Local time without timezone
}

export const useSaleTransaction = (props = {}) => {
    const navigate = useNavigate();
    const {isBalanceStock = false, onSubmit: onSubmitProp} = props;

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
        (async () => {
            try {
                setLoading(true);
                const userRes = await userService.getCurrentUser?.();
                if (userRes) {
                    setCurrentUser(userRes);
                } else {
                    const cached = localStorage.getItem('user');
                    if (cached) setCurrentUser(JSON.parse(cached));
                }
                const formData = await saleTransactionService.getCreateFormData();
                setCustomers(formData.customers || []);
                setStores(formData.stores || []);
                setProducts(formData.products || []);
                const zonesRes = await getZones();
                setZones(zonesRes || []);
                // Prefill store for STAFF once data is available
                const roles = Array.isArray(userRes?.roles) ? userRes.roles.map(r => r?.toString().toUpperCase()) : [];
                const isStaff = roles.some(r => r.includes('STAFF'));
                if (isStaff) {
                    const userStoreId = userRes?.storeId || userRes?.store?.id || localStorage.getItem('staff_store_id');
                    if (userStoreId && !selectedStore) {
                        const candidate = String(userStoreId);
                        const storeMatch = (formData.stores || []).find(s => String(s.id) === candidate || String(s.storeId) === candidate || (s.storeName && s.storeName === userRes?.storeName));
                        const value = storeMatch ? String(storeMatch.id || storeMatch.storeId) : candidate;
                        setSelectedStore(value);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.total || ((p.price || 0) * ((p.unit === 'khay' ? (p.quantity || 0) * 30 : (p.quantity || 0))))), 0);

    // Product handlers
    const handleSelectProduct = useCallback((product, options = {}) => {
        console.log('handleSelectProduct - input product:', product);
        
        // Đảm bảo id luôn là số hợp lệ
        const validId = (/^\d+$/.test(String(product.id))) ? Number(product.id) : (product.batchId || product.batch?.id || Date.now());
        // Đảm bảo proId luôn có giá trị
        const validProId = product.proId || product.batch?.proId || product.id || validId;
        const productWithValidId = { ...product, id: validId, proId: validProId };
        
        console.log('handleSelectProduct - productWithValidId:', productWithValidId);
        
        setSelectedProducts(prev => {
            const exists = prev.find(p => String(p.id) === String(validId));
            if (exists) {
                return prev.map(p => String(p.id) === String(validId)
                    ? {
                        ...p,
                        quantity: (p.quantity || 0) + (product.quantity || 1),
                        price: product.price != null ? product.price : p.price,
                        total: (product.price != null ? product.price : p.price || 0) * ((p.unit === 'khay' ? ((p.quantity || 0) + (product.quantity || 1)) * 30 : (p.quantity || 0) + (product.quantity || 1)))
                    }
                    : p);
            }
            const unit = product.unit || 'quả';
            const quantity = product.quantity || 1;
            const price = product.price || 0;
            const total = price * (unit === 'khay' ? quantity * 30 : quantity);
            return [...prev, {...productWithValidId, unit, quantity, price, total}];
        });
    }, []);

    const handleAddProductsFromDialog = useCallback((list) => {
        console.log('handleAddProductsFromDialog - list:', list);
        console.log('handleAddProductsFromDialog - selectedProduct:', selectedProduct);
        
        (list || []).forEach(item => {
            // Đảm bảo có đầy đủ thông tin sản phẩm từ batch
            const productInfo = {
                ...item,
                // Đảm bảo id luôn là số hợp lệ
                id: (/^\d+$/.test(String(item.id))) ? Number(item.id) : (item.batchId || item.batch?.id || Date.now()),
                // Đảm bảo proId luôn có giá trị
                proId: item.proId || item.batch?.proId || selectedProduct?.proId || selectedProduct?.id,
                // Lấy thông tin sản phẩm từ batch nếu có
                productName: item.batch?.productName || item.productName || selectedProduct?.productName,
                productCode: item.batch?.productCode || item.productCode || selectedProduct?.productCode,
                name: item.batch?.productName || item.productName || selectedProduct?.productName,
                // Lấy thông tin batch
                batchCode: item.batch?.name || item.batch?.batchCode || item.name,
                batchId: item.batchId || item.batch?.id,
                // Lấy giá từ batch
                price: item.batch?.unitSalePrice || item.price || 0,
                unitSalePrice: item.batch?.unitSalePrice || item.unitSalePrice || 0,
                // Các thông tin khác từ batch
                remainQuantity: item.batch?.remainQuantity,
                expireDate: item.batch?.expireDate,
                createAt: item.batch?.createAt,
            };
            
            console.log('handleAddProductsFromDialog - productInfo:', productInfo);
            handleSelectProduct(productInfo, {directAdd: true});
        });
    }, [handleSelectProduct, selectedProduct]);

    const handleQuantityChange = useCallback((id, delta) => {
        setSelectedProducts(prev => prev.map(p => {
            if (String(p.id) !== String(id)) return p;
            
            const currentQty = p.quantity || 1;
            const newQty = Math.max(1, currentQty + delta);
            const unit = p.unit || 'quả';
            const price = p.price || 0;
            
            // Kiểm tra số lượng không vượt quá tồn kho
            const maxQuantity = unit === 'khay' ? Math.floor((p.remainQuantity || 0) / 30) : (p.remainQuantity || 0);
            if (newQty > maxQuantity) {
                // Nếu vượt quá, giữ nguyên số lượng cũ và hiển thị thông báo
                setError(`Số lượng không thể vượt quá tồn kho hiện có: ${maxQuantity} ${unit}`);
                return p;
            }
            
            // Xóa thông báo lỗi nếu thành công
            setError(null);
            const total = price * (unit === 'khay' ? newQty * 30 : newQty);
            return {...p, quantity: newQty, total};
        }));
    }, []);

    const handleQuantityInputChange = useCallback((id, value) => {
        setSelectedProducts(prev => prev.map(p => {
            if (String(p.id) !== String(id)) return p;
            
            const newQty = Math.max(1, Number(value) || 1);
            const unit = p.unit || 'quả';
            const price = p.price || 0;
            
            // Kiểm tra số lượng không vượt quá tồn kho
            const maxQuantity = unit === 'khay' ? Math.floor((p.remainQuantity || 0) / 30) : (p.remainQuantity || 0);
            if (newQty > maxQuantity) {
                // Nếu vượt quá, giữ nguyên số lượng cũ và hiển thị thông báo
                setError(`Số lượng không thể vượt quá tồn kho hiện có: ${maxQuantity} ${unit}`);
                return p;
            }
            
            // Xóa thông báo lỗi nếu thành công
            setError(null);
            const total = price * (unit === 'khay' ? newQty * 30 : newQty);
            return {...p, quantity: newQty, total};
        }));
    }, []);

    const handlePriceChange = useCallback((id, price) => {
        setSelectedProducts(prev => prev.map(p => {
            if (String(p.id) !== String(id)) return p;
            const unit = p.unit || 'quả';
            const qty = p.quantity || 1;
            const total = (price || 0) * (unit === 'khay' ? qty * 30 : qty);
            return {...p, price, total};
        }));
    }, []);

    const handleDeleteProduct = useCallback((id) => {
        setSelectedProducts(prev => prev.filter(p => String(p.id) !== String(id)));
    }, []);

    // Product dialog handlers
    const handleSelectProductInDialog = useCallback(async (product) => {
        setSelectedProduct(product);
        // Không cần gọi API nữa, availableBatches sẽ được xử lý trong SaleProductDialog
        // setAvailableBatches([]); // Để trống để SaleProductDialog xử lý
    }, []);

    const handleSelectBatches = useCallback((batches) => {
        // This can be used if needed for batch selection logic
        // Currently handled in SaleProductDialog
    }, []);

    // Summary
    const handleShowSummary = useCallback((action) => {
        setPendingAction(action);
        const saleData = {
            detail: selectedProducts,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
            saleDate: saleDate ? saleDate.toISOString() : getVNISOString(),
            customerId: selectedCustomer || null,
            storeId: selectedStore || null,
            status: action === 'DRAFT' ? 'DRAFT' : (isBalanceStock ? 'WAITING_FOR_APPROVE' : 'COMPLETE'),
            saleTransactionNote: note,
        };
        setSummaryData(saleData);
        setShowSummaryDialog(true);
    }, [selectedProducts, totalAmount, paidAmount, selectedCustomer, selectedStore, isBalanceStock, note, saleDate]);

    const validateData = (saleData) => {
        if (!saleData.storeId) throw new Error('Vui lòng chọn cửa hàng');
        if (selectedProducts.length === 0) throw new Error('Vui lòng thêm ít nhất một sản phẩm');
    };

    // Direct actions (used by AddSalePage internal showSummary)
    const handleSaveDraft = useCallback(async () => {
        const saleData = {
            detail: selectedProducts,
            totalAmount,
            paidAmount,
            saleDate: saleDate ? saleDate.toISOString() : getVNISOString(),
            customerId: selectedCustomer || null,
            storeId: selectedStore || null,
            status: 'DRAFT',
            saleTransactionNote: note,
        };
        validateData(saleData);
        
        // Đảm bảo proId luôn có giá trị cho draft
        const processedSaleData = {
            ...saleData,
            detail: saleData.detail.map(item => ({
                ...item,
                proId: item.proId || item.batchId || item.id, // Đảm bảo proId luôn có giá trị
            }))
        };
        
        try {
            await saleTransactionService.create(processedSaleData);
            setSuccess('Đã lưu phiếu bán hàng tạm thời!');
            // Lưu thông báo để hiển thị ở trang index
            localStorage.setItem('saleSuccessMessage', 'Đã lưu phiếu bán hàng tạm thời!');
            try { navigate('/sale'); } catch (e) {}
        } catch (err) {
            console.error('Error saving draft:', err);
            setError(`Không thể lưu phiếu bán hàng tạm thời: ${err.response?.data?.message || err.message}`);
        }
    }, [selectedProducts, totalAmount, paidAmount, selectedCustomer, selectedStore, note, saleDate, navigate]);

    const handleComplete = useCallback(async () => {
        const saleData = {
            detail: selectedProducts,
            totalAmount,
            paidAmount,
            saleDate: saleDate ? saleDate.toISOString() : getVNISOString(),
            customerId: selectedCustomer || null,
            storeId: selectedStore || null,
            status: isBalanceStock ? 'WAITING_FOR_APPROVE' : 'COMPLETE',
            saleTransactionNote: note,
        };
        validateData(saleData);
        if (isBalanceStock) {
            const payload = {
                ...saleData,
                detail: saleData.detail.map(item => ({
                    id: (/^\d+$/.test(String(item.id))) ? Number(item.id) : (item.batchId || item.proId || Date.now()),
                    proId: item.proId || item.batchId || item.id, // Đảm bảo proId luôn có giá trị
                    productName: item.productName,
                    productCode: item.productCode,
                    remainQuantity: item.remainQuantity,
                    quantity: item.quantity,
                    unitSalePrice: item.unitSalePrice ?? item.price ?? 0,
                    categoryName: item.categoryName,
                    storeName: item.storeName,
                    createAt: item.createAt,
                    batchCode: item.batchCode || item.name,
                    zoneReal: item.zoneReal,
                })),
            };
            if (typeof onSubmitProp === 'function') {
                await onSubmitProp(payload);
            } else {
                await saleTransactionService.createFromBalance(payload);
            }
            setSuccess('Đã tạo phiếu cân bằng chờ duyệt!');
            // Lưu thông báo để hiển thị ở trang index
            localStorage.setItem('saleSuccessMessage', 'Đã tạo phiếu cân bằng chờ duyệt!');
            try { navigate('/sale'); } catch (e) {}
        } else {
            // Đảm bảo proId luôn có giá trị cho sale transaction thường
            const processedSaleData = {
                ...saleData,
                detail: saleData.detail.map(item => ({
                    ...item,
                    proId: item.proId || item.batchId || item.id, // Đảm bảo proId luôn có giá trị
                }))
            };
            
            console.log('handleComplete - processedSaleData:', processedSaleData);
            await saleTransactionService.create(processedSaleData);
            setSuccess('Đã hoàn thành phiếu bán hàng!');
            // Lưu thông báo để hiển thị ở trang index
            localStorage.setItem('saleSuccessMessage', 'Đã hoàn thành phiếu bán hàng!');
            try { navigate('/sale'); } catch (e) {}
        }
    }, [selectedProducts, totalAmount, paidAmount, selectedCustomer, selectedStore, note, isBalanceStock, onSubmitProp, saleDate]);

    const handleCancel = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const handleConfirmSummary = useCallback(async () => {
        if (!pendingAction || !summaryData) return;
        try {
            setLoading(true);
            setError(null);

            const saleData = {...summaryData};
            validateData(saleData);

            if (isBalanceStock) {
                saleData.detail = saleData.detail.map(item => ({
                    id: (/^\d+$/.test(String(item.id))) ? Number(item.id) : (item.batchId || item.proId || Date.now()),
                    proId: item.proId || item.batchId || item.id, // Đảm bảo proId luôn có giá trị
                    productName: item.productName,
                    productCode: item.productCode,
                    remainQuantity: item.remainQuantity,
                    quantity: item.quantity,
                    unitSalePrice: item.unitSalePrice ?? item.price ?? 0,
                    categoryName: item.categoryName,
                    storeName: item.storeName,
                    createAt: item.createAt,
                    batchCode: item.batchCode || item.name,
                    zoneReal: item.zoneReal,
                }));
                if (typeof onSubmitProp === 'function') {
                    await onSubmitProp(saleData);
                } else {
                    await saleTransactionService.createFromBalance(saleData);
                }
            } else {
                // Đảm bảo proId luôn có giá trị cho sale transaction thường
                const processedSaleData = {
                    ...saleData,
                    detail: saleData.detail.map(item => ({
                        ...item,
                        proId: item.proId || item.batchId || item.id, // Đảm bảo proId luôn có giá trị
                    }))
                };
                await saleTransactionService.create(processedSaleData);
            }

            const successMessage = pendingAction === 'DRAFT'
                ? 'Đã lưu phiếu bán hàng tạm thời!'
                : (isBalanceStock ? 'Đã tạo phiếu cân bằng chờ duyệt!' : 'Đã hoàn thành phiếu bán hàng!');

            setSuccess(successMessage);
            // Lưu thông báo để hiển thị ở trang index
            localStorage.setItem('saleSuccessMessage', successMessage);
            setSelectedProducts([]);
            setSelectedCustomer('');
            setSelectedStore('');
            setPaidAmount(0);
            setNote('');

            setShowSummaryDialog(false);
            setSummaryData(null);
            setPendingAction(null);
            
            // Chuyển hướng về trang index sau khi hoàn thành
            try { navigate('/sale'); } catch (e) {}
        } catch (err) {
            console.error('Error creating sale transaction:', err);
            setError(`Không thể lưu phiếu bán hàng: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    }, [pendingAction, summaryData, selectedCustomer, selectedStore, selectedProducts, paidAmount, totalAmount, note, isBalanceStock, onSubmitProp]);

    const handleCloseSummary = useCallback(() => {
        setShowSummaryDialog(false);
    }, []);

    return {
        currentUser,
        products,
        customers,
        stores,
        categories,
        zones,
        selectedProducts,
        loading,
        error,
        success,
        selectedCustomer,
        selectedStore,
        saleDate,
        note,
        status,
        paidAmount,
        totalAmount,
        showProductDialog,
        selectedProduct,
        availableBatches,
        showSummaryDialog,
        summaryData,
        pendingAction,
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
        handleSelectProduct,
        handleAddProductsFromDialog,
        handleQuantityChange,
        handleQuantityInputChange,
        handlePriceChange,
        handleDeleteProduct,
        handleShowSummary,
        handleSaveDraft,
        handleComplete,
        handleCancel,
        handleConfirmSummary,
        handleCloseSummary,
        handleSelectProductInDialog,
        handleSelectBatches,
    };
};