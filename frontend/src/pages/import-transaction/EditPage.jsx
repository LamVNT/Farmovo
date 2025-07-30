import React, { useState, useEffect, useRef } from 'react';
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
    Typography,
} from '@mui/material';
import { FaSearch } from 'react-icons/fa';
import { MdKeyboardArrowDown, MdCategory } from 'react-icons/md';
import AddIcon from '@mui/icons-material/Add';
import { DataGrid } from '@mui/x-data-grid';
import { FaRegTrashCan } from "react-icons/fa6";
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';

import AddProductDialog from '../../components/import-transaction/AddProductDialog.jsx';
import ImportCategoryDialog from '../../components/import-transaction/ImportCategoryDialog';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { useParams, useNavigate } from 'react-router-dom';

import importTransactionService from '../../services/importTransactionService';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { userService } from '../../services/userService';
import { getCategories } from '../../services/categoryService';
import { getZones } from '../../services/zoneService';
import { getAllStores } from '../../services/storeService';
import ImportSummaryDialog from '../../components/import-transaction/ImportSummaryDialog';
import EditSidebar from '../../components/import-transaction/EditSidebar';

const EditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State management
    const [currentUser, setCurrentUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [zones, setZones] = useState([]);
    const [categories, setCategories] = useState([]);
    
    // Form data
    const [importCode, setImportCode] = useState('');
    const [note, setNote] = useState('');
    const [paidAmount, setPaidAmount] = useState(0);
    const [paidAmountInput, setPaidAmountInput] = useState('0');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [importDate, setImportDate] = useState(new Date());
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [highlightSupplier, setHighlightSupplier] = useState(false);
    const [highlightStore, setHighlightStore] = useState(false);
    const [highlightProducts, setHighlightProducts] = useState(false);
    
    // Search states
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [storeSearch, setStoreSearch] = useState('');
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [filteredStores, setFilteredStores] = useState([]);
    
    // Original data for comparison
    const [originalData, setOriginalData] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    
    // Column visibility
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng': true,
        'Đơn giá': true,
        'Giá bán': true,
        'Zone': true,
        'Thành tiền': true,
        'Ngày hết hạn': true,
    });

    // Category dialog states
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);

    // Zone popover states
    const [zonePopoverAnchor, setZonePopoverAnchor] = useState(null);
    const [zonePopoverProductId, setZonePopoverProductId] = useState(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load current user
                const currentUserData = await userService.getCurrentUser();
                setCurrentUser(currentUserData);

                // Load import transaction data
                const importData = await importTransactionService.getById(id);
                setOriginalData(importData);
                
                // Set form data
                setImportCode(importData.name || '');
                setSelectedSupplier(importData.supplierId || '');
                setSelectedStore(importData.storeId || '');
                setNote(importData.importTransactionNote || '');
                setPaidAmount(importData.paidAmount || 0);
                setPaidAmountInput(String(importData.paidAmount || 0));
                setImportDate(importData.importDate ? new Date(importData.importDate) : new Date());
                
                // Set search values after loading suppliers and stores
                setTimeout(() => {
                    const supplier = suppliersData.find(s => s.id === importData.supplierId);
                    if (supplier) {
                        setSupplierSearch(supplier.name);
                    }
                    const store = storesData.find(s => s.id === importData.storeId);
                    if (store) {
                        setStoreSearch(store.name);
                    }
                }, 100);
                
                // Set products
                if (importData.details) {
                    const formattedProducts = importData.details.map(detail => ({
                        id: detail.productId,
                        name: detail.product?.name || detail.product?.productName,
                        productCode: detail.product?.code || detail.product?.productCode,
                        productDescription: detail.product?.productDescription,
                        unit: 'quả',
                        price: detail.unitImportPrice || 0,
                        quantity: detail.importQuantity || 0,
                        total: (detail.unitImportPrice || 0) * (detail.importQuantity || 0),
                        productId: detail.productId,
                        salePrice: detail.unitSalePrice || 0,
                        zoneIds: detail.zones_id ? detail.zones_id.map(String) : [],
                        expireDate: detail.expireDate ? detail.expireDate.split('T')[0] : '',
                    }));
                    setSelectedProducts(formattedProducts);
                }

                // Load other data
                const [productsData, suppliersData, categoriesData, zonesData, storesData] = await Promise.all([
                    productService.getAllProducts(),
                    customerService.getSuppliers(),
                    getCategories(),
                    getZones(),
                    getAllStores(),
                ]);

                setProducts(productsData);
                setSuppliers(suppliersData);
                setCategories(categoriesData);
                setZones(zonesData);
                setStores(storesData);
                
            } catch (error) {
                setError('Không thể tải dữ liệu: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadData();
        }
    }, [id]);

    // Check for changes
    useEffect(() => {
        if (originalData) {
            const currentData = {
                supplierId: selectedSupplier,
                storeId: selectedStore,
                importTransactionNote: note,
                paidAmount: paidAmount,
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: product.zoneIds,
                    expireDate: product.expireDate,
                })),
            };

            const hasDataChanged = JSON.stringify(currentData) !== JSON.stringify({
                supplierId: originalData.supplierId,
                storeId: originalData.storeId,
                importTransactionNote: originalData.importTransactionNote,
                paidAmount: originalData.paidAmount,
                details: originalData.details?.map(detail => ({
                    productId: detail.productId,
                    importQuantity: detail.importQuantity,
                    unitImportPrice: detail.unitImportPrice,
                    unitSalePrice: detail.unitSalePrice,
                    zones_id: detail.zones_id,
                    expireDate: detail.expireDate,
                })),
            });

            setHasChanges(hasDataChanged);
        }
    }, [selectedSupplier, selectedStore, note, paidAmount, selectedProducts, originalData]);

    // Auto-dismiss messages
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
                setHighlightSupplier(false);
                setHighlightStore(false);
                setHighlightProducts(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    // Cập nhật filteredSuppliers khi search hoặc focus
    useEffect(() => {
        if (supplierSearch.trim() !== '') {
            setFilteredSuppliers(suppliers.filter(s => s.name?.toLowerCase().includes(supplierSearch.toLowerCase())));
        } else if (supplierDropdownOpen) {
            setFilteredSuppliers(suppliers.slice(0, 5));
        } else {
            setFilteredSuppliers([]);
        }
    }, [suppliers, supplierSearch, supplierDropdownOpen]);

    // Cập nhật filteredStores khi search hoặc focus
    useEffect(() => {
        if (storeSearch.trim() !== '') {
            setFilteredStores(stores.filter(s => s.name?.toLowerCase().includes(storeSearch.toLowerCase())));
        } else if (storeDropdownOpen) {
            setFilteredStores(stores.slice(0, 5));
        } else {
            setFilteredStores([]);
        }
    }, [stores, storeSearch, storeDropdownOpen]);

    // Update current time
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Search functionality
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            const results = products.filter(
                (p) => {
                    const name = p.name || p.productName || '';
                    const code = p.code || '';
                    return (
                        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        code.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }
            );
            setFilteredProducts(results);
        } else if (isSearchFocused) {
            setFilteredProducts(products.slice(0, 5));
        } else {
            setFilteredProducts([]);
        }
    }, [products, searchTerm, isSearchFocused]);

    // Helper functions
    const formatCurrency = (value) => {
        const number = Number(value);
        return !isNaN(number) ? number.toLocaleString('vi-VN') + ' VND' : '0 VND';
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSelectProduct = (product) => {
        if (!selectedProducts.find((p) => p.id === product.id)) {
            const price = product.price || 0;
            const quantity = 1;
            const total = price * quantity;
            const defaultExpireDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

            setSelectedProducts((prev) => [
                ...prev,
                {
                    id: product.id,
                    name: product.name || product.productName,
                    productCode: product.code || product.productCode,
                    productDescription: product.productDescription,
                    unit: 'quả',
                    price,
                    quantity,
                    total,
                    productId: product.id,
                    salePrice: 0,
                    zoneIds: [],
                    expireDate: defaultExpireDate,
                },
            ]);
        }
        setSearchTerm('');
        setFilteredProducts([]);
        setIsSearchFocused(false);
    };

    const handleQuantityChange = (id, delta) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        quantity: Math.max(1, p.quantity + delta),
                        total: (p.price || 0) * Math.max(1, p.quantity + delta),
                    }
                    : p
            )
        );
    };

    const handlePriceChange = (id, newPrice) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        price: newPrice,
                        total: newPrice * (p.quantity || 0),
                    }
                    : p
            )
        );
    };

    const handleSalePriceChange = (id, newSalePrice) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        salePrice: newSalePrice,
                    }
                    : p
            )
        );
    };

    const handleDeleteProduct = (id) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
    };

    const handleZoneChange = (id, zoneIds) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        zoneIds,
                    }
                    : p
            )
        );
    };

    const handleExpireDateChange = (id, newDate) => {
        let formatted = '';
        if (newDate instanceof Date && !isNaN(newDate)) {
            formatted = newDate.toISOString().slice(0, 10);
        }
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? { ...p, expireDate: formatted }
                    : p
            )
        );
    };

    // Category dialog functions
    const handleOpenCategoryDialog = () => {
        setShowCategoryDialog(true);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    const handleCloseCategoryDialog = () => {
        setShowCategoryDialog(false);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        // Lọc sản phẩm theo category
        const filteredProducts = products.filter(product => 
            product.categoryId === category.id || product.category?.id === category.id
        );
        setCategoryProducts(filteredProducts);
    };

    const handleSelectCategoryProduct = (product) => {
        handleSelectProduct(product);
        // Không đóng dialog để có thể chọn thêm sản phẩm khác
    };

    const handleToggleCategoryProduct = (productId) => {
        setSelectedCategoryProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const handleAddSelectedProducts = () => {
        const productsToAdd = categoryProducts.filter((p) => selectedCategoryProducts.includes(p.id));
        productsToAdd.forEach((product) => handleSelectCategoryProduct(product));
        setShowCategoryDialog(false);
        setSelectedCategoryProducts([]);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    // Zone functions
    const handleRemoveZone = (productId, zoneId) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === productId
                    ? { ...p, zoneIds: (p.zoneIds || []).filter((zid) => zid !== zoneId) }
                    : p
            )
        );
    };

    const handleSave = async () => {
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

        setSaving(true);
        setError(null);

        try {
            const importData = {
                supplierId: selectedSupplier,
                storeId: selectedStore || 1,
                staffId: currentUser?.id || 1,
                importTransactionNote: note,
                paidAmount: paidAmount,
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    remainQuantity: product.quantity,
                    expireDate: product.expireDate ? product.expireDate + 'T00:00:00' : '',
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: Array.isArray(product.zoneIds) ? product.zoneIds.map(String) : [],
                })),
            };

            await importTransactionService.update(id, importData);
            setSuccess('Cập nhật phiếu nhập hàng thành công!');
            setHasChanges(false);
        } catch (err) {
            setError('Không thể cập nhật phiếu nhập hàng: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (hasChanges) {
            if (window.confirm('Bạn có chắc chắn muốn rời khỏi? Các thay đổi chưa lưu sẽ bị mất.')) {
                navigate('/import');
            }
        } else {
            navigate('/import');
        }
    };

    // DataGrid columns
    const columns = [
        columnVisibility['STT'] && {
            field: 'stt',
            headerName: 'STT',
            width: 80,
            renderCell: (params) => {
                if (typeof params.rowIndex === 'number') return params.rowIndex + 1;
                if (params.id) {
                    const idx = selectedProducts.findIndex(row => row.id === params.id);
                    return idx >= 0 ? idx + 1 : '';
                }
                return '';
            }
        },
        columnVisibility['Tên hàng'] && { 
            field: 'name', 
            headerName: 'Tên hàng', 
            width: 200,
            renderCell: (params) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{params.value}</span>
                    <span className="text-xs text-gray-500">Mã: {params.row.productCode}</span>
                </div>
            )
        },
        columnVisibility['ĐVT'] && { 
            field: 'unit', 
            headerName: 'ĐVT', 
            width: 120,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <Select
                        size="small"
                        value={params.row.unit || 'quả'}
                        onChange={(e) => {
                            // Handle unit change logic here
                        }}
                        onClick={e => e.stopPropagation()}
                        sx={{
                            width: '80px',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'transparent',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1976d2',
                            },
                        }}
                    >
                        <MenuItem value="quả">quả</MenuItem>
                        <MenuItem value="khay">khay</MenuItem>
                    </Select>
                </div>
            )
        },
        columnVisibility['Số lượng'] && {
            field: 'quantity',
            headerName: 'Số lượng',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full gap-1">
                    <button 
                        onClick={e => { e.stopPropagation(); handleQuantityChange(params.row.id, -1); }} 
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                    >
                        –
                    </button>
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.quantity || 1}
                        onChange={(e) => handleQuantityChange(params.row.id, Number(e.target.value) - (params.row.quantity || 1))}
                        onClick={e => e.stopPropagation()}
                        sx={{
                            width: '60px',
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                        }}
                    />
                    <button 
                        onClick={e => { e.stopPropagation(); handleQuantityChange(params.row.id, 1); }} 
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                    >
                        +
                    </button>
                </div>
            )
        },
        columnVisibility['Đơn giá'] && {
            field: 'price',
            headerName: 'Đơn giá',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
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
                            endAdornment: <span className="text-gray-500">VND</span>,
                        }}
                        sx={{
                            width: '100px',
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                        }}
                    />
                </div>
            ),
        },
        columnVisibility['Giá bán'] && {
            field: 'salePrice',
            headerName: 'Giá bán',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <TextField
                        size="small"
                        type="text"
                        variant="standard"
                        value={(params.row.salePrice || 0).toLocaleString('vi-VN')}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '');
                            handleSalePriceChange(params.row.id, Number(value) || 0);
                        }}
                        onClick={e => e.stopPropagation()}
                        InputProps={{
                            endAdornment: <span className="text-gray-500">VND</span>,
                        }}
                        sx={{
                            width: '100px',
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
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
                return price * quantity;
            },
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => {
                const price = parseFloat(params.row.price) || 0;
                const quantity = parseInt(params.row.quantity) || 0;
                const total = price * quantity;
                return (
                    <div className="text-right w-full font-semibold text-green-600">
                        {formatCurrency(total)}
                    </div>
                );
            },
        },
        columnVisibility['Zone'] && {
            field: 'zoneIds',
            headerName: 'Vị trí',
            width: 260,
            renderCell: (params) => {
                const selectedZoneIds = Array.isArray(params.row.zoneIds) ? params.row.zoneIds : [];
                return (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
                        {/* Vùng chip */}
                        <div style={{ display: 'flex', flex: 1, alignItems: 'center', minHeight: 36, gap: 4, position: 'relative' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', minHeight: 36, cursor: 'pointer', width: '100%' }}>
                                {selectedZoneIds.length === 0 ? (
                                    <em className="text-gray-400">Chọn vị trí</em>
                                ) : (
                                    <>
                                        {selectedZoneIds.slice(0, 2).map((zoneId) => {
                                            const zone = zones.find(z => z.id === zoneId);
                                            return zone ? (
                                                <Chip
                                                    key={zoneId}
                                                    label={zone.name || zone.zoneName}
                                                    size="small"
                                                    sx={{
                                                        background: '#e3f0ff',
                                                        color: '#1976d2',
                                                        fontWeight: 600,
                                                        borderRadius: 1.5,
                                                        height: 24,
                                                    }}
                                                />
                                            ) : null;
                                        })}
                                        {selectedZoneIds.length > 2 && (
                                            <Chip
                                                key={`more-${selectedZoneIds.length}`}
                                                label={`+${selectedZoneIds.length - 2}`}
                                                size="small"
                                                sx={{ background: '#e3f0ff', color: '#1976d2', fontWeight: 600, borderRadius: 1.5, height: 24 }}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                            {/* Select chỉ phủ lên vùng chip */}
                            <Select
                                size="small"
                                variant="standard"
                                multiple
                                value={selectedZoneIds}
                                onChange={(e) => handleZoneChange(params.row.id, typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                onClick={e => e.stopPropagation()}
                                displayEmpty
                                renderValue={() => null}
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                    height: '100%',
                                    minWidth: 180,
                                    padding: 0,
                                    background: 'transparent',
                                    '& .MuiSelect-select': { padding: 0, height: '100%' },
                                    '& .MuiInput-underline:before': { borderBottomColor: '#bcd0ee', borderBottomWidth: 2 },
                                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2', borderBottomWidth: 2 },
                                    '& .MuiInput-underline:hover:before': { borderBottomColor: '#1976d2' },
                                    '& .MuiSelect-icon': {
                                        right: 8,
                                        position: 'absolute',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'auto',
                                    },
                                    zIndex: 1,
                                    cursor: 'pointer',
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: 320,
                                            minWidth: 220,
                                            borderRadius: 12,
                                            boxShadow: '0 8px 32px 0 rgba(25, 118, 210, 0.10)',
                                            padding: 12,
                                        },
                                        sx: {
                                            '& .MuiMenu-list': {
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: 1,
                                            },
                                        },
                                    },
                                }}
                            >
                                {zones.map((zone) => (
                                    <MenuItem key={zone.id} value={zone.id} style={{ borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px' }}>
                                        <Checkbox checked={selectedZoneIds.includes(zone.id)} color="primary" size="small" style={{ padding: 2 }} onClick={e => e.stopPropagation()} />
                                        <span className="font-medium text-xs truncate">{zone.name || zone.zoneName}</span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </div>
                        {/* Icon con mắt nằm ngoài vùng Select, luôn bấm được */}
                        <IconButton size="small" style={{ marginLeft: 8, color: '#1976d2', zIndex: 2 }} onClick={e => { e.stopPropagation(); setZonePopoverAnchor(e.currentTarget); setZonePopoverProductId(params.row.id); }}>
                            <VisibilityIcon />
                        </IconButton>
                    </div>
                );
            },
        },
        columnVisibility['Ngày hết hạn'] && {
            field: 'expireDate',
            headerName: 'Ngày hết hạn',
            width: 170,
            renderCell: (params) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                        <DatePicker
                            format="dd/MM/yyyy"
                            value={params.row.expireDate ? new Date(params.row.expireDate) : null}
                            onChange={(date) => handleExpireDateChange(params.row.id, date)}
                            onClick={e => e.stopPropagation()}
                            slotProps={{
                                textField: {
                                    variant: 'standard',
                                    size: 'small',
                                    sx: {
                                        width: '130px',
                                        textAlign: 'center',
                                        '& .MuiInputBase-input': {
                                            textAlign: 'center',
                                            padding: 0,
                                        },
                                        '& .MuiInput-underline:before': {
                                            borderBottomColor: 'transparent',
                                        },
                                        '& .MuiInput-underline:after': {
                                            borderBottomColor: '#1976d2',
                                        },
                                    },
                                    inputProps: { style: { textAlign: 'center' } },
                                }
                            }}
                        />
                    </LocalizationProvider>
                </div>
            ),
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Tooltip title="Xóa">
                    <IconButton size="small" onClick={e => { e.stopPropagation(); handleDeleteProduct(params.row.id); }}>
                        <FaRegTrashCan />
                    </IconButton>
                </Tooltip>
            ),
        },
    ].filter(Boolean);

    // Calculate total
    const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <CircularProgress size={60} />
                <Typography variant="h6" className="ml-4">Đang tải dữ liệu...</Typography>
            </div>
        );
    }

    return (
        <div className="flex w-full h-screen bg-gray-100">
            {error && <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{error}</Alert>}
            {success && <Alert severity="success" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">{success}</Alert>}

            <div className="flex-1 p-4 bg-white rounded-md m-4 shadow-md overflow-auto">
                <div className="flex justify-between items-center mb-2">
                    <div className="relative w-full max-w-2xl flex items-center gap-2">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsSearchFocused(true)}
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
                        <Tooltip title="Thêm từ nhóm hàng">
                            <IconButton onClick={handleOpenCategoryDialog}>
                                <MdCategory />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Tạo mới hàng hóa">
                            <IconButton onClick={() => setOpenDialog(true)}>
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                        {(isSearchFocused || searchTerm.trim() !== '') && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-96 max-w-xl w-full font-medium text-base max-h-80 overflow-y-auto overflow-x-hidden transition-all duration-200">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product, index) => (
                                        <div
                                            key={product.id || index}
                                            onClick={() => handleSelectProduct(product)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onMouseLeave={() => setActiveIndex(-1)}
                                            className={`flex items-center gap-3 px-7 py-3 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors duration-150
                                                ${activeIndex === index ? 'bg-blue-100/70 text-blue-900 font-bold scale-[1.01] shadow-sm' : 'hover:bg-blue-50/80'}
                                            `}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold truncate max-w-[180px]">{product.name || product.productName}</span>
                                                <span className="text-xs font-semibold text-blue-700 truncate">Mã: {product.code || product.productCode || 'N/A'}</span>
                                            </div>
                                            {product.price && (
                                                <span className="ml-2 text-xs text-green-600 font-semibold truncate max-w-[90px]">{product.price.toLocaleString('vi-VN')}₫</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-7 py-4 text-center text-gray-400">Không tìm thấy sản phẩm</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="ml-auto">
                        <Tooltip title="Ẩn/hiện cột hiển thị">
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                                <VisibilityIcon />
                            </IconButton>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                            {Object.entries(columnVisibility).map(([col, visible]) => (
                                <MenuItem key={col} dense>
                                    <MuiFormControlLabel 
                                        control={<Checkbox checked={visible} onChange={() => setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }))} />} 
                                        label={col} 
                                    />
                                </MenuItem>
                            ))}
                        </Menu>
                    </div>
                </div>

                <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                        rows={selectedProducts}
                        columns={columns}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                        disableSelectionOnClick
                        getRowId={(row) => row.id}
                        sx={highlightProducts ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 4, background: '#fff6f6' } : {}}
                    />
                </div>
            </div>

            <EditSidebar
                currentUser={currentUser}
                currentTime={currentTime}
                importCode={importCode}
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
                importDate={importDate}
                setImportDate={setImportDate}
                totalAmount={totalAmount}
                paidAmount={paidAmount}
                paidAmountInput={paidAmountInput}
                setPaidAmountInput={setPaidAmountInput}
                setPaidAmount={setPaidAmount}
                highlightSupplier={highlightSupplier}
                highlightStore={highlightStore}
                hasChanges={hasChanges}
                onSave={handleSave}
                onBack={handleBack}
                saving={saving}
            />

            {/* Add Product Dialog */}
            <AddProductDialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                onProductCreated={() => {
                    // Refresh products
                    productService.getAllProducts().then(setProducts);
                }}
                onProductAdded={(newProduct) => {
                    handleSelectProduct(newProduct);
                    setOpenDialog(false);
                }}
                unit="quả"
            />

            {/* Category Dialog */}
            <ImportCategoryDialog
                open={showCategoryDialog}
                onClose={handleCloseCategoryDialog}
                categories={categories}
                products={products}
                selectedCategory={selectedCategory}
                categoryProducts={categoryProducts}
                selectedCategoryProducts={selectedCategoryProducts}
                onSelectCategory={handleSelectCategory}
                onToggleProduct={handleToggleCategoryProduct}
                onAddProducts={handleAddSelectedProducts}
            />

            {/* Zone Popover */}
            <Popover
                open={Boolean(zonePopoverAnchor)}
                anchorEl={zonePopoverAnchor}
                onClose={() => { setZonePopoverAnchor(null); setZonePopoverProductId(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { p: 2, minWidth: 260, maxWidth: 400, maxHeight: 300, overflowY: 'auto', borderRadius: 3 } }}
            >
                <div className="font-semibold mb-2 text-blue-700">Vị trí đã chọn</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(() => {
                        const product = selectedProducts.find(p => p.id === zonePopoverProductId);
                        if (!product || !Array.isArray(product.zoneIds) || product.zoneIds.length === 0) {
                            return <span className="text-gray-400">Chưa chọn vị trí nào</span>;
                        }
                        return product.zoneIds.map(zoneId => {
                            const zone = zones.find(z => z.id === zoneId);
                            return zone ? (
                                <Chip
                                    key={zoneId}
                                    label={zone.name || zone.zoneName}
                                    size="small"
                                    onDelete={() => handleRemoveZone(product.id, zoneId)}
                                    sx={{
                                        background: '#e3f0ff',
                                        color: '#1976d2',
                                        fontWeight: 600,
                                        borderRadius: 1.5,
                                        height: 24,
                                    }}
                                />
                            ) : null;
                        });
                    })()}
                </div>
            </Popover>
        </div>
    );
};

export default EditPage; 