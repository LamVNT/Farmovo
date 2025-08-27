import React, {useState, useEffect, useRef, useMemo, useCallback, startTransition} from 'react';
import {
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    InputAdornment,
    IconButton,
    Tooltip,
    Menu,
    FormControlLabel as MuiFormControlLabel,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
} from '@mui/material';
import {FaLock, FaCheck, FaSearch, FaEye} from 'react-icons/fa';
import {MdKeyboardArrowDown, MdCategory} from 'react-icons/md';
import {FiPlus} from 'react-icons/fi';
import {DataGrid} from '@mui/x-data-grid';
import {FaRegTrashCan} from "react-icons/fa6";
import {format} from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';

// Components
import SaleProductDialog from '../../components/sale-transaction/SaleProductDialog';
import SaleSidebar from '../../components/sale-transaction/SaleSidebar';
import SaleSummaryDialog from '../../components/sale-transaction/SaleSummaryDialog';

// Hooks
import {useEditSaleTransaction} from '../../hooks/useEditSaleTransaction';

// Utils
import {formatCurrency, isValidValue} from '../../utils/formatters';
import saleTransactionService from '../../services/saleTransactionService';

const EditSalePage = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Lấy ID từ URL params
    const searchRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [batches, setBatches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBatches, setFilteredBatches] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [dataGridKey, setDataGridKey] = useState(0);
    const [nextCode, setNextCode] = useState('');
    const [unit, setUnit] = useState('quả');
    const [paidAmountInput, setPaidAmountInput] = useState('0');
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng': true,
        'Đơn giá': true,
        'Thành tiền': true,
    });
    const [highlightCustomer, setHighlightCustomer] = useState(false);
    const [highlightStore, setHighlightStore] = useState(false);
    const [highlightProducts, setHighlightProducts] = useState(false);
    const [invalidProductIds, setInvalidProductIds] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [showBackConfirm, setShowBackConfirm] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [shouldSaveTemp, setShouldSaveTemp] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);
    const [loadingTransaction, setLoadingTransaction] = useState(true);

    // Thêm state để theo dõi thay đổi như trang import
    const [originalData, setOriginalData] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    const {
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
    } = useEditSaleTransaction(id);

    // Load transaction data for editing
    useEffect(() => {
        const loadTransaction = async () => {
            if (!id) return;
            
            try {
                setLoadingTransaction(true);
                const transaction = await saleTransactionService.getById(id);
                
                // Kiểm tra trạng thái - chỉ cho phép edit khi là DRAFT
                if (transaction.status !== 'DRAFT') {
                    setError('Chỉ có thể chỉnh sửa phiếu bán hàng có trạng thái nháp');
                    navigate('/sale');
                    return;
                }

                // Set transaction data
                setNextCode(transaction.name || '');
                setSelectedCustomer(transaction.customerId || '');
                setSelectedStore(transaction.storeId || '');
                setSaleDate(transaction.saleDate ? new Date(transaction.saleDate) : new Date());
                setNote(transaction.saleTransactionNote || '');
                setPaidAmount(transaction.paidAmount || 0);
                setPaidAmountInput((transaction.paidAmount || 0).toString());

                // Set products
                if (transaction.detail) {
                    let details = [];
                    if (typeof transaction.detail === 'string') {
                        try {
                            details = JSON.parse(transaction.detail);
                        } catch (e) {
                            console.error('Error parsing transaction detail:', e);
                        }
                    } else {
                        details = transaction.detail;
                    }

                    console.log('Transaction detail raw:', transaction.detail);
                    console.log('Parsed details:', details);

                    // Map detail to selectedProducts format
                    const mappedProducts = details.map((item, idx) => {
                        // Tìm batchId từ nhiều nguồn khác nhau
                        const batchId = item.id || item.batchId || item.batch?.id;
                        const productId = item.productId || item.proId || item.id;
                        
                        const mapped = {
                            id: batchId || `temp_${idx}_${Date.now()}`,
                            proId: productId,
                            productName: item.productName || item.name,
                            batchName: item.batchName || item.batch?.name || item.name,
                            batchId: batchId, // Sử dụng batchId đã tìm được
                            quantity: item.quantity || 0,
                            price: item.unitSalePrice || item.price || 0,
                            unit: item.unit || 'quả',
                            total: item.total || 0,
                            remainQuantity: item.remainQuantity || 0,
                            categoryId: item.categoryId,
                            categoryName: item.categoryName,
                            storeId: item.storeId,
                            storeName: item.storeName,
                        };
                        console.log(`Mapped product ${idx}:`, mapped);
                        console.log(`Original item ${idx}:`, item);
                        return mapped;
                    });

                    setSelectedProducts(mappedProducts);
                }

                setLoadingTransaction(false);
            } catch (error) {
                console.error('Error loading transaction:', error);
                setError('Không thể tải thông tin phiếu bán hàng');
                setLoadingTransaction(false);
            }
        };

        loadTransaction();
    }, [id]);

    // Set originalData sau khi customers và stores đã được load
    useEffect(() => {
        if (customers.length > 0 && stores.length > 0 && !originalData && selectedCustomer && selectedStore) {
            // Tìm transaction data từ selectedCustomer và selectedStore
            const transactionData = {
                customerId: selectedCustomer,
                storeId: selectedStore,
                saleTransactionNote: note,
                paidAmount: paidAmount,
                detail: selectedProducts.map(product => ({
                    productId: product.proId,
                    quantity: product.quantity,
                    unitSalePrice: product.price,
                    total: product.total,
                    batchId: product.batchId,
                })),
            };
            
            setOriginalData(transactionData);
        }
    }, [customers, stores, selectedCustomer, selectedStore, note, paidAmount, selectedProducts, originalData]);

    useEffect(() => {
        if (selectedProducts.length > 0) {
            setSelectedProducts(prev => prev.map(p => ({...p, unit})));
        }
    }, [unit]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setFilteredBatches([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setDataGridKey(prev => prev + 1);
    }, [selectedProducts]);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const data = await saleTransactionService.getCreateFormData();
                setBatches(data.products || []);
            } catch (error) {
                setError('Không thể tải danh sách lô hàng');
            }
        };
        fetchBatches();
    }, []);

    useEffect(() => {
        const fetchNext = async () => {
            try {
                const pb = await saleTransactionService.getNextCode?.();
                setNextCode(pb || '');
            } catch (e) {
                setNextCode('');
            }
        };
        fetchNext();
    }, []);

    // Theo dõi thay đổi để so sánh với dữ liệu gốc
    useEffect(() => {
        if (originalData && originalData.customerId && originalData.storeId) {
            const currentData = {
                customerId: selectedCustomer,
                storeId: selectedStore,
                saleTransactionNote: note,
                paidAmount: paidAmount,
                detail: selectedProducts.map(product => ({
                    productId: product.proId,
                    quantity: product.quantity,
                    unitSalePrice: product.price,
                    total: product.total,
                    batchId: product.batchId,
                })),
            };

            const originalDataForCompare = {
                customerId: originalData.customerId,
                storeId: originalData.storeId,
                saleTransactionNote: originalData.saleTransactionNote,
                paidAmount: originalData.paidAmount,
                detail: originalData.detail?.map(detail => ({
                    productId: detail.productId || detail.proId,
                    quantity: detail.quantity,
                    unitSalePrice: detail.unitSalePrice || detail.price,
                    total: detail.total,
                    batchId: detail.batchId,
                })),
            };

            const hasDataChanged = JSON.stringify(currentData) !== JSON.stringify(originalDataForCompare);
            
            console.log('=== DEBUG: useEffect comparison ===');
            console.log('currentData:', currentData);
            console.log('originalDataForCompare:', originalDataForCompare);
            console.log('hasDataChanged:', hasDataChanged);
            console.log('originalData.customerId:', originalData.customerId);
            console.log('originalData.storeId:', originalData.storeId);
            
            setHasChanges(hasDataChanged);
            // Chỉ set hasUnsavedChanges = true khi thực sự có thay đổi và đã load đủ dữ liệu
            setHasUnsavedChanges(hasDataChanged && originalData.customerId && originalData.storeId);
            
            console.log('=== END DEBUG ===');
        }
    }, [selectedCustomer, selectedStore, note, paidAmount, selectedProducts, originalData]);

    // Force reset hasUnsavedChanges khi đã lưu thành công
    useEffect(() => {
        if (!hasChanges && hasUnsavedChanges) {
            console.log('=== DEBUG: Force reset hasUnsavedChanges ===');
            console.log('hasChanges:', hasChanges);
            console.log('hasUnsavedChanges:', hasUnsavedChanges);
            setHasUnsavedChanges(false);
        }
    }, [hasChanges, hasUnsavedChanges]);

    // Bắt sự kiện browser back button và beforeunload
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (event) => {
            if (!showBackConfirm && !isNavigatingAway) {
                event.preventDefault();
                event.returnValue = '';
                return '';
            }
        };

        const handlePopState = (event) => {
            if (!showBackConfirm && !isNavigatingAway) {
                event.preventDefault();
                setShowBackConfirm(true);
                window.history.pushState(null, '', window.location.pathname);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        
        window.history.pushState(null, '', window.location.pathname);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [hasUnsavedChanges, showBackConfirm, isNavigatingAway]);

    // Bắt sự kiện click vào sidebar navigation
    useEffect(() => {
        if (!hasUnsavedChanges || showBackConfirm) return;

        const handleSidebarClick = (event) => {
            const sidebarLink = event.target.closest('a[href]');
            const isSidebarClick = sidebarLink || 
                                  event.target.closest('[data-testid*="sidebar"]') ||
                                  event.target.closest('.sidebar') ||
                                  event.target.closest('nav');
            
            if (isSidebarClick) {
                event.preventDefault();
                event.stopPropagation();
                
                if (sidebarLink?.href) {
                    setPendingNavigation(sidebarLink.href);
                }
                
                setShowBackConfirm(true);
                return false;
            }
        };

        document.addEventListener('click', handleSidebarClick, true);
        
        return () => {
            document.removeEventListener('click', handleSidebarClick, true);
        };
    }, [hasUnsavedChanges, showBackConfirm]);

    // Xử lý các hàm
    const handleBack = () => {
        if (hasUnsavedChanges) {
            setShowBackConfirm(true);
        } else {
            navigate('/sale');
        }
    };

    const handleCancelBack = () => {
        setShowBackConfirm(false);
    };

    const handleConfirmBack = () => {
        setIsNavigatingAway(true);
        navigate('/sale');
    };

    const handleSaveAndBack = async () => {
        try {
            await handleSaveDraft();
            setIsNavigatingAway(true);
            navigate('/sale');
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    };

    // Thêm hàm xử lý lưu với xác nhận
    const handleSave = async () => {
        // Validate required fields
        if (!selectedCustomer) {
            setError('Vui lòng chọn khách hàng');
            setHighlightCustomer(true);
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            setHighlightProducts(true);
            return;
        }

        // Validate product data
        const invalidProducts = selectedProducts.filter(product => 
            !product.quantity || product.quantity <= 0 || 
            !product.price || product.price <= 0
        );

        if (invalidProducts.length > 0) {
            setError('Vui lòng kiểm tra lại số lượng và đơn giá của các sản phẩm');
            setHighlightProducts(true);
            return;
        }

        // Hiển thị summary dialog với action mặc định là DRAFT
        await handleShowSummary('DRAFT');
    };

    // Thêm hàm xử lý lưu tạm thời trực tiếp
    const handleSaveDraftDirect = async () => {
        try {
            await handleSaveDraft();
            // Cập nhật lại originalData sau khi lưu thành công
            const updatedTransaction = await saleTransactionService.getById(id);
            setOriginalData(updatedTransaction);
            setHasChanges(false);
            setHasUnsavedChanges(false); // Reset unsaved changes
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') {
            setFilteredBatches([]);
        } else {
            const storeFilteredBatches = batches.filter(batch => {
                if (!selectedStore) return false;
                const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
                if (!selectedStoreData) return false;
                return batch.storeName === selectedStoreData.storeName || batch.storeName === selectedStoreData.name;
            });
            const results = storeFilteredBatches.filter(
                (b) =>
                    (b.batchCode && b.batchCode.toLowerCase().includes(value.toLowerCase())) ||
                    (b.productName && b.productName.toLowerCase().includes(value.toLowerCase()))
            );
            setFilteredBatches(results);
        }
    };

    const handleSelectBatch = (batch) => {
        const existingProduct = selectedProducts.find(p => p.batchId === batch.id);
        
        if (existingProduct) {
            setSelectedProducts(prev => prev.map(p => 
                p.batchId === batch.id 
                    ? { ...p, quantity: (p.quantity || 0) + 1 }
                    : p
            ));
        } else {
            const newProduct = {
                id: Date.now(),
                proId: batch.productId,
                productName: batch.productName,
                batchName: batch.name,
                batchId: batch.id,
                quantity: 1,
                price: batch.unitSalePrice || 0,
                unit: unit,
                remainQuantity: batch.remainQuantity,
                categoryId: batch.categoryId,
                categoryName: batch.categoryName,
                storeId: batch.storeId,
                storeName: batch.storeName,
            };
            setSelectedProducts(prev => [...prev, newProduct]);
        }
        
        setSearchTerm('');
        setFilteredBatches([]);
    };

    const handleOpenProductDialog = () => {
        // Kiểm tra xem đã chọn store chưa (đối với ADMIN/MANAGER)
        const isAdminOrManager = currentUser?.roles?.includes("ADMIN") || currentUser?.roles?.includes("MANAGER") || 
                                currentUser?.roles?.includes("ROLE_ADMIN") || currentUser?.roles?.includes("ROLE_MANAGER");
        
        if (isAdminOrManager && !selectedStore) {
            setError('Vui lòng chọn cửa hàng trước khi thêm sản phẩm');
            setHighlightStore(true);
            return;
        }
        
        setShowProductDialog(true);
    };

    const handleCloseCategoryDialog = () => {
        setShowCategoryDialog(false);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        const categoryProducts = products.filter(p => {
            const categoryMatch = p.categoryId === category.id || p.category?.id === category.id;
            if (!categoryMatch) return false;
            if (!selectedStore) return false;
            const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
            if (!selectedStoreData) return false;
            return p.storeName === selectedStoreData.storeName || p.storeName === selectedStoreData.name;
        });
        setCategoryProducts(categoryProducts);
    };

    const handleSelectCategoryProduct = (product) => {
        const existingProduct = selectedProducts.find(p => p.proId === product.id);
        
        if (existingProduct) {
            setSelectedProducts(prev => prev.map(p => 
                p.proId === product.id 
                    ? { ...p, quantity: (p.quantity || 0) + 1 }
                    : p
            ));
        } else {
            const newProduct = {
                id: Date.now(),
                proId: product.id,
                productName: product.productName,
                batchName: product.batchName,
                batchId: product.batchId,
                quantity: 1,
                price: product.unitSalePrice || 0,
                unit: unit,
                remainQuantity: product.remainQuantity,
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                storeId: product.storeId,
                storeName: product.storeName,
            };
            setSelectedProducts(prev => [...prev, newProduct]);
        }
        
        setShowCategoryDialog(false);
    };

    const toggleColumn = (col) => {
        setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const openSummaryAfterValidate = (action) => {
        let missing = false;
        if (!selectedCustomer) {
            setError('Vui lòng chọn khách hàng');
            setHighlightCustomer(true);
            missing = true;
        } else {
            setHighlightCustomer(false);
        }
        if (!selectedStore) {
            setError('Vui lòng chọn cửa hàng');
            setHighlightStore(true);
            missing = true;
        } else {
            setHighlightStore(false);
        }
        if (selectedProducts.length === 0) {
            setError('Vui lòng thêm ít nhất một sản phẩm');
            setHighlightProducts(true);
            missing = true;
        } else {
            setHighlightProducts(false);
        }
        if (missing) return;

        // Nếu có thay đổi và action là DRAFT, mở summary dialog
        if (action === 'DRAFT') {
            setPendingAction(action);
            setShowSummaryDialog(true);
            return;
        }

        setPendingAction(action);
        setShowSummaryDialog(true);
    };

    // Columns cho DataGrid
    const columns = useMemo(() => [
        columnVisibility['STT'] && {
            field: 'stt',
            headerName: 'STT',
            width: 80,
            renderCell: (params) => {
                return (
                    <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                    }}>
                        {params.value}
                    </div>
                );
            },
        },

        columnVisibility['Tên hàng'] && { 
            field: 'name', 
            headerName: 'Tên hàng', 
            width: 150, 
            minWidth: 150,
            renderCell: (params) => {
                // Lấy tên sản phẩm từ nhiều nguồn có thể
                const productName = params.row.productName || 
                                  params.row.name || 
                                  params.row.batch?.productName || 
                                  'Sản phẩm';
                
                return (
                    <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        padding: '0 8px'
                    }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                            {productName}
                        </div>
                    </div>
                );
            }
        },

        columnVisibility['ĐVT'] && { 
            field: 'unit', 
            headerName: 'ĐVT', 
            width: 120,
            renderCell: (params) => (
                <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                }}>
                    <Select
                        size="small"
                        value={params.row.unit || 'quả'}
                        onChange={(e) => handleUnitChange(params.row.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        sx={{
                            width: '80px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            '& .MuiSelect-select': {
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'transparent',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1976d2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1976d2',
                            },
                        }}
                    >
                        <MenuItem value="quả" sx={{ fontSize: '0.875rem', fontWeight: '500' }}>quả</MenuItem>
                        <MenuItem value="khay" sx={{ fontSize: '0.875rem', fontWeight: '500' }}>khay</MenuItem>
                    </Select>
                </div>
            )
        },

        columnVisibility['Số lượng'] && {
            field: 'quantity',
            headerName: 'Số lượng',
            width: 150,
            renderCell: (params) => (
                <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    height: '100%', 
                    gap: '4px'
                }}>
                    <button 
                        onClick={e => { e.stopPropagation(); handleQuantityChange(params.row.id, -1); }} 
                        style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#e5e7eb',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            lineHeight: 1
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                    >
                        –
                    </button>
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.quantity || 1}
                        onChange={(e) => handleQuantityInputChange(params.row.id, Number(e.target.value) || 1)}
                        onClick={e => e.stopPropagation()}
                        sx={{
                            width: '60px',
                            '& .MuiInputBase-input': {
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                textAlign: 'center',
                                padding: '8px 4px',
                                lineHeight: 1.2
                            },
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                            '& .MuiInput-underline:hover:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                display: 'none',
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield',
                            }
                        }}
                    />
                    <button 
                        onClick={e => { e.stopPropagation(); handleQuantityChange(params.row.id, 1); }} 
                        style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#e5e7eb',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            lineHeight: 1
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                    >
                        +
                    </button>
                </div>
            )
        },

        columnVisibility['Đơn giá'] && {
            field: 'price',
            headerName: 'Đơn giá',
            renderHeader: () => (
                <span>
                    Đơn giá<span style={{ color: '#6b7280', fontSize: '0.875em' }}>/quả</span>
                </span>
            ),
            width: 150,
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => (
                <div style={{ 
                    display: 'flex',
                    justifyContent: 'center', 
                    height: '100%' 
                }}>
                    <TextField
                        size="small"
                        type="text"
                        variant="standard"
                        value={(params.row.price || 0).toLocaleString('vi-VN')}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '');
                            handlePriceChange(params.row.id, Number(value) || 0);
                        }}
                        onClick={e => e.stopPropagation()}
                        InputProps={{
                            endAdornment: <span style={{ 
                                color: '#6b7280', 
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}>VND</span>,
                        }}
                        sx={{
                            width: '100px',
                            '& .MuiInputBase-input': {
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                textAlign: 'center',
                                padding: '8px 4px',
                                lineHeight: 1.2
                            },
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                            '& .MuiInput-underline:hover:before': {
                                borderBottomColor: 'transparent',
                            },
                        }}
                    />
                </div>
            ),
        },

        columnVisibility['Thành tiền'] && {
            field: 'total',
            headerName: 'Thành tiền',
            width: 150,
            valueGetter: (params) => {
                const row = params?.row ?? {};
                const price = parseFloat(row.price) || 0;
                const quantity = parseInt(row.quantity) || 0;
                const unit = row.unit || 'quả';
                
                const quantityInQua = unit === 'khay' ? quantity * 30 : quantity;
                return price * quantityInQua;
            },
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => {
                const price = parseFloat(params.row.price) || 0;
                const quantity = parseInt(params.row.quantity) || 0;
                const unit = params.row.unit || 'quả';
                
                const quantityInQua = unit === 'khay' ? quantity * 30 : quantity;
                const total = price * quantityInQua;
                return (
                    <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        textAlign: 'center'
                    }}>
                        {formatCurrency(total)}
                    </div>
                );
            },
        },

        {
            field: 'actions',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                }}>
                    <Tooltip title="Xóa">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); handleDeleteProduct(params.row.id); }}>
                            <FaRegTrashCan />
                        </IconButton>
                    </Tooltip>
                </div>
            ),
        },
    ].filter(Boolean), [columnVisibility, handleQuantityChange, handleQuantityInputChange, handlePriceChange, handleDeleteProduct]);

    // Lấy khách lẻ từ danh sách customers nếu có
    const khachLe = customers.find(c => c.name === 'Khách lẻ') || null;

    useEffect(() => {
        if (khachLe) {
            setSelectedCustomer(khachLe.id);
        }
    }, [khachLe]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (loadingTransaction || !selectedProducts) {
        return (
            <div className="flex w-full h-screen bg-gray-100 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin phiếu bán hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-screen bg-gray-100">
            {error && <Alert severity="error"
                             className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500"
                             onClose={() => setError(null)}
                             autoHideDuration={3000}>{error}</Alert>}
            {success && <Alert severity="success"
                               className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500"
                               onClose={() => setSuccess(null)}
                               autoHideDuration={3000}>{success}</Alert>}

            <div className="flex-1 p-4 bg-white rounded-md m-4 shadow-md overflow-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4 flex-1">
                        <Button
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBack}
                            sx={{
                                color: '#1976d2',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                textTransform: 'none',
                                padding: '8px 16px',
                                borderRadius: 2,
                                '&:hover': {
                                    backgroundColor: '#e3f0ff',
                                    color: '#1565c0'
                                }
                            }}
                        >
                            Chỉnh sửa phiếu bán hàng
                        </Button>
                        
                        <div ref={searchRef} className="relative flex-1 max-w-2xl flex items-center gap-3">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Tìm lô hàng theo mã hoặc tên sản phẩm"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => {
                                const isAdminOrManager = currentUser?.roles?.includes("ADMIN") || currentUser?.roles?.includes("MANAGER") || 
                                                        currentUser?.roles?.includes("ROLE_ADMIN") || currentUser?.roles?.includes("ROLE_MANAGER");
                                
                                if (isAdminOrManager && !selectedStore) {
                                    setError('Vui lòng chọn cửa hàng trước khi tìm kiếm sản phẩm');
                                    setHighlightStore(true);
                                    return;
                                }
                                
                                setIsSearchFocused(true);
                            }}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FaSearch className="text-gray-500" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                background: '#fff',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    boxShadow: 'none',
                                    '& fieldset': {
                                        borderColor: '#bcd0ee',
                                        borderWidth: 2,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#1976d2',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#1976d2',
                                        boxShadow: '0 0 0 2px #e3f0ff',
                                    },
                                },
                                '& input': {
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                },
                            }}
                        />

                        <Tooltip title="Thêm sản phẩm">
                            <IconButton 
                                onClick={handleOpenProductDialog}
                                sx={{
                                    color: '#1976d2',
                                    backgroundColor: '#f8f9fa',
                                    '&:hover': {
                                        backgroundColor: '#e3f0ff',
                                        transform: 'scale(1.05)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <FiPlus/>
                            </IconButton>
                        </Tooltip>
                        {filteredBatches.length > 0 && isSearchFocused && (
                            <div
                                className="absolute top-full mt-1 left-0 z-10 bg-white shadow-lg rounded-xl w-full max-h-96 overflow-y-auto text-sm"
                                style={{boxShadow: '0 8px 32px 0 rgba(25, 118, 210, 0.10)'}}>
                                {filteredBatches.map((batch, index) => {
                                    const remainKhay = unit === 'khay' ? Math.floor(batch.remainQuantity / 30) : batch.remainQuantity;
                                    const price = batch.unitSalePrice || 0;
                                    if (unit === 'khay' && remainKhay < 1) return null;
                                    const importDate = batch.createAt ? format(new Date(batch.createAt), 'dd/MM/yyyy') : 'N/A';
                                    const expireDate = batch.expireDate ? format(new Date(batch.expireDate), 'dd/MM/yyyy') : 'N/A';
                                    return (
                                        <div
                                            key={batch.id || index}
                                            onClick={() => handleSelectBatch(batch)}
                                            className={`px-4 py-3 cursor-pointer flex flex-col transition-all duration-150 hover:bg-blue-50 ${index === filteredBatches.length - 1 ? 'rounded-b-xl' : ''} ${index === 0 ? 'rounded-t-xl' : ''}`}
                                            style={{borderBottom: index === filteredBatches.length - 1 ? 'none' : '1px solid #f1f1f1'}}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-blue-800">Lô {batch.name}</span>
                                                <span className="font-bold text-gray-900">{batch.productName}</span>
                                            </div>
                                            <div
                                                className="grid grid-cols-4 gap-px text-[12px] text-gray-600 mt-1 w-full"
                                                style={{alignItems: 'center', paddingTop: 2, paddingBottom: 2}}>
                                                <span className="col-span-1">Số lượng còn: <span
                                                    className="font-bold text-gray-900">{remainKhay}</span> {unit}</span>
                                                <span className="col-span-1">Giá: <span
                                                    className="font-bold text-green-700">{formatCurrency(price)}/quả</span></span>
                                                <span className="col-span-1">Ngày nhập: <span
                                                    className="font-bold text-indigo-700">{importDate}</span></span>
                                                <span className="col-span-1">Hạn: <span
                                                    className="font-bold text-red-700">{expireDate}</span></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <div className="ml-auto">
                        <Tooltip title="Ẩn/hiện cột hiển thị">
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                                <FaEye/>
                            </IconButton>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                            {Object.entries(columnVisibility).map(([col, visible]) => (
                                <MenuItem key={col} dense>
                                    <MuiFormControlLabel
                                        control={<Checkbox checked={visible} onChange={() => toggleColumn(col)}/>}
                                        label={col}
                                    />
                                </MenuItem>
                            ))}
                        </Menu>
                    </div>
                </div>
                <div style={{ height: 400, width: '100%' }}>
                    {isClient && selectedProducts ? (
                        <DataGrid
                            key={dataGridKey}
                            rows={(selectedProducts || []).map((row, idx) => ({
                                ...row,
                                stt: idx + 1,
                                id: row.id || row.batchId || `temp_${idx}_${Date.now()}` // Đảm bảo id duy nhất (DataGrid key)
                            }))}
                            columns={columns}
                            pageSize={5}
                            rowsPerPageOptions={[5]}
                            disableSelectionOnClick
                            getRowId={(row) => row.id}
                            sx={{
                                ...(highlightProducts ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 4, background: '#fff6f6' } : {}),
                                '& .MuiDataGrid-cell': {
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    borderBottom: '1px solid #e0e0e0',
                                    padding: '8px 4px'
                                },
                                '& .MuiDataGrid-columnHeader': {
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    backgroundColor: '#f8f9fa',
                                    borderBottom: '2px solid #dee2e6'
                                },
                                '& .MuiDataGrid-row': {
                                    minHeight: '52px',
                                    '&:hover': {
                                        backgroundColor: '#f8f9fa'
                                    }
                                }
                            }}
                            componentsProps={{
                                basePopper: {
                                    sx: {
                                        '& .MuiDataGrid-panel': {
                                            '& .MuiDataGrid-panelContent': {
                                                '& .MuiDataGrid-panelFooter': {
                                                    display: 'none'
                                                }
                                            }
                                        }
                                    }
                                }
                            }}
                            disableColumnMenu={false}
                            disableColumnFilter={false}
                            disableColumnSelector={false}
                            disableDensitySelector={false}
                            disableColumnReorder={true}
                            disableColumnResize={true}
                            disableExtendRowFullWidth={true}
                            disableIgnoreModificationsIfProcessingProps={true}
                            disableRowSelectionOnClick={true}
                            disableVirtualization={false}
                            hideFooter={false}
                            hideFooterPagination={false}
                            hideFooterSelectedRowCount={false}
                            loading={false}
                            rowHeight={52}
                            rowSpacingType="border"
                            showCellVerticalBorder={false}
                            showColumnVerticalBorder={false}
                            columnVisibilityModel={columnVisibility}
                            onColumnVisibilityModelChange={(newModel) => setColumnVisibility(newModel)}
                            getRowClassName={(params) => invalidProductIds.includes(params.row.id) ? 'row-error' : ''}
                        />
                    ) : (
                        <div style={{ 
                            height: 400, 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px'
                        }}>
                            <div>Loading...</div>
                        </div>
                    )}
                </div>
            </div>
            <SaleSidebar
                currentUser={currentUser}
                customers={customers}
                stores={stores}
                selectedCustomer={selectedCustomer}
                selectedStore={selectedStore}
                saleDate={saleDate}
                note={note}
                paidAmount={paidAmount}
                totalAmount={totalAmount}
                loading={loading}
                onCustomerChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setHighlightCustomer(false);
                }}
                onStoreChange={(e) => {
                    setSelectedStore(e.target.value);
                    setHighlightStore(false);
                }}
                onDateChange={(newValue) => setSaleDate(newValue)}
                onNoteChange={(e) => setNote(e.target.value)}
                onPaidAmountChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPaidAmount(Math.max(0, value));
                    setPaidAmountInput(e.target.value);
                }}
                onComplete={() => { openSummaryAfterValidate('COMPLETE'); }}
                onCancel={handleCancel}
                formatCurrency={formatCurrency}
                isValidValue={isValidValue}
                highlightCustomer={highlightCustomer}
                highlightStore={highlightStore}
                highlightProducts={highlightProducts}
                setCustomers={setCustomers}
                paidAmountInput={paidAmountInput}
                setPaidAmountInput={setPaidAmountInput}
                isBalanceStock={false}
                // Thêm props mới để hiển thị thông tin thay đổi
                originalData={originalData}
                hasChanges={hasChanges}
                onSave={handleSave}
                onSaveDraft={handleSaveDraftDirect}
                selectedProducts={selectedProducts}
            />
            <SaleProductDialog
                open={showProductDialog}
                onClose={() => setShowProductDialog(false)}
                products={products.filter(product => {
                    if (!selectedStore) return false;
                    const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
                    if (!selectedStoreData) return false;
                    return product.storeName === selectedStoreData.storeName || product.storeName === selectedStoreData.name;
                })}
                selectedProduct={selectedProduct}
                availableBatches={availableBatches}
                selectedBatchesForDialog={[]}
                onSelectProduct={handleSelectProductInDialog}
                onSelectBatches={handleSelectBatches}
                onAddProducts={handleAddProductsFromDialog}
                formatCurrency={formatCurrency}
            />
            <SaleSummaryDialog
                open={showSummaryDialog}
                onClose={handleCloseSummary}
                onConfirm={async () => {
                    try {
                        console.log('=== DEBUG: Before handleConfirmSummary ===');
                        console.log('hasUnsavedChanges:', hasUnsavedChanges);
                        console.log('hasChanges:', hasChanges);
                        
                        const ok = await handleConfirmSummary();
                        if (!ok) return;
                        
                        console.log('=== DEBUG: After handleConfirmSummary ===');
                        console.log('hasUnsavedChanges:', hasUnsavedChanges);
                        console.log('hasChanges:', hasChanges);
                        
                        // Reset unsaved changes trước khi chuyển hướng
                        setHasUnsavedChanges(false);
                        setHasChanges(false);
                        
                        console.log('=== DEBUG: After reset ===');
                        console.log('hasUnsavedChanges:', hasUnsavedChanges);
                        console.log('hasChanges:', hasChanges);
                        
                        // Sử dụng navigate thay vì window.location.href
                        navigate('/sale');
                    } finally {
                        setShowSummaryDialog(false);
                    }
                }}
                saleData={{
                    name: nextCode,
                    status: pendingAction,
                    customer: customers.find(c => String(c.id) === String(selectedCustomer)) || null,
                    store: stores.find(s => String(s.id) === String(selectedStore)) || null,
                    products: selectedProducts.map(p => ({
                        ...p,
                        price: p.price || p.unitSalePrice || 0,
                        zoneReal: p.zoneReal || null, // Đảm bảo zoneReal được truyền
                    })),
                    totalAmount: totalAmount,
                    paidAmount: paidAmount,
                    note: note,
                    saleDate: saleDate || new Date().toISOString(),
                }}
                formatCurrency={formatCurrency}
                loading={loading}
                currentUser={currentUser}
                nextCode={nextCode}
                zones={zones}
            />
            <Dialog
                open={showCategoryDialog}
                onClose={handleCloseCategoryDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle className="flex justify-between items-center">
                    <span>Thêm từ danh mục</span>
                    <IconButton onClick={handleCloseCategoryDialog} size="small">
                        <span>×</span>
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-3 text-gray-700">Danh mục sản phẩm</h3>
                            <div className="border rounded-lg max-h-80 overflow-y-auto">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleSelectCategory(category)}
                                        className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${selectedCategory?.id === category.id ? 'bg-blue-50 border-blue-200' : ''}`}
                                    >
                                        <div className="font-medium">{category.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {products.filter(p => {
                                                const categoryMatch = p.categoryId === category.id || p.category?.id === category.id;
                                                if (!categoryMatch) return false;
                                                if (!selectedStore) return false;
                                                const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
                                                if (!selectedStoreData) return false;
                                                return p.storeName === selectedStoreData.storeName || p.storeName === selectedStoreData.name;
                                            }).length} sản phẩm
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                                                onClick={() => handleSelectCategoryProduct(product)}
                                                className="p-3 cursor-pointer border-b hover:bg-gray-50"
                                            >
                                                <div className="font-medium">{product.productName}</div>
                                                <div className="text-sm text-gray-500">
                                                    Mã: {product.productCode} | Tồn: {product.remainQuantity} |
                                                    Giá: {formatCurrency(product.unitSalePrice)}
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
                    <Button onClick={handleCloseCategoryDialog} color="primary">
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog xác nhận khi có thay đổi chưa lưu */}
            <Dialog
                open={showBackConfirm}
                onClose={handleCancelBack}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <span className="text-orange-600 text-2xl">⚠️</span>
                    Xác nhận rời khỏi
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <div className="text-gray-700">
                        <div className="flex items-center gap-3 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="text-orange-600 text-2xl">⚠️</div>
                            <div>
                                <p className="font-semibold text-orange-800">Bạn có thay đổi chưa lưu</p>
                                <p className="text-sm text-orange-700">Nếu rời khỏi, tất cả thay đổi sẽ bị mất</p>
                            </div>
                        </div>
                        <p className="text-gray-600">
                            Bạn có chắc chắn muốn rời khỏi trang này? Tất cả thay đổi chưa được lưu sẽ bị mất vĩnh viễn.
                        </p>
                    </div>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={handleConfirmBack} 
                        color="inherit"
                        sx={{
                            color: '#666',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                    >
                        Rời khỏi
                    </Button>
                    <Button 
                        onClick={handleSaveAndBack} 
                        variant="contained" 
                        sx={{
                            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                            boxShadow: '0 3px 15px rgba(25, 118, 210, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                                boxShadow: '0 5px 20px rgba(25, 118, 210, 0.4)',
                                transform: 'translateY(-1px)'
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Lưu tạm thời & Rời khỏi
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default EditSalePage;
