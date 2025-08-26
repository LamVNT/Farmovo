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
    Popover,
    Chip,
} from '@mui/material';
import {FaLock, FaCheck, FaSearch, FaEye} from 'react-icons/fa';
import {MdKeyboardArrowDown, MdCategory} from 'react-icons/md';
import {FiPlus} from 'react-icons/fi';
import {DataGrid} from '@mui/x-data-grid';
import {FaRegTrashCan} from "react-icons/fa6";
import {format} from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

// Components
import SaleProductDialog from '../../components/sale-transaction/SaleProductDialog';
import SaleSidebar from '../../components/sale-transaction/SaleSidebar';
import SaleSummaryDialog from '../../components/sale-transaction/SaleSummaryDialog';

// Hooks
import {useSaleTransaction} from '../../hooks/useSaleTransaction';

// Utils
import {formatCurrency, isValidValue} from '../../utils/formatters';
import ZoneChips from '../../components/stocktake/ZoneChips';
import saleTransactionService from '../../services/saleTransactionService';

const AddSalePage = (props) => {
    const navigate = useNavigate();
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
    const [nextCode, setNextCode] = useState(props.initialCode || '');
    const [unit, setUnit] = useState('quả');
    const [paidAmountInput, setPaidAmountInput] = useState('0');
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng': true,
        'Đơn giá': true,
        'Thành tiền': true,
        ...(props.isBalanceStock ? {'Mã lô': true, 'Zone': true} : {}),
    });
    const [highlightCustomer, setHighlightCustomer] = useState(false);
    const [highlightStore, setHighlightStore] = useState(false);
    const [highlightProducts, setHighlightProducts] = useState(false);
    const [balanceModeInitialized, setBalanceModeInitialized] = useState(false);
    const [invalidProductIds, setInvalidProductIds] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [showBackConfirm, setShowBackConfirm] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [shouldSaveTemp, setShouldSaveTemp] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);
    const [zonePopoverAnchor, setZonePopoverAnchor] = useState(null);
    const [zonePopoverItems, setZonePopoverItems] = useState([]);

    // Props for locked store from stocktake
    const { lockedStoreId, lockedStoreName, fromStocktake } = props;

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
        handleDeleteProduct,
        handleShowSummary,
        handleSaveDraft,
        handleComplete,
        handleCancel,
        handleConfirmSummary,
        handleCloseSummary,
        handleSelectProductInDialog,
        handleSelectBatches,
    } = useSaleTransaction({ isBalanceStock: props.isBalanceStock, onSubmit: props.onSubmit });

    // Khởi tạo dữ liệu balance mode một lần duy nhất
    useEffect(() => {
        if (props.isBalanceStock && !balanceModeInitialized && props.initialProducts) {
            // Set products với đầy đủ thông tin
            setSelectedProducts(props.initialProducts.map((p, idx) => ({
                ...p,
                price: p.unitSalePrice || 0,
                id: p.id || p.batchId || (Date.now() + idx), // Gán id hợp lệ là số
                proId: p.proId || p.productId || p.id || p.batchId || (Date.now() + idx) // Đảm bảo proId luôn có giá trị
            })));

            if (props.initialNote) setNote(props.initialNote);
            if (props.initialCustomer) setSelectedCustomer(props.initialCustomer?.id || props.initialCustomer);
            setBalanceModeInitialized(true);
        }
    }, [props.isBalanceStock, props.initialProducts, props.initialNote, props.initialCustomer, balanceModeInitialized]);

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
                const isBalance = props.isBalanceStock || (props.initialNote && props.initialNote.toLowerCase().includes('cân bằng kho'));
                if (isBalance) {
                    try {
                        const pcb = await saleTransactionService.getNextBalanceCode?.();
                        if (pcb) { setNextCode(pcb); return; }
                    } catch {}
                    const pb = await saleTransactionService.getNextCode?.();
                    setNextCode((pb || '').replace(/^PB/, 'PCB'));
                } else {
                    const pb = await saleTransactionService.getNextCode?.();
                    setNextCode(pb || '');
                }
            } catch (e) {
                setNextCode('');
            }
        };
        fetchNext();
    }, [props.isBalanceStock]);

    useEffect(() => {
        const storeFilteredBatches = batches.filter(batch => {
            if (!selectedStore) return false;
            const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
            if (!selectedStoreData) return false;
            return batch.storeName === selectedStoreData.storeName || batch.storeName === selectedStoreData.name;
        });

        if (searchTerm.trim() !== '') {
            const results = storeFilteredBatches.filter(
                (b) =>
                    (b.batchCode && b.batchCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (b.productName && b.productName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            results.sort((a, b) => {
                const dateA = a.importDate ? new Date(a.importDate).getTime() : 0;
                const dateB = b.importDate ? new Date(b.importDate).getTime() : 0;
                return dateB - dateA;
            });
            setFilteredBatches(results.slice(0, 10));
        } else if (isSearchFocused) {
            const sorted = [...storeFilteredBatches].sort((a, b) => {
                const dateA = a.importDate ? new Date(a.importDate).getTime() : 0;
                const dateB = b.importDate ? new Date(b.importDate).getTime() : 0;
                return dateB - dateA;
            });
            setFilteredBatches(sorted.slice(0, 10));
        } else {
            setFilteredBatches([]);
        }
    }, [batches, searchTerm, isSearchFocused, selectedStore, stores]);

    // Reset selectedProducts khi store thay đổi (chỉ reset bảng datagrid, giữ nguyên thông tin khác)
    // KHÔNG reset khi đang ở chế độ balance để giữ nguyên dữ liệu prefill
    useEffect(() => {
        if (selectedStore && !props.isBalanceStock) {
            // Reset selectedProducts khi store thay đổi (chỉ cho sale thường)
            setSelectedProducts([]);
            // Reset dataGridKey để refresh datagrid
            setDataGridKey(prev => prev + 1);
        }
    }, [selectedStore, props.isBalanceStock]);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
                setHighlightCustomer(false);
                setHighlightStore(false);
                setHighlightProducts(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    // Set client-side rendering
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Auto-select store when coming from stocktake
    useEffect(() => {
        if (lockedStoreId && !selectedStore) {
            setSelectedStore(String(lockedStoreId));
        }
    }, [lockedStoreId, selectedStore, setSelectedStore]);

    // Validate trước khi mở popup tóm tắt qua handleShowSummary từ hook
    const openSummaryAfterValidate = (status) => {
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
            setError('Vui lòng chọn ít nhất một sản phẩm');
            setHighlightProducts(true);
            missing = true;
        } else {
            setHighlightProducts(false);
        }
        if (missing) return;
        // Mở popup tóm tắt, để hook chuẩn bị summaryData
        if (props.isBalanceStock) {
            handleShowSummary('COMPLETE');
        } else if (status === 'DRAFT') {
            handleShowSummary('DRAFT');
        } else {
            handleShowSummary('COMPLETE');
        }
    };

    const handleOpenZonePopover = (event, zonesIdArray) => {
        try {
            const items = (zonesIdArray || [])
                .map(id => {
                    const z = zones.find(zz => String(zz.id) === String(id));
                    return z ? { id: z.id, name: z.zoneName } : { id, name: String(id) };
                });
            setZonePopoverItems(items);
            setZonePopoverAnchor(event.currentTarget);
        } catch (_) {
            setZonePopoverItems([]);
            setZonePopoverAnchor(event.currentTarget);
        }
    };

    const handleCloseZonePopover = () => {
        setZonePopoverAnchor(null);
        setZonePopoverItems([]);
    };

    const toggleColumn = (col) => {
        setColumnVisibility((prev) => ({...prev, [col]: !prev[col]}));
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
        // Đảm bảo batch.id là số hợp lệ
        const validBatchId = (/^\d+$/.test(String(batch.id))) ? Number(batch.id) : (batch.batchId || batch.proId || Date.now());
        
        if (unit === 'khay') {
            const remainKhay = Math.floor(batch.remainQuantity / 30);
            if (remainKhay < 1) return;
            handleSelectProduct({
                id: validBatchId,
                proId: batch.proId || batch.productId || batch.id || validBatchId, // Đảm bảo proId luôn có giá trị
                name: batch.productName,
                unit: 'khay',
                price: batch.unitSalePrice || 0,
                quantity: 1,
                remainQuantity: remainKhay,
                batchCode: batch.batchCode,
                productCode: batch.productCode,
                categoryName: batch.categoryName,
                storeName: batch.storeName,
                createAt: batch.createAt,
            }, {directAdd: true});
        } else {
            handleSelectProduct({
                id: validBatchId,
                proId: batch.proId || batch.productId || batch.id || validBatchId, // Đảm bảo proId luôn có giá trị
                name: batch.productName,
                unit: 'quả',
                price: batch.unitSalePrice || 0,
                quantity: 1,
                remainQuantity: batch.remainQuantity,
                batchCode: batch.batchCode,
                productCode: batch.productCode,
                categoryName: batch.categoryName,
                storeName: batch.storeName,
                createAt: batch.createAt,
            }, {directAdd: true});
        }
        setSearchTerm('');
        setFilteredBatches([]);
        setIsSearchFocused(false);
    };

    const handleOpenCategoryDialog = () => {
        // Kiểm tra xem đã chọn store chưa (đối với ADMIN/MANAGER)
        const isAdminOrManager = currentUser?.roles?.includes("ADMIN") || currentUser?.roles?.includes("MANAGER") || 
                                currentUser?.roles?.includes("ROLE_ADMIN") || currentUser?.roles?.includes("ROLE_MANAGER");
        
        if (isAdminOrManager && !selectedStore) {
            setError('Vui lòng chọn cửa hàng trước khi thêm từ nhóm hàng');
            setHighlightStore(true);
            return;
        }
        
        setShowCategoryDialog(true);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    const handleBack = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowBackConfirm(true);
        } else {
            navigate('/sale');
        }
    }, [hasUnsavedChanges, navigate]);

    const handleConfirmBack = useCallback(() => {
        // Xóa dữ liệu tạm thời khi chọn rời khỏi
        localStorage.removeItem('addSalePage_tempData');
        
        // Chuyển hướng ngay lập tức
        setShowBackConfirm(false);
        setIsNavigatingAway(true);
        
        if (pendingNavigation) {
            // Sử dụng window.location.href để chuyển hướng nhanh hơn
            window.location.href = pendingNavigation;
        } else {
            navigate('/sale');
        }
        
        setPendingNavigation(null);
    }, [pendingNavigation, navigate]);

    const handleCancelBack = useCallback(() => {
        setShowBackConfirm(false);
        setPendingNavigation(null);
        setIsNavigatingAway(false);
    }, []);

    const handleSaveAndBack = useCallback(async () => {
        try {
            // Lưu dữ liệu ngay lập tức thay vì đợi useEffect
            const tempData = {
                selectedProducts,
                selectedCustomer,
                selectedStore,
                note,
                paidAmount,
                timestamp: Date.now()
            };
            localStorage.setItem('addSalePage_tempData', JSON.stringify(tempData));
            
            // Hiển thị thông báo ngắn gọn
            setSuccess('Đã lưu tạm thời!');
            
            // Chuyển hướng ngay lập tức
            setShowBackConfirm(false);
            setIsNavigatingAway(true);
            
            if (pendingNavigation) {
                window.location.href = pendingNavigation;
            } else {
                navigate('/sale');
            }
            
            setPendingNavigation(null);
        } catch (error) {
            setError('Không thể lưu tạm thời. Vui lòng thử lại.');
        }
    }, [pendingNavigation, navigate, selectedProducts, selectedCustomer, selectedStore, note, paidAmount]);

    // Xóa dữ liệu tạm thời khi lưu thành công
    const clearTempData = useCallback(() => {
        localStorage.removeItem('addSalePage_tempData');
        setHasUnsavedChanges(false);
    }, []);

    const handleCloseCategoryDialog = () => {
        setShowCategoryDialog(false);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        const filteredProducts = products.filter(product => {
            const categoryMatch = product.categoryId === category.id || product.category?.id === category.id;
            if (!categoryMatch) return false;
            if (!selectedStore) return false;
            const selectedStoreData = stores.find(s => String(s.id) === String(selectedStore));
            if (!selectedStoreData) return false;
            return product.storeName === selectedStoreData.storeName || product.storeName === selectedStoreData.name;
        });
        setCategoryProducts(filteredProducts);
    };

    const handleSelectCategoryProduct = (product) => {
        handleSelectProduct({
            ...product, 
            unit: 'quả',
            proId: product.proId || product.id // Đảm bảo proId luôn có giá trị
        }, {directAdd: true});
    };

    const handleUnitChange = (id, newUnit) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    if (newUnit === 'khay' && p.unit !== 'khay') {
                        if (p.remainQuantity < 30) {
                            setError(`Không đủ tồn kho để đổi thành khay. Cần ít nhất 30 quả, hiện có: ${p.remainQuantity} quả`);
                            return p;
                        }
                        const maxKhay = Math.floor(p.remainQuantity / 30);
                        if (maxKhay < 1) {
                            setError(`Không đủ tồn kho để đổi thành khay. Cần ít nhất 30 quả, hiện có: ${p.remainQuantity} quả`);
                            return p;
                        }
                    }
                    const newQuantity = 1;
                    setError(null);
                    return {
                        ...p,
                        unit: newUnit,
                        quantity: newQuantity,
                        price: p.price,
                        total: (p.price || 0) * (newUnit === 'khay' ? newQuantity * 30 : newQuantity)
                    };
                }
                return p;
            })
        );
    };

    const columns = useMemo(() => [
        columnVisibility['STT'] && {
            field: 'stt',
            headerName: 'STT',
            width: 80,
            renderCell: (params) => {
                let stt = '';
                if (typeof params.rowIndex === 'number') {
                    stt = params.rowIndex + 1;
                } else if (params.id) {
                    const idx = selectedProducts.findIndex(row => row.id === params.id);
                    stt = idx >= 0 ? idx + 1 : '';
                }
                
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
                        {stt}
                    </div>
                );
            }
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
                
                // Lấy mã lô từ nhiều nguồn có thể
                const batchCode = params.row.batch?.name || 
                                params.row.batch?.batchCode || 
                                params.row.batchCode || 
                                params.row.name ||
                                params.row.batchId || 
                                params.row.id;
                
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
        // Hiển thị khu vực thực tế (Zone) cho phiếu cân bằng dạng chips
        props.isBalanceStock && columnVisibility['Zone'] && {
            field: 'zone',
            headerName: 'Khu vực thực tế',
            width: 200,
            renderCell: (params) => {
                const zr = params.row.zoneReal;
                const toArray = (val) => {
                    if (Array.isArray(val)) return val;
                    if (typeof val === 'string' && val.includes(',')) return val.split(',').map(s => s.trim());
                    return val ? [val] : [];
                };
                const zonesId = toArray(zr).map(v => String(v));
                return (
                    <ZoneChips 
                        zones={zones} 
                        zonesId={zonesId} 
                        actualIdx={params.rowIndex || 0}
                        onOpenPopover={(e) => handleOpenZonePopover(e, zonesId)}
                    />
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
                        disabled={props.isBalanceStock}
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
                        disabled={props.isBalanceStock}
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
                        disabled={props.isBalanceStock}
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
                        disabled={props.isBalanceStock}
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
            renderCell: (params) => {
                // Đối với phiếu cân bằng kho, không cho phép chỉnh sửa đơn giá
                if (props.isBalanceStock) {
                    return (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            textAlign: 'center',
                            color: '#374151'
                        }}>
                            {formatCurrency(params.row.price || 0)}
                        </div>
                    );
                }

                return (
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
                );
            },
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

        !props.isBalanceStock && {
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
    ].filter(Boolean), [columnVisibility, handleQuantityChange, handleQuantityInputChange, handlePriceChange, handleDeleteProduct, handleUnitChange, props.isBalanceStock]);

    // Lấy khách lẻ từ danh sách customers nếu có
    const khachLe = customers.find(c => c.name === 'Khách lẻ') || null;

    useEffect(() => {
        if (props.isBalanceStock && khachLe) {
            setSelectedCustomer(khachLe.id);
        }
    }, [props.isBalanceStock, khachLe]);

    // Theo dõi thay đổi để hiển thị dialog xác nhận - tối ưu hóa
    useEffect(() => {
        const hasChanges = selectedProducts.length > 0 || 
                          selectedCustomer !== '' || 
                          selectedStore !== '' || 
                          note !== '' || 
                          paidAmount > 0;
        
        setHasUnsavedChanges(hasChanges);
    }, [selectedProducts, selectedCustomer, selectedStore, note, paidAmount]);

    // Xử lý lưu tạm thời riêng biệt để tránh re-render không cần thiết
    // useEffect này không còn cần thiết vì đã xử lý trực tiếp trong handleSaveAndBack
    // useEffect(() => {
    //     if (shouldSaveTemp && hasUnsavedChanges) {
    //         const tempData = {
    //             selectedProducts,
    //             selectedCustomer,
    //             selectedStore,
    //             note,
    //             paidAmount,
    //             timestamp: Date.now()
    //     };
    //         localStorage.setItem('addSalePage_tempData', JSON.stringify(tempData));
    //         setShouldSaveTemp(false);
    //     }
    // }, [shouldSaveTemp, hasUnsavedChanges, selectedProducts, selectedCustomer, selectedStore, note, paidAmount]);

    // Khôi phục dữ liệu tạm thời khi vào lại trang - tối ưu hóa
    useEffect(() => {
        const tempData = localStorage.getItem('addSalePage_tempData');
        if (!tempData) return;

        try {
            const parsed = JSON.parse(tempData);
            const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000; // 24 giờ
            
            if (isExpired) {
                localStorage.removeItem('addSalePage_tempData');
                return;
            }

            // Sử dụng React 18 batch updates để tối ưu performance
            startTransition(() => {
                if (parsed.selectedProducts?.length > 0) {
                    setSelectedProducts(parsed.selectedProducts);
                }
                if (parsed.selectedCustomer) {
                    setSelectedCustomer(parsed.selectedCustomer);
                }
                if (parsed.selectedStore) {
                    setSelectedStore(parsed.selectedStore);
                }
                if (parsed.note) {
                    setNote(parsed.note);
                }
                if (parsed.paidAmount) {
                    setPaidAmount(parsed.paidAmount);
                    setPaidAmountInput(parsed.paidAmount.toString());
                }
            });
            
            setSuccess('Đã khôi phục dữ liệu tạm thời!');
        } catch (error) {
            console.error('Lỗi khi khôi phục dữ liệu tạm thời:', error);
            localStorage.removeItem('addSalePage_tempData');
        }
    }, []);

    // Xóa dữ liệu tạm thời khi lưu thành công - tối ưu hóa
    useEffect(() => {
        if (success && (success.includes('thành công') || success.includes('Đã lưu phiếu'))) {
            clearTempData();
        }
    }, [success]);

    // Xử lý khi dialog xác nhận đóng - tối ưu hóa
    // useEffect này không còn cần thiết vì đã xử lý trực tiếp
    // useEffect(() => {
    //     if (!showBackConfirm) {
    //         setShouldSaveTemp(false);
    //     }
    // }, [showBackConfirm]);

    // Bắt sự kiện browser back button và beforeunload - tối ưu hóa
    useEffect(() => {
        // Chỉ setup event listeners khi cần thiết
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
        
        // Push state ban đầu để có thể bắt sự kiện back
        window.history.pushState(null, '', window.location.pathname);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [hasUnsavedChanges, showBackConfirm, isNavigatingAway]);

    // Bắt sự kiện click vào sidebar navigation - tối ưu hóa
    useEffect(() => {
        // Chỉ setup event listener khi cần thiết
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



    return (
        <div className="flex w-full h-screen bg-gray-100">
            {error && <Alert severity="error"
                             className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{error}</Alert>}
            {success && <Alert severity="success"
                               className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{success}</Alert>}

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
                            {props.isBalanceStock ? 'Cân bằng kho' : 'Bán hàng'}
                        </Button>
                        
                        <div ref={searchRef} className="relative flex-1 max-w-2xl flex items-center gap-3">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Tìm lô hàng theo mã hoặc tên sản phẩm"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => {
                                // Kiểm tra xem đã chọn store chưa (đối với ADMIN/MANAGER)
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

                        {!props.isBalanceStock && (
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
                        )}
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
                    {isClient ? (
                        <DataGrid
                            key={dataGridKey}
                            rows={selectedProducts.map((row, idx) => ({
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
                onSaveDraft={() => { openSummaryAfterValidate('DRAFT'); }}
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
                isBalanceStock={props.isBalanceStock}
                lockedStoreId={lockedStoreId}
                lockedStoreName={lockedStoreName}
                fromStocktake={fromStocktake}
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
                        const ok = await handleConfirmSummary();
                        if (!ok) return;
                        if (props.isBalanceStock) {
                            props.onSuccess && props.onSuccess();
                        } else {
                            window.location.href = '/sale';
                        }
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
            {/* Popover hiển thị danh sách khu vực thực tế (style tương tự trang kiểm kho) */}
            <Popover
                open={Boolean(zonePopoverAnchor)}
                anchorEl={zonePopoverAnchor}
                onClose={handleCloseZonePopover}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                sx={{
                    '& .MuiPopover-paper': {
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        borderRadius: 3,
                        border: '1px solid #e8e8e8',
                        maxWidth: 320,
                        minWidth: 200,
                        p: 1.5,
                        animation: 'fadeInScale 0.2s ease-out',
                        '@keyframes fadeInScale': {
                            '0%': { opacity: 0, transform: 'scale(0.95) translateX(-10px)' },
                            '100%': { opacity: 1, transform: 'scale(1) translateX(0)' },
                        },
                    }
                }}
            >
                <div style={{ display: 'flex', gap: 6, padding: 6, maxWidth: 260, flexWrap: 'wrap' }}>
                    {zonePopoverItems.length > 0 ? zonePopoverItems.map(z => (
                        <Chip key={String(z.id)} label={z.name} size="small" sx={{ height: 22 }} />
                    )) : (
                        <span style={{ padding: 8, color: '#666' }}>Không có khu vực</span>
                    )}
                </div>
            </Popover>
        </div>
    );
};

export default AddSalePage;