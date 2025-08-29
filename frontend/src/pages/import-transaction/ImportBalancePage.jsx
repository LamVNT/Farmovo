import React, { useState, useEffect, useRef, useCallback, startTransition } from 'react';
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
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    TextField as MuiTextField,
    Popover,
} from '@mui/material';
import { FaSearch } from 'react-icons/fa';
import { MdKeyboardArrowDown, MdCategory } from 'react-icons/md';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DataGrid } from '@mui/x-data-grid';
import { FaRegTrashCan } from "react-icons/fa6";
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';

import importTransactionService from '../../services/importTransactionService';
import { userService } from '../../services/userService';
import { customerService } from '../../services/customerService';
import { getCategories } from '../../services/categoryService';
import ImportSidebar from '../../components/import-transaction/ImportSidebar';
import { getZones } from '../../services/zoneService';
import { getAllStores } from '../../services/storeService';
import { updateBatchRemainQuantity, getImportBalanceData } from '../../services/stocktakeService';

const ImportBalancePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [zones, setZones] = useState([]);
    const [allZones, setAllZones] = useState([]);
    const [filteredZones, setFilteredZones] = useState([]);
    
    // Form data
    const [nextImportCode, setNextImportCode] = useState('');
    const [note, setNote] = useState('');
    const [paidAmount, setPaidAmount] = useState(0);
    const [paidAmountInput, setPaidAmountInput] = useState('0');
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [highlightSupplier, setHighlightSupplier] = useState(false);
    const [highlightStore, setHighlightStore] = useState(false);
    const [highlightProducts, setHighlightProducts] = useState(false);
    const [isClient, setIsClient] = useState(false);
    
    // Stocktake data
    const [stocktakeInfo, setStocktakeInfo] = useState(null);
    const [batchItems, setBatchItems] = useState([]);
    const [lockedStoreId, setLockedStoreId] = useState(null);
    const [lockedStoreName, setLockedStoreName] = useState(null);

    // Mode: 'update' for updating batch quantities, 'create' for creating new import transaction
    const [mode, setMode] = useState('update');

    // Supplier dropdown states
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    
    // Store dropdown states
    const [storeSearch, setStoreSearch] = useState('');
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [filteredStores, setFilteredStores] = useState([]);

    // Column visibility for balance import
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Lô hàng': true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng hiện tại': false, // Ẩn cột này
        'Số lượng thêm vào': true,
        'Đơn giá': true,
        'Giá bán': true,
        'Thành tiền': true,
        'Vị trí': true,
        'Ngày hết hạn': true,
    });

    // Set isClient to true after component mounts
    useEffect(() => {
        setIsClient(true);
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load user data
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user')) || {};
                setCurrentUser(user);
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };
        loadUserData();
    }, []);

    // Load suppliers and stores
    useEffect(() => {
        const loadData = async () => {
            // Load suppliers
            try {
                const suppliersData = await customerService.getSuppliers();
                setSuppliers(suppliersData || []);
                setFilteredSuppliers(suppliersData || []);

                // Tự động chọn nhà cung cấp lẻ nếu có
                const retailSupplier = suppliersData?.find(s => {
                    const name = s.name?.toLowerCase() || '';
                    return name.includes('lẻ') ||
                           name.includes('nhà cung cấp lẻ') ||
                           name === 'lẻ' ||
                           name === 'nhà cung cấp lẻ' ||
                           name.includes('retail');
                });

                if (retailSupplier) {
                    setSelectedSupplier(retailSupplier.id);
                    setSupplierSearch(retailSupplier.name);
                    console.log('Auto-selected retail supplier:', retailSupplier.name);
                } else {
                    console.log('No retail supplier found, available:', suppliersData?.map(s => s.name));
                }
            } catch (error) {
                console.error('Failed to load suppliers:', error);
            }

            // Load stores only for ADMIN/OWNER roles
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.roles].filter(Boolean);
            const isStaff = userRoles.some(role =>
                role === 'STAFF' || role === 'ROLE_STAFF'
            );

            if (!isStaff) {
                try {
                    const storesData = await getAllStores();
                    setStores(storesData || []);
                    setFilteredStores(storesData || []);
                } catch (error) {
                    console.log('Cannot load stores (no admin access)');
                }
            } else {
                // For STAFF, use store from user data
                if (user.store) {
                    const userStore = {
                        id: user.store.id,
                        storeName: user.store.storeName || user.store.name,
                        name: user.store.name || user.store.storeName
                    };
                    setStores([userStore]);
                    setFilteredStores([userStore]);
                    console.log('Using staff store from user data:', userStore.storeName);
                }
            }

            // Load next code
            try {
                const nextCode = await importTransactionService.getNextCode();
                setNextImportCode(nextCode || '');
            } catch (error) {
                console.error('Failed to load next code:', error);
            }
        };
        loadData();
    }, []);

    // Load zones when store is selected
    useEffect(() => {
        const loadZones = async () => {
            if (selectedStore) {
                try {
                    const zonesData = await getZones(selectedStore);
                    setZones(zonesData || []);
                    setFilteredZones(zonesData || []);
                } catch (error) {
                    console.error('Error loading zones:', error);
                    setZones([]);
                    setFilteredZones([]);
                }
            }
        };
        loadZones();
    }, [selectedStore]);

    // Load stocktake data from navigation state
    useEffect(() => {
        const surplus = location.state?.surplusFromStocktake;
        const createMode = location.state?.createImportMode; // New flag for create mode

        if (!surplus) {
            navigate('/import/new');
            return;
        }

        // Set mode based on navigation state
        if (createMode) {
            setMode('create');
        } else {
            setMode('update');
        }

        setStocktakeInfo({
            stocktakeId: surplus.stocktakeId,
            stocktakeCode: surplus.stocktakeCode,
            storeId: surplus.storeId
        });

        // Set locked store
        if (surplus.storeId) {
            setSelectedStore(surplus.storeId);
            setLockedStoreId(surplus.storeId);

            // Find store name - ưu tiên từ user data nếu là STAFF
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.roles].filter(Boolean);
            const isStaff = userRoles.some(role => role === 'STAFF' || role === 'ROLE_STAFF');

            let storeName;
            if (isStaff && user.storeName && String(user.storeId) === String(surplus.storeId)) {
                // Nếu là STAFF và storeId khớp, dùng storeName từ user data
                storeName = user.storeName;
            } else {
                // Ngược lại, tìm trong danh sách stores
                const store = stores.find(s => String(s.id) === String(surplus.storeId));
                storeName = store?.storeName || store?.name || `Kho ${surplus.storeId}`;
            }

            setLockedStoreName(storeName);
            setStoreSearch(storeName);

        }

        // Process surplus items into batch format
        if (Array.isArray(surplus.items) && surplus.items.length > 0) {
            console.log('DEBUG: surplus.items structure:', surplus.items[0]); // Debug first item

            const batchProducts = surplus.items
                    .filter(d => Number(d.diff) > 0) // Only surplus items
                    .map((d, index) => ({
                    id: `${d.productId}_${d.batchCode || d.name || 'batch'}_${index}_${Date.now()}`, // Đảm bảo ID duy nhất
                    batchCode: d.batchCode || d.name || `Lô ${index + 1}`,
                    name: d.productName || d.name || `Sản phẩm ${d.productId}`,
                    productName: d.productName || d.name || `Sản phẩm ${d.productId}`,
                    productCode: d.productCode || '',
                    productId: d.productId,
                    unit: 'quả',
                    realQuantity: d.real || 0,
                    remainQuantity: d.remain || 0,
                    diff: d.diff || 0,
                    quantity: Number(d.diff) || 0, // Import quantity = diff
                    price: 0,
                    salePrice: d.unitSalePrice || 0, // Lấy từ lô nguồn
                    total: 0,
                    zoneIds: d.zones_id && Array.isArray(d.zones_id) 
                        ? d.zones_id.map(id => Number(id))
                        : d.zoneReal && Array.isArray(d.zoneReal)
                        ? d.zoneReal.map(id => Number(id))
                        : d.zoneReal 
                        ? [Number(d.zoneReal)]
                        : [],
                    expireDate: d.expireDate ? String(d.expireDate).slice(0,10) : new Date(Date.now() + 14*24*60*60*1000).toISOString().slice(0,10),
                    originalId: d.id, // Lưu ID gốc để sử dụng khi cập nhật
                }));

            setSelectedProducts(batchProducts);
            setBatchItems(batchProducts);
            setNote(`Phiếu Nhập cân bằng cho kiểm kê ${surplus.stocktakeCode || surplus.stocktakeId || ''} - ${batchProducts.length} lô hàng`);
        }
    }, [location.state, navigate, stores]);

    // Update store name when stores are loaded
    useEffect(() => {
        if (lockedStoreId && stores.length > 0 && !lockedStoreName) {
            const store = stores.find(s => String(s.id) === String(lockedStoreId));
            if (store) {
                const storeName = store.storeName || store.name || `Kho ${lockedStoreId}`;
                setLockedStoreName(storeName);
                setStoreSearch(storeName);

            }
        }
    }, [stores, lockedStoreId, lockedStoreName]);

    // Load next import code when in create mode
    useEffect(() => {
        if (mode === 'create') {
            const loadNextCode = async () => {
                try {
                    const code = await importTransactionService.getNextBalanceCode();
                    setNextImportCode(code);
                } catch (error) {
                    console.error('Error loading next import code:', error);
                }
            };
            loadNextCode();
        }
    }, [mode]);

    // Load import data from API when in create mode (chỉ khi cần thiết)
    useEffect(() => {
        if (mode === 'create' && stocktakeInfo?.stocktakeId && selectedProducts.length === 0) {
            // Chỉ gọi API khi không có dữ liệu từ surplus.items
            const loadImportData = async () => {
                try {
                    const importData = await getImportBalanceData(stocktakeInfo.stocktakeId);
                    const batchProducts = importData.map((d, index) => ({
                        id: `${d.productId}_${d.batchCode || 'batch'}_${index}_${Date.now()}`, // Đảm bảo ID duy nhất
                        batchCode: d.batchCode || `Lô ${index + 1}`, // Hiển thị tên lô từ API
                        name: d.productName || d.name || `Sản phẩm ${d.productId}`,
                        productName: d.productName || d.name || `Sản phẩm ${d.productId}`,
                        productCode: d.productCode || '',
                        productId: d.productId,
                        unit: 'quả',
                        quantity: d.importQuantity || 0,
                        price: 0, // Đơn giá mặc định = 0 cho PCB Nhập
                        salePrice: d.unitSalePrice || 0, // Giữ nguyên giá bán từ lô cũ
                        total: 0, // Thành tiền = 0 vì đơn giá = 0
                        zoneIds: d.zones_id && Array.isArray(d.zones_id)
                            ? d.zones_id.map(id => Number(id))
                            : [],
                        expireDate: d.expireDate ? String(d.expireDate).slice(0,10) : new Date(Date.now() + 14*24*60*60*1000).toISOString().slice(0,10),
                        originalId: d.productId,
                    }));

                    setSelectedProducts(batchProducts);
                    setBatchItems(batchProducts);
                    setNote(`PCB Nhập cho kiểm kê ${stocktakeInfo.stocktakeCode || stocktakeInfo.stocktakeId || ''} - ${batchProducts.length} lô hàng`);
                    
                    // Đặt paidAmount = 0 cho PCB Nhập
                    setPaidAmount(0);
                    setPaidAmountInput('0');
                } catch (error) {
                    console.error('Error loading import balance data:', error);
                    setError('Không thể tải dữ liệu từ kiểm kê');
                }
            };
            loadImportData();
        }
    }, [mode, stocktakeInfo, selectedProducts.length]);

    // Filter suppliers based on search
    useEffect(() => {
        if (!supplierSearch.trim()) {
            setFilteredSuppliers(suppliers);
        } else {
            const filtered = suppliers.filter(supplier =>
                supplier.name?.toLowerCase().includes(supplierSearch.toLowerCase())
            );
            setFilteredSuppliers(filtered);
        }
    }, [supplierSearch, suppliers]);

    // Filter stores based on search
    useEffect(() => {
        if (!storeSearch.trim()) {
            setFilteredStores(stores);
        } else {
            const filtered = stores.filter(store =>
                store.storeName?.toLowerCase().includes(storeSearch.toLowerCase()) ||
                store.name?.toLowerCase().includes(storeSearch.toLowerCase())
            );
            setFilteredStores(filtered);
        }
    }, [storeSearch, stores]);

    // Handle column visibility toggle
    const toggleColumn = (columnName) => {
        setColumnVisibility(prev => ({
            ...prev,
            [columnName]: !prev[columnName]
        }));
    };

    // Handle field changes
    const handleQuantityChange = (productId, delta) => {
        setSelectedProducts(prev => prev.map(product => 
            product.id === productId 
                ? { 
                    ...product, 
                    quantity: Math.max(0, (product.quantity || 0) + delta),
                    total: (product.price || 0) * Math.max(0, (product.quantity || 0) + delta)
                  }
                : product
        ));
    };

    const handlePriceChange = (productId, newPrice) => {
        setSelectedProducts(prev => prev.map(product => 
            product.id === productId 
                ? { 
                    ...product, 
                    price: newPrice,
                    total: newPrice * (product.quantity || 0)
                  }
                : product
        ));
    };

    const handleSalePriceChange = (productId, newSalePrice) => {
        setSelectedProducts(prev => prev.map(product => 
            product.id === productId 
                ? { ...product, salePrice: newSalePrice }
                : product
        ));
    };

    const handleExpireDateChange = (productId, newDate) => {
        setSelectedProducts(prev => prev.map(product => 
            product.id === productId 
                ? { ...product, expireDate: newDate }
                : product
        ));
    };

    const handleUnitChange = (productId, newUnit) => {
        setSelectedProducts(prev => prev.map(product => 
            product.id === productId 
                ? { ...product, unit: newUnit }
                : product
        ));
    };

    const handleZoneChange = (productId, newZoneIds) => {
        setSelectedProducts(prev => prev.map(product => 
            product.id === productId 
                ? { ...product, zoneIds: newZoneIds }
                : product
        ));
    };

    // Remove product from list
    const handleRemoveProduct = (productId) => {
        setSelectedProducts(prev => prev.filter(product => product.id !== productId));
    };

    // Calculate totals
    const totalAmount = selectedProducts.reduce((sum, product) => {
        // Tổng tiền luôn = 0 cho PCB Nhập vì đơn giá = 0
        return sum + 0;
    }, 0);
    const remainingAmount = totalAmount - paidAmount;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Handle paid amount change
    const handlePaidAmountChange = (value) => {
        // Disable paid amount changes for balance import
        if (mode === 'create') {
            return;
        }
        
        const numericValue = parseFloat(value) || 0;
        setPaidAmount(numericValue);
        setPaidAmountInput(value);
    };

    // Handle update batch data
    const handleUpdateBatch = async () => {
        if (!selectedStore) {
            setError('Vui lòng chọn cửa hàng');
            setHighlightStore(true);
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            setHighlightProducts(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Cập nhật số lượng từng lô hàng
            for (const product of selectedProducts) {
                // Sử dụng ID gốc của lô hàng nếu có
                const batchId = product.originalId;
                
                if (batchId && !isNaN(batchId)) {
                    try {
                        // Tính số lượng mới = số lượng hiện tại + số lượng thêm vào
                        const currentQuantity = product.remainQuantity || 0;
                        const additionalQuantity = product.quantity || 0;
                        const newTotalQuantity = currentQuantity + additionalQuantity;
                        
                        // Cập nhật số lượng còn lại của lô hàng
                        await updateBatchRemainQuantity(batchId, newTotalQuantity);
                        console.log(`Updated batch ${batchId}: ${currentQuantity} + ${additionalQuantity} = ${newTotalQuantity}`);
                    } catch (batchError) {
                        console.error(`Error updating batch ${batchId}:`, batchError);
                        // Tiếp tục với các lô khác nếu có lỗi
                    }
                } else {
                    console.warn(`No valid batch ID found for product:`, product);
                }
            }
            
            setSuccess('Cập nhật số lượng lô hàng thành công!');
            
            // Đánh dấu đã tạo phiếu nhập cân bằng
            localStorage.setItem(`stocktake_${stocktakeInfo.stocktakeId}_hasBalanceImport`, 'true');
            
            // Reset form and navigate back to stocktake detail
            setTimeout(() => {
                navigate(`/stocktake/${stocktakeInfo.stocktakeId}`);
            }, 2000);
        } catch (err) {
            console.error('Error updating batch quantities:', err);
            setError('Không thể cập nhật số lượng lô hàng');
        } finally {
            setLoading(false);
        }
    };

    // Handle create new import transaction
    const handleCreateImport = async () => {
        if (!selectedStore) {
            setError('Vui lòng chọn cửa hàng');
            setHighlightStore(true);
            return;
        }

        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            setHighlightSupplier(true);
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            setHighlightProducts(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Chuẩn bị dữ liệu cho phiếu nhập
            const importDetails = selectedProducts.map(product => ({
                productId: product.productId,
                importQuantity: product.quantity,
                remainQuantity: product.quantity,
                unitImportPrice: 0, // Đơn giá = 0 cho PCB Nhập
                unitSalePrice: product.salePrice || 0,
                expireDate: product.expireDate ? new Date(product.expireDate).toISOString() : null,
                zones_id: product.zoneIds || []
            }));

            const importData = {
                supplierId: selectedSupplier,
                storeId: selectedStore,
                details: importDetails,
                totalAmount: 0, // Tổng tiền = 0 vì đơn giá = 0
                paidAmount: 0, // Số tiền đã trả = 0 cho PCB Nhập
                importTransactionNote: note + " - Cân bằng nhập",
                importDate: new Date().toISOString(),
                status: 'DRAFT',
                stocktakeId: stocktakeInfo.stocktakeId,
                name: nextImportCode,
                staffId: currentUser?.id || 1
            };

            await importTransactionService.createFromBalance(importData);

            setSuccess('Cập nhật thành công!');

            // Đánh dấu đã tạo phiếu nhập cân bằng
            localStorage.setItem(`stocktake_${stocktakeInfo.stocktakeId}_hasBalanceImport`, 'true');

            // Reset form and navigate back to stocktake detail
            setTimeout(() => {
                navigate(`/stocktake/${stocktakeInfo.stocktakeId}`);
            }, 2000);
        } catch (err) {
            console.error('Error creating import transaction:', err);
            setError('Không thể Cập nhật');
        } finally {
            setLoading(false);
        }
    };

    // DataGrid columns for balance import
    const columns = [
        columnVisibility['STT'] && {
            field: 'stt',
            headerName: 'STT',
            width: 60,
            renderCell: (params) => {
                const idx = selectedProducts.findIndex(row => row.id === params.id);
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
                        {idx >= 0 ? idx + 1 : ''}
                    </div>
                );
            }
        },
        columnVisibility['Lô hàng'] && { 
            field: 'batchCode', 
            headerName: 'Lô hàng', 
            width: 120,
            minWidth: 100,
            renderCell: (params) => (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    padding: '0 8px',
                    color: '#1976d2'
                }}>
                    {params.row.batchCode || 'N/A'}
                </div>
            )
        },
        columnVisibility['Tên hàng'] && { 
            field: 'name', 
            headerName: 'Tên hàng', 
            width: 200,
            minWidth: 150,
            renderCell: (params) => (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    padding: '0 8px'
                }}>
                    {params.row.name || params.row.productName || 'Không xác định'}
                </div>
            )
        },
        columnVisibility['ĐVT'] && { 
            field: 'unit', 
            headerName: 'ĐVT', 
            width: 100,
            renderCell: (params) => (
                <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                }}>
                    {params.row.unit || 'quả'}
                </div>
            )
        },
        columnVisibility['Số lượng hiện tại'] && {
            field: 'remainQuantity',
            headerName: 'Số lượng hiện tại',
            width: 140,
            renderCell: (params) => (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#666'
                }}>
                    {params.row.remainQuantity || 0}
                </div>
            )
        },
        columnVisibility['Số lượng thêm vào'] && {
            field: 'quantity',
            headerName: 'Số lượng thêm vào',
            width: 150,
            renderCell: (params) => (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                }}>
                    {params.row.quantity || 0}
                </div>
            )
        },
        columnVisibility['Đơn giá'] && {
            field: 'price',
            headerName: 'Đơn giá/quả',
            width: 130,
            renderCell: (params) => (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    width: '100%',
                    height: '100%',
                    padding: '0 8px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                }}>
                    {(params.row.price || 0).toLocaleString('vi-VN')} VNĐ
                </div>
            )
        },
        columnVisibility['Giá bán'] && {
            field: 'salePrice',
            headerName: 'Giá bán/quả',
            width: 130,
            renderCell: (params) => (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    width: '100%',
                    height: '100%',
                    padding: '0 8px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                }}>
                    {(params.row.salePrice || 0).toLocaleString('vi-VN')} VNĐ
                </div>
            )
        },
        columnVisibility['Thành tiền'] && {
            field: 'total',
            headerName: 'Thành tiền',
            width: 120,
            valueGetter: (params) => {
                const row = params?.row ?? {};
                const price = parseFloat(row.price) || 0;
                const quantity = parseInt(row.quantity) || 0;
                return price * quantity;
            },
            renderCell: (params) => {
                const total = (params.row.price || 0) * (params.row.quantity || 0);
                return (
                    <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        width: '100%',
                        height: '100%',
                        fontWeight: '600',
                        color: '#1976d2',
                        fontSize: '0.875rem',
                        padding: '0 8px'
                    }}>
                        {total.toLocaleString('vi-VN')} VNĐ
                    </div>
                );
            }
        },
        columnVisibility['Vị trí'] && {
            field: 'zoneIds',
            headerName: 'Vị trí',
            width: 200,
            renderCell: (params) => {
                const selectedZoneIds = Array.isArray(params.row.zoneIds) ? params.row.zoneIds : [];
                
                if (selectedZoneIds.length === 0) {
                    return (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            padding: '0 8px',
                            color: '#999',
                            fontSize: '0.875rem'
                        }}>
                            - Chưa có vị trí -
                        </div>
                    );
                }

                return (
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 2, 
                        alignItems: 'center', 
                        width: '100%',
                        height: '100%',
                        padding: '0 4px',
                        maxWidth: '190px'
                    }}>
                        {selectedZoneIds.slice(0, 2).map((zoneId) => {
                            const zone = zones.find(z => z.id === zoneId);
                            return zone ? (
                                <Chip
                                    key={zoneId}
                                    label={zone.name || zone.zoneName}
                                    size="small"
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        fontWeight: '600',
                                        borderRadius: '6px',
                                        height: '18px',
                                        fontSize: '0.65rem',
                                        maxWidth: '60px',
                                        '& .MuiChip-label': {
                                            padding: '0 4px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }
                                    }}
                                />
                            ) : null;
                        })}
                        {selectedZoneIds.length > 2 && (
                            <Chip
                                key={`more-${selectedZoneIds.length}`}
                                label={`+${selectedZoneIds.length - 2}`}
                                size="small"
                                sx={{
                                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                    color: '#d63384',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    height: '18px',
                                    fontSize: '0.65rem',
                                    minWidth: '20px',
                                    '& .MuiChip-label': {
                                        padding: '0 3px'
                                    }
                                }}
                            />
                        )}
                    </div>
                );
            }
        },
        columnVisibility['Ngày hết hạn'] && {
            field: 'expireDate',
            headerName: 'Ngày hết hạn',
            width: 140,
            renderCell: (params) => (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    padding: '0 8px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                }}>
                    {params.row.expireDate 
                        ? new Date(params.row.expireDate).toLocaleDateString('vi-VN')
                        : '-'
                    }
                </div>
            )
        },
    ].filter(Boolean);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <div className="flex w-full h-screen bg-gray-100">
                {error && <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{error}</Alert>}
                {success && <Alert severity="success" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{success}</Alert>}

                <div className="flex-1 p-4 bg-white rounded-md m-4 shadow-md overflow-auto">
                    {/* Header với navigation */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="text"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => navigate('/stocktake')}
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
                                {mode === 'create' ? 'Quay lại' : 'Phiếu nhập cân bằng'}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Tooltip title="Ẩn/hiện cột hiển thị">
                                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                                    <VisibilityIcon />
                                </IconButton>
                            </Tooltip>
                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                                {Object.entries(columnVisibility).map(([col, visible]) => (
                                    <MenuItem key={col} dense>
                                        <MuiFormControlLabel 
                                            control={<Checkbox checked={visible} onChange={() => toggleColumn(col)} />} 
                                            label={col} 
                                        />
                                    </MenuItem>
                                ))}
                            </Menu>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div style={{ height: 400, width: '100%' }}>
                        {isClient ? (
                            <DataGrid
                                rows={selectedProducts}
                                columns={columns}
                                initialState={{
                                    pagination: {
                                        paginationModel: { page: 0, pageSize: 10 },
                                    },
                                }}
                                pageSizeOptions={[10, 25, 50]}
                                disableRowSelectionOnClick
                                getRowId={(row) => row.id || `row_${Math.random()}`}
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    '& .MuiDataGrid-cell': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '0.875rem',
                                        fontWeight: '400',
                                        borderBottom: '1px solid #f0f0f0',
                                        borderRight: '1px solid #f0f0f0',
                                        padding: '8px 12px'
                                    },
                                    '& .MuiDataGrid-columnHeader': {
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        backgroundColor: '#f8f9fa',
                                        borderBottom: '1px solid #e0e0e0',
                                        borderRight: '1px solid #e0e0e0',
                                        color: '#333'
                                    },
                                    '& .MuiDataGrid-row': {
                                        minHeight: '48px',
                                        '&:hover': {
                                            backgroundColor: '#f8f9fa'
                                        },
                                        '&:nth-of-type(even)': {
                                            backgroundColor: '#fafafa'
                                        }
                                    },
                                    '& .MuiDataGrid-columnHeaders': {
                                        borderBottom: '2px solid #e0e0e0'
                                    },
                                    '& .MuiDataGrid-footerContainer': {
                                        borderTop: '1px solid #e0e0e0',
                                        backgroundColor: '#f8f9fa'
                                    }
                                }}
                                rowHeight={48}
                                columnVisibilityModel={columnVisibility}
                                onColumnVisibilityModelChange={(newModel) => setColumnVisibility(newModel)}
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

                {/* Sidebar */}
                <ImportSidebar
                    currentUser={currentUser}
                    currentTime={currentTime}
                    nextImportCode={nextImportCode}
                    suppliers={suppliers}
                    setSuppliers={setSuppliers}
                    selectedSupplier={selectedSupplier}
                    setSelectedSupplier={setSelectedSupplier}
                    supplierSearch={supplierSearch}
                    setSupplierSearch={setSupplierSearch}
                    supplierDropdownOpen={supplierDropdownOpen}
                    setSupplierDropdownOpen={setSupplierDropdownOpen}
                    filteredSuppliers={filteredSuppliers}
                    stores={stores}
                    selectedStore={selectedStore}
                    setSelectedStore={setSelectedStore}
                    storeSearch={storeSearch}
                    setStoreSearch={setStoreSearch}
                    storeDropdownOpen={storeDropdownOpen}
                    setStoreDropdownOpen={setStoreDropdownOpen}
                    filteredStores={filteredStores}
                    note={note}
                    setNote={setNote}
                    totalAmount={totalAmount}
                    paidAmount={paidAmount}
                    paidAmountInput={paidAmountInput}
                    setPaidAmountInput={setPaidAmountInput}
                    setPaidAmount={handlePaidAmountChange}
                    highlightSupplier={highlightSupplier}
                    highlightStore={highlightStore}
                    loading={loading}
                    onUpdateBatch={handleUpdateBatch}
                    onCreateImport={handleCreateImport}
                    lockedStoreId={lockedStoreId}
                    lockedStoreName={lockedStoreName}
                    isBalancePage={true}
                    mode={mode}
                />
            </div>
        </LocalizationProvider>
    );
};

export default ImportBalancePage;