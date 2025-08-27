import {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import saleTransactionService from '../services/saleTransactionService';
import {userService} from '../services/userService';
import {getCategories} from '../services/categoryService';
import {getZones} from '../services/zoneService';
import {isValidValue} from '../utils/formatters';

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

export const useEditSaleTransaction = (transactionId) => {
    const navigate = useNavigate();

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
                const categoriesRes = await getCategories();
                setCategories(categoriesRes || []);
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
    }, [selectedStore]);

    const totalAmount = (selectedProducts || []).reduce((sum, p) => sum + (p.total || ((p.price || 0) * ((p.unit === 'khay' ? (p.quantity || 0) * 30 : (p.quantity || 0))))), 0);

    // Product handlers
    const handleSelectProduct = useCallback((product, options = {}) => {
        console.log('handleSelectProduct - input product:', product);
        
        // Đảm bảo id luôn là số hợp lệ
        const validId = (/^\d+$/.test(String(product.id))) ? Number(product.id) : (product.batchId || product.batch?.id || Date.now());
        // Đảm bảo proId luôn có giá trị
        const validProId = product.proId || product.productId || product.batchId || product.id || validId;
        
        const newProduct = {
            id: validId,
            proId: validProId,
            productName: product.productName || product.name,
            productCode: product.productCode || product.code,
            batchName: product.batchName || product.batch?.name || product.name,
            batchId: product.batchId || product.batch?.id || product.id,
            quantity: options.quantity || 1,
            price: product.unitSalePrice || product.price || 0,
            unit: options.unit || 'quả',
            remainQuantity: product.remainQuantity || 0,
            categoryId: product.categoryId,
            categoryName: product.categoryName || product.category?.name,
            storeId: product.storeId,
            storeName: product.storeName,
            createAt: product.createAt || product.createDate,
            zoneReal: product.zoneReal || product.zone?.name,
        };

        setSelectedProducts(prev => {
            const existingIndex = (prev || []).findIndex(p => p.proId === validProId);
            if (existingIndex >= 0) {
                const updated = [...(prev || [])];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: (updated[existingIndex].quantity || 0) + (options.quantity || 1)
                };
                return updated;
            }
            return [...(prev || []), newProduct];
        });
    }, []);

    const handleAddProductsFromDialog = useCallback((products, options = {}) => {
        (products || []).forEach(product => handleSelectProduct(product, options));
        setShowProductDialog(false);
    }, [handleSelectProduct]);

    const handleQuantityChange = useCallback((productId, change) => {
        setSelectedProducts(prev => prev.map(product => {
            if (String(product.id) !== String(productId)) return product;
            
            const currentQty = product.quantity || 1;
            const newQty = Math.max(1, currentQty + change);
            const unit = product.unit || 'quả';
            const price = product.price || 0;
            
            // Kiểm tra số lượng không vượt quá tồn kho
            const maxQuantity = unit === 'khay' ? Math.floor((product.remainQuantity || 0) / 30) : (product.remainQuantity || 0);
            if (newQty > maxQuantity) {
                // Nếu vượt quá, giữ nguyên số lượng cũ và hiển thị thông báo
                setError(`Số lượng không thể vượt quá tồn kho hiện có: ${maxQuantity} ${unit}`);
                return product;
            }
            
            // Xóa thông báo lỗi nếu thành công
            setError(null);
            return { ...product, quantity: newQty };
        }));
    }, []);

    const handleQuantityInputChange = useCallback((productId, newQuantity) => {
        setSelectedProducts(prev => prev.map(product => {
            if (String(product.id) !== String(productId)) return product;
            
            const newQty = Math.max(1, parseInt(newQuantity) || 1);
            const unit = product.unit || 'quả';
            const price = product.price || 0;
            
            // Kiểm tra số lượng không vượt quá tồn kho
            const maxQuantity = unit === 'khay' ? Math.floor((product.remainQuantity || 0) / 30) : (product.remainQuantity || 0);
            if (newQty > maxQuantity) {
                // Nếu vượt quá, giữ nguyên số lượng cũ và hiển thị thông báo
                setError(`Số lượng không thể vượt quá tồn kho hiện có: ${maxQuantity} ${unit}`);
                return product;
            }
            
            // Xóa thông báo lỗi nếu thành công
            setError(null);
            return { ...product, quantity: newQty };
        }));
    }, []);

    const handlePriceChange = useCallback((productId, newPrice) => {
        setSelectedProducts(prev => prev.map(product => {
            if (String(product.id) !== String(productId)) return product;
            const unit = product.unit || 'quả';
            const qty = product.quantity || 1;
            const total = (newPrice || 0) * (unit === 'khay' ? qty * 30 : qty);
            return { ...product, price: Math.max(0, parseFloat(newPrice) || 0), total };
        }));
    }, []);

    const handleUnitChange = useCallback((productId, newUnit) => {
        setSelectedProducts(prev => prev.map(product => {
            if (String(product.id) !== String(productId)) return product;
            
            const unit = newUnit;
            const qty = product.quantity || 1;
            const price = product.price || 0;
            
            // Kiểm tra số lượng không vượt quá tồn kho khi thay đổi đơn vị
            const maxQuantity = unit === 'khay' ? Math.floor((product.remainQuantity || 0) / 30) : (product.remainQuantity || 0);
            if (qty > maxQuantity) {
                // Nếu vượt quá, giữ nguyên đơn vị cũ và hiển thị thông báo
                setError(`Số lượng hiện tại không thể chuyển sang ${unit}. Tối đa: ${maxQuantity} ${unit}`);
                return product;
            }
            
            // Xóa thông báo lỗi nếu thành công
            setError(null);
            const total = price * (unit === 'khay' ? qty * 30 : qty);
            return { ...product, unit: newUnit, total };
        }));
    }, []);

    const handleDeleteProduct = useCallback((productId) => {
        setSelectedProducts(prev => prev.filter(product => String(product.id) !== String(productId)));
    }, []);

    const handleShowSummary = useCallback((action) => {
        // Debug: kiểm tra selectedProducts trước khi gửi
        console.log('=== DEBUG: selectedProducts before sending ===');
        selectedProducts.forEach((product, idx) => {
            console.log(`Product ${idx}:`, {
                id: product.id,
                proId: product.proId,
                batchId: product.batchId,
                batchName: product.batchName,
                productName: product.productName,
                quantity: product.quantity,
                price: product.price
            });
        });
        console.log('=== END DEBUG ===');
        
        setPendingAction(action);
        setSummaryData({
            customer: customers.find(c => String(c.id) === String(selectedCustomer)) || null,
            store: stores.find(s => String(s.id) === String(selectedStore)) || null,
            products: (selectedProducts || []).map(p => ({
                ...p,
                name: p.productName || p.name || p.batchName || 'Sản phẩm',
                unitSalePrice: p.price || p.unitSalePrice || 0,
                zoneReal: p.zoneReal || null, // Đảm bảo zoneReal được truyền
            })),
            totalAmount: totalAmount,
            paidAmount: paidAmount,
            note: note,
            saleDate: saleDate || new Date().toISOString(),
        });
        setShowSummaryDialog(true);
    }, [selectedCustomer, selectedStore, selectedProducts, totalAmount, paidAmount, note, saleDate, customers, stores]);

    const handleSaveDraft = useCallback(async () => {
        if (!selectedCustomer || !selectedStore || !selectedProducts || selectedProducts.length === 0) {
            throw new Error('Vui lòng điền đầy đủ thông tin');
        }

        try {
            setLoading(true);
            setError(null);

            const updateData = {
                customerId: selectedCustomer,
                storeId: selectedStore,
                saleDate: saleDate || new Date(),
                saleTransactionNote: note,
                paidAmount: paidAmount,
                totalAmount: totalAmount,
                status: 'DRAFT',
                detail: (selectedProducts || []).map(item => {
                    // Validation: đảm bảo batchId không null
                    if (!item.batchId) {
                        console.error('Product missing batchId:', item);
                        throw new Error(`Sản phẩm "${item.productName}" thiếu thông tin batch. Vui lòng thêm lại sản phẩm này.`);
                    }
                    
                    const mapped = {
                        id: item.batchId, // ID của ImportTransactionDetail (batch)
                        proId: item.proId, // ID của Product
                        productName: item.productName,
                        productCode: item.productCode,
                        remainQuantity: item.remainQuantity,
                        quantity: item.quantity,
                        unitSalePrice: item.price || item.unitSalePrice || 0,
                        categoryName: item.categoryName,
                        storeName: item.storeName,
                        createAt: item.createAt,
                        name: item.batchName, // mã lô hàng
                        batchCode: item.batchName,
                        zoneReal: item.zoneReal,
                    };
                    console.log('Sending product detail:', mapped);
                    return mapped;
                }),
            };

            console.log('Sending updateData:', updateData);

            await saleTransactionService.update(transactionId, updateData);
            setSuccess('Đã cập nhật phiếu bán hàng thành công!');
            localStorage.setItem('saleSuccessMessage', 'Đã cập nhật phiếu bán hàng thành công!');
            
            // Reset form
            setSelectedProducts([]);
            setSelectedCustomer('');
            setSelectedStore('');
            setPaidAmount(0);
            setNote('');
            
            return true;
        } catch (err) {
            console.error('Error updating sale transaction:', err);
            setError(`Không thể cập nhật phiếu bán hàng: ${err.response?.data?.message || err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    }, [transactionId, selectedCustomer, selectedStore, selectedProducts, paidAmount, note, saleDate, totalAmount]);

    const handleComplete = useCallback(async () => {
        if (!selectedCustomer || !selectedStore || !selectedProducts || selectedProducts.length === 0) {
            throw new Error('Vui lòng điền đầy đủ thông tin');
        }

        try {
            setLoading(true);
            setError(null);

            const updateData = {
                customerId: selectedCustomer,
                storeId: selectedStore,
                saleDate: saleDate || new Date(),
                saleTransactionNote: note,
                paidAmount: paidAmount,
                totalAmount: totalAmount,
                status: 'COMPLETE',
                detail: (selectedProducts || []).map(item => {
                    // Validation: đảm bảo batchId không null
                    if (!item.batchId) {
                        console.error('Product missing batchId (complete):', item);
                        throw new Error(`Sản phẩm "${item.productName}" thiếu thông tin batch. Vui lòng thêm lại sản phẩm này.`);
                    }
                    
                    const mapped = {
                        id: item.batchId, // ID của ImportTransactionDetail (batch)
                        proId: item.proId, // ID của Product
                        productName: item.productName,
                        productCode: item.productCode,
                        remainQuantity: item.remainQuantity,
                        quantity: item.quantity,
                        unitSalePrice: item.price || item.unitSalePrice || 0,
                        categoryName: item.categoryName,
                        storeName: item.storeName,
                        createAt: item.createAt,
                        name: item.batchName, // mã lô hàng
                        batchCode: item.batchName,
                        zoneReal: item.zoneReal,
                    };
                    console.log('Sending product detail (complete):', mapped);
                    return mapped;
                }),
            };

            console.log('Sending updateData (complete):', updateData);

            await saleTransactionService.update(transactionId, updateData);
            setSuccess('Đã hoàn thành phiếu bán hàng!');
            localStorage.setItem('saleSuccessMessage', 'Đã hoàn thành phiếu bán hàng!');
            
            // Reset form
            setSelectedProducts([]);
            setSelectedCustomer('');
            setSelectedStore('');
            setPaidAmount(0);
            setNote('');
            
            return true;
        } catch (err) {
            console.error('Error completing sale transaction:', err);
            setError(`Không thể hoàn thành phiếu bán hàng: ${err.response?.data?.message || err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    }, [transactionId, selectedCustomer, selectedStore, selectedProducts, paidAmount, note, saleDate, totalAmount]);

    const handleCancel = useCallback(() => {
        navigate('/sale');
    }, [navigate]);

    const handleConfirmSummary = useCallback(async () => {
        if (!pendingAction || !summaryData) return false;
        
        try {
            if (pendingAction === 'DRAFT') {
                return await handleSaveDraft();
            } else if (pendingAction === 'COMPLETE') {
                return await handleComplete();
            }
            return false;
        } catch (error) {
            console.error('Error in handleConfirmSummary:', error);
            return false;
        }
    }, [pendingAction, summaryData, handleSaveDraft, handleComplete]);

    const handleCloseSummary = useCallback(() => {
        setShowSummaryDialog(false);
    }, []);

    const handleSelectProductInDialog = useCallback((product) => {
        setSelectedProduct(product);
        if (product.batches && product.batches.length > 0) {
            setAvailableBatches(product.batches);
        }
    }, []);

    const handleSelectBatches = useCallback((selectedBatches) => {
        (selectedBatches || []).forEach(batch => {
            handleSelectProduct({
                ...batch,
                productName: batch.productName || batch.name,
                productCode: batch.productCode || batch.code,
            });
        });
    }, [handleSelectProduct]);

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
        handleUnitChange,
        handleDeleteProduct,
        handleShowSummary,
        handleSaveDraft,
        handleComplete,
        handleCancel,
        handleConfirmSummary,
        handleCloseSummary,
        handleSelectProductInDialog,
        handleSelectBatches,
        isValidValue,
    };
};
