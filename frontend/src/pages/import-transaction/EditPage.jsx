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
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DataGrid } from '@mui/x-data-grid';
import { FaRegTrashCan } from "react-icons/fa6";
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';

import AddProductDialog from '../../components/import-transaction/AddProductDialog.jsx';

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
    const [allZones, setAllZones] = useState([]); // Lưu tất cả zones
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
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    
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

    // Zone dropdown states
    const [openDropdowns, setOpenDropdowns] = useState({});
    const selectRefs = useRef({});

    // Summary dialog states
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [supplierDetails, setSupplierDetails] = useState(null);
    const [storeDetails, setStoreDetails] = useState(null);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Kiểm tra nếu click ra ngoài dropdown
            if (!event.target.closest('.MuiSelect-select') && !event.target.closest('.MuiMenu-root')) {
                setOpenDropdowns({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load current user
                const currentUserData = await userService.getCurrentUser();
                setCurrentUser(currentUserData);

                // Load other data first
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
                setAllZones(zonesData); // Lưu tất cả zones
                setZones(zonesData); // Zones hiện tại (có thể đã được filter theo store)
                setStores(storesData);

                // Load import transaction data
                const importData = await importTransactionService.getById(id);
                
                // Check if transaction exists and is editable
                if (!importData) {
                    throw new Error('Không tìm thấy phiếu nhập hàng');
                }
                
                // Check if transaction status allows editing
                if (importData.status !== 'DRAFT') {
                    throw new Error(`Không thể sửa phiếu nhập hàng ở trạng thái "${getStatusLabel(importData.status)}". Chỉ có thể sửa phiếu ở trạng thái "Nháp".`);
                }
                
                setOriginalData(importData);
                
                // Set form data
                setImportCode(importData.name || '');
                setSelectedSupplier(importData.supplierId || '');
                setSelectedStore(importData.storeId || (storesData.length > 0 ? storesData[0].id : ''));
                setNote(importData.importTransactionNote || '');
                setPaidAmount(importData.paidAmount || 0);
                setPaidAmountInput(String(importData.paidAmount || 0));
                setImportDate(importData.importDate ? new Date(importData.importDate) : new Date());
                
                // Set search values for supplier and store
                    const supplier = suppliersData.find(s => s.id === importData.supplierId);
                    if (supplier) {
                        setSupplierSearch(supplier.name);
                    console.log('Set supplier search:', supplier.name);
                    }
                    const store = storesData.find(s => s.id === importData.storeId);
                    if (store) {
                    setStoreSearch(store.storeName);
                } else {
                    // If no store is selected, use the first available store
                    if (storesData.length > 0) {
                        setStoreSearch(storesData[0].storeName);
                        setSelectedStore(storesData[0].id);
                    }
                }
                
                // Set products with proper data mapping
                if (importData.details) {
                    const formattedProducts = importData.details.map(detail => {
                        // Find the product in the loaded products data
                        const product = productsData.find(p => p.id === detail.productId);
                        
                        // Debug logging
                        console.log('Processing detail:', detail);
                        console.log('Found product:', product);
                        
                        const formattedProduct = {
                        id: detail.productId,
                            name: product?.name || product?.productName || detail.product?.name || detail.product?.productName || 'Không xác định',
                            productCode: product?.code || product?.productCode || detail.product?.code || detail.product?.productCode || 'N/A',
                            productDescription: product?.productDescription || detail.product?.productDescription,
                        unit: 'quả',
                        price: detail.unitImportPrice || 0,
                        quantity: detail.importQuantity || 0,
                        total: (detail.unitImportPrice || 0) * (detail.importQuantity || 0),
                        productId: detail.productId,
                        salePrice: detail.unitSalePrice || 0,
                            zoneIds: detail.zones_id ? detail.zones_id.map(id => Number(id)) : [],
                        expireDate: detail.expireDate ? detail.expireDate.split('T')[0] : '',
                        };
                        
                        console.log('Formatted product:', formattedProduct);
                        return formattedProduct;
                    });
                    setSelectedProducts(formattedProducts);
                }
                
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
        if (supplierSearch && supplierSearch.trim() !== '') {
            setFilteredSuppliers(suppliers.filter(s => s.name?.toLowerCase().includes(supplierSearch.toLowerCase())));
        } else if (supplierDropdownOpen) {
            setFilteredSuppliers(suppliers.slice(0, 5));
        } else {
            setFilteredSuppliers([]);
        }
    }, [suppliers, supplierSearch, supplierDropdownOpen]);

    // Cập nhật filteredStores khi search hoặc focus
    useEffect(() => {
        if (storeSearch && storeSearch.trim() !== '') {
            const filtered = stores.filter(s => s.storeName?.toLowerCase().includes(storeSearch.toLowerCase()));
            setFilteredStores(filtered);
        } else if (storeDropdownOpen) {
            setFilteredStores(stores.slice(0, 5));
        } else {
            setFilteredStores([]);
        }
    }, [stores, storeSearch, storeDropdownOpen]);

    // Filter zones theo store được chọn
    useEffect(() => {
        if (selectedStore && allZones.length > 0) {
            // Nếu là STAFF, zones đã được filter từ backend
            if (currentUser?.roles?.includes('STAFF')) {
                setZones(allZones);
            } else {
                // Nếu là MANAGER/ADMIN, filter zones theo store được chọn
                const filtered = allZones.filter(zone => zone.storeId === selectedStore);
                setZones(filtered);
            }
        } else {
            setZones([]);
        }

        // Clear zone selection khi store thay đổi
        setSelectedProducts(prev => prev.map(product => ({
            ...product,
            zoneIds: []
        })));

        // Clear error và highlight khi store được chọn
        if (selectedStore) {
            setError(null);
            setHighlightStore(false);
        }
    }, [selectedStore, allZones, currentUser]);

    // Update current time
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl+S to save
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                if (hasChanges && !saving) {
                    handleSave();
                }
            }
            
            // Escape to go back
            if (event.key === 'Escape') {
                handleBack();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges, saving]);

    // Search functionality
    useEffect(() => {
        if (searchTerm && searchTerm.trim() !== '') {
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

    const getStatusLabel = (status) => {
        switch (status) {
            case 'DRAFT':
                return 'Nháp';
            case 'WAITING_FOR_APPROVE':
                return 'Chờ xử lý';
            case 'COMPLETE':
                return 'Đã hoàn thành';
            case 'CANCEL':
                return 'Đã hủy';
            default:
                return status;
        }
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

            const newProduct = {
                    id: product.id,
                name: product.name || product.productName || 'Không xác định',
                productCode: product.code || product.productCode || 'N/A',
                    productDescription: product.productDescription,
                    unit: 'quả',
                    price,
                    quantity,
                    total,
                    productId: product.id,
                    salePrice: 0,
                    zoneIds: [],
                    expireDate: defaultExpireDate,
            };

            console.log('Adding new product:', newProduct);
            setSelectedProducts((prev) => [...prev, newProduct]);
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

    // Hàm lấy chi tiết nhà cung cấp
    const fetchSupplierDetails = async (supplierId) => {
        if (!supplierId) return null;
        try {
            // Tìm supplier từ danh sách đã load
            const supplier = suppliers.find(s => s.id === supplierId);
            setSupplierDetails(supplier || null);
        } catch (error) {
            setSupplierDetails(null);
        }
    };

    // Hàm lấy chi tiết cửa hàng
    const fetchStoreDetails = async (storeId) => {
        if (!storeId) return null;
        try {
            // Tìm store từ danh sách đã load
            const store = stores.find(s => s.id === storeId);
            setStoreDetails(store || null);
        } catch (error) {
            setStoreDetails(null);
        }
    };

    const handleSave = async () => {
        // Validate required fields
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

        // Hiển thị summary dialog
        await handleShowSummary();
    };

    // Xử lý mở dialog tổng kết
    const handleShowSummary = async () => {
        await fetchSupplierDetails(selectedSupplier);
        await fetchStoreDetails(selectedStore);
        
        setSummaryData({
            importCode: importCode,
            supplier: suppliers.find(s => s.id === selectedSupplier) || {},
            store: stores.find(s => s.id === selectedStore) || {},
            products: selectedProducts,
            zones: zones, // Thêm zones để hiển thị trong summary
            totalAmount,
            paidAmount,
            note,
            importDate: importDate,
            status: 'DRAFT',
        });
        setShowSummaryDialog(true);
    };

    // Xác nhận lưu thay đổi
    const handleConfirmSummary = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await performSave();
            setShowSummaryDialog(false);
            setSummaryData(null);
        } catch (err) {
            setError('Không thể lưu thay đổi');
        } finally {
            setSaving(false);
        }
    };

    const performSave = async () => {
        setSaving(true);
        setError(null);
        setShowSaveConfirm(false);

        try {
            const importData = {
                supplierId: selectedSupplier,
                storeId: selectedStore || (stores.length > 0 ? stores[0].id : 1),
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
            
            // Refresh original data to reflect changes
            setTimeout(() => {
                importTransactionService.getById(id).then(setOriginalData);
            }, 1000);
        } catch (err) {
            let errorMessage = 'Không thể cập nhật phiếu nhập hàng';
            
            if (err.response?.data?.message) {
                errorMessage += ': ' + err.response.data.message;
            } else if (err.message) {
                errorMessage += ': ' + err.message;
            }
            
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const checkSignificantChanges = () => {
        if (!originalData) return false;
        
        // Check if supplier changed
        if (originalData.supplierId !== selectedSupplier) return true;
        
        // Check if total amount changed significantly (more than 10%)
        const originalTotal = originalData.details?.reduce((sum, detail) => 
            sum + (detail.unitImportPrice || 0) * (detail.importQuantity || 0), 0) || 0;
        const currentTotal = selectedProducts.reduce((sum, product) => 
            sum + (product.price || 0) * (product.quantity || 0), 0);
        
        const changePercentage = Math.abs(currentTotal - originalTotal) / originalTotal;
        if (changePercentage > 0.1) return true;
        
        // Check if number of products changed significantly
        const originalProductCount = originalData.details?.length || 0;
        const currentProductCount = selectedProducts.length;
        if (Math.abs(currentProductCount - originalProductCount) > 2) return true;
        
        return false;
    };

    const [showBackConfirm, setShowBackConfirm] = useState(false);

    const handleBack = () => {
        // Kiểm tra thực sự có thay đổi hay không
        const hasSignificantChanges = checkSignificantChanges();
        
        if (hasSignificantChanges) {
            setShowBackConfirm(true);
        } else {
            navigate('/import');
        }
    };

    const handleConfirmBack = () => {
        setShowBackConfirm(false);
        navigate('/import');
    };

    const handleCancelBack = () => {
        setShowBackConfirm(false);
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
                    <span className="font-semibold">{params.value || 'Không xác định'}</span>
                    <span className="text-xs text-gray-500">Mã: {params.row.productCode || 'N/A'}</span>
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
            renderHeader: () => (
                <span>
                    Đơn giá<span style={{ color: '#6b7280', fontSize: '0.875em' }}>/quả</span>
                </span>
            ),
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
            renderHeader: () => (
                <span>
                    Giá bán<span style={{ color: '#6b7280', fontSize: '0.875em' }}>/quả</span>
                </span>
            ),
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
            width: 240,
            renderCell: (params) => {
                const selectedZoneIds = Array.isArray(params.row.zoneIds) ? params.row.zoneIds : [];
                
                // Kiểm tra nếu chưa chọn store và là MANAGER/ADMIN
                if ((currentUser?.roles?.includes("MANAGER") || currentUser?.roles?.includes("ADMIN")) && !selectedStore) {
                return (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            padding: '0 8px'
                        }}>
                            <span style={{ 
                                color: '#856404', 
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '4px',
                                padding: '4px 8px'
                            }}>
                                <span style={{ 
                                    width: '4px', 
                                    height: '4px', 
                                    backgroundColor: '#f39c12', 
                                    borderRadius: '50%',
                                    flexShrink: 0
                                }}></span>
                                Chọn cửa hàng trước
                            </span>
                        </div>
                    );
                }

                return (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '100%', 
                        height: '100%',
                        position: 'relative',
                        padding: '0 8px'
                    }}>
                        {/* Vùng hiển thị zones đã chọn */}
                        <div 
                            style={{ 
                                display: 'flex', 
                                flex: 1, 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                height: '32px',
                                gap: 4, 
                                position: 'relative',
                                padding: '0 8px',
                                backgroundColor: selectedZoneIds.length > 0 ? '#f8f9fa' : '#ffffff',
                                border: selectedZoneIds.length > 0 ? '1px solid #e9ecef' : '1px solid #dee2e6',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease',
                                overflow: 'hidden',
                                maxWidth: '200px',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                
                                // Kiểm tra nếu là ADMIN/MANAGER và chưa chọn store
                                const isAdminOrManager = currentUser?.roles?.includes("ROLE_MANAGER") || currentUser?.roles?.includes("ROLE_ADMIN");
                                if (isAdminOrManager && !selectedStore) {
                                    setError('Vui lòng chọn cửa hàng trước khi chọn khu vực');
                                    setHighlightStore(true);
                                    return;
                                }
                                
                                // Toggle dropdown state
                                setOpenDropdowns(prev => ({
                                    ...prev,
                                    [params.row.id]: !prev[params.row.id]
                                }));
                            }}
                        >
                            {/* Text placeholder luôn hiển thị khi không có zone nào được chọn */}
                            {selectedZoneIds.length === 0 && (
                                <span style={{ 
                                    color: '#6c757d', 
                                    fontSize: '0.75rem',
                                    fontStyle: 'italic',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                    position: 'absolute',
                                    left: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 4
                                }}>
                                    <span style={{ 
                                        width: '3px', 
                                        height: '3px', 
                                        backgroundColor: '#adb5bd', 
                                        borderRadius: '50%',
                                        flexShrink: 0
                                    }}></span>
                                    Chọn vị trí
                                </span>
                            )}
                            
                            <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: 2, 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                height: '24px', 
                                cursor: 'pointer', 
                                width: '100%',
                                maxWidth: '160px',
                                position: 'relative',
                                zIndex: 3,
                                overflow: 'hidden'
                            }}>
                                {selectedZoneIds.length > 0 && (
                                    <>
                                        {selectedZoneIds.map((zoneId, index) => {
                                            const zone = zones.find(z => z.id === zoneId);
                                            if (!zone) return null;
                                            
                                            // Chỉ hiển thị tối đa 2 zones đầu tiên
                                            if (index < 2) {
                                                return (
                                                <Chip
                                                    key={zoneId}
                                                    label={zone.name || zone.zoneName}
                                                    size="small"
                                                        onClick={(e) => e.stopPropagation()}
                                                    sx={{
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            color: 'white',
                                                            fontWeight: '600',
                                                            borderRadius: '6px',
                                                            height: '18px',
                                                            fontSize: '0.65rem',
                                                            maxWidth: '50px',
                                                            flexShrink: 0,
                                                            '& .MuiChip-label': {
                                                                padding: '0 4px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            },
                                                            '&:hover': {
                                                                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                                                transform: 'translateY(-1px)',
                                                                boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                                            },
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    />
                                                );
                                            }
                                            
                                            // Nếu có nhiều hơn 2 zones, hiển thị "+..." ở vị trí thứ 3
                                            if (index === 2) {
                                                return (
                                            <Chip
                                                key={`more-${selectedZoneIds.length}`}
                                                label={`+${selectedZoneIds.length - 2}`}
                                                size="small"
                                                        onClick={(e) => e.stopPropagation()}
                                                        sx={{ 
                                                            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                                            color: '#d63384',
                                                            fontWeight: '700',
                                                            borderRadius: '6px',
                                                            height: '18px',
                                                            fontSize: '0.65rem',
                                                            minWidth: '20px',
                                                            flexShrink: 0,
                                                            '& .MuiChip-label': {
                                                                padding: '0 3px'
                                                            },
                                                            '&:hover': {
                                                                background: 'linear-gradient(135deg, #ffe4b5 0%, #fbb040 100%)',
                                                                transform: 'translateY(-1px)',
                                                                boxShadow: '0 2px 6px rgba(252, 182, 159, 0.3)'
                                                            },
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    />
                                                );
                                            }
                                            
                                            return null;
                                        })}
                                    </>
                                )}
                            </div>
                            
                            {/* Select dropdown */}
                            <Select
                                ref={(el) => {
                                    if (el) {
                                        selectRefs.current[params.row.id] = el;
                                    }
                                }}
                                size="small"
                                variant="standard"
                                multiple
                                open={openDropdowns[params.row.id] || false}
                                onOpen={() => setOpenDropdowns(prev => ({ ...prev, [params.row.id]: true }))}
                                onClose={() => setOpenDropdowns(prev => ({ ...prev, [params.row.id]: false }))}
                                value={selectedZoneIds}
                                onChange={(e) => {
                                    handleZoneChange(params.row.id, typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value);
                                    // Don't close dropdown after selection to allow multiple selections
                                }}
                                onClick={e => e.stopPropagation()}
                                displayEmpty
                                disabled={(currentUser?.roles?.includes("MANAGER") || currentUser?.roles?.includes("ADMIN")) && !selectedStore}
                                renderValue={(selected) => {
                                    return selected && selected.length > 0
                                        ? selected
                                            .map(id => {
                                                const zone = zones.find(z => z.id === id);
                                                return zone ? (zone.name || zone.zoneName) : id;
                                            })
                                            .join(', ')
                                        : '';
                                }}
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                    height: '100%',
                                    minWidth: 160,
                                    padding: 0,
                                    background: 'transparent',
                                    '& .MuiSelect-select': { 
                                        padding: 0, 
                                        height: '100%',
                                        opacity: 0,
                                        color: 'transparent'
                                    },
                                    '& .MuiInput-underline:before': { 
                                        borderBottomColor: 'transparent' 
                                    },
                                    '& .MuiInput-underline:after': { 
                                        borderBottomColor: 'transparent' 
                                    },
                                    '& .MuiInput-underline:hover:before': { 
                                        borderBottomColor: 'transparent' 
                                    },
                                    '& .MuiSelect-icon': {
                                        right: 6,
                                        position: 'absolute',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'auto',
                                        color: '#6c757d',
                                        transition: 'all 0.2s ease',
                                        fontSize: '0.875rem',
                                        zIndex: 2,
                                        '&:hover': {
                                            color: '#495057',
                                            transform: 'translateY(-50%) scale(1.1)'
                                        }
                                    },
                                    zIndex: 1,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        '& .MuiSelect-icon': {
                                            color: '#495057'
                                        }
                                    }
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: 280,
                                            minWidth: 200,
                                            borderRadius: 12,
                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                                            border: '1px solid #e9ecef',
                                            padding: 12,
                                        },
                                        sx: {
                                            '& .MuiMenu-list': {
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, 1fr)',
                                                gap: 1,
                                                padding: 0
                                            },
                                        },
                                    },
                                }}
                            >
                                {zones.map((zone) => (
                                    <MenuItem 
                                        key={zone.id} 
                                        value={zone.id} 
                                        style={{ 
                                            borderRadius: 6, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 4, 
                                            padding: '6px 8px',
                                            margin: '1px 0',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Checkbox 
                                            checked={selectedZoneIds.includes(zone.id)} 
                                            color="primary" 
                                            size="small" 
                                            style={{ 
                                                padding: 1,
                                                color: '#667eea'
                                            }} 
                                            onClick={e => e.stopPropagation()} 
                                        />
                                        <span style={{
                                            fontSize: '0.8rem',
                                            fontWeight: '500',
                                            color: '#495057',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '80px'
                                        }}>
                                            {zone.name || zone.zoneName}
                                        </span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </div>
                        
                        {/* Icon xem chi tiết */}
                        <IconButton 
                            size="small" 
                            style={{ 
                                marginLeft: 6, 
                                color: '#667eea',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: '4px',
                                width: '20px',
                                height: '20px',
                                zIndex: 2,
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                            }} 
                            onClick={e => { 
                                e.stopPropagation(); 
                                
                                // Kiểm tra nếu là ADMIN/MANAGER và chưa chọn store
                                const isAdminOrManager = currentUser?.roles?.includes("ROLE_MANAGER") || currentUser?.roles?.includes("ROLE_ADMIN");
                                if (isAdminOrManager && !selectedStore) {
                                    setError('Vui lòng chọn cửa hàng trước khi xem khu vực');
                                    setHighlightStore(true);
                                    return;
                                }
                                
                                setZonePopoverAnchor(e.currentTarget); 
                                setZonePopoverProductId(params.row.id); 
                            }}
                            sx={{
                                '&:hover': {
                                    backgroundColor: '#667eea',
                                    color: 'white',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                }
                            }}
                        >
                            <VisibilityIcon sx={{ fontSize: '0.75rem' }} />
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
                {/* Header với navigation và search */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
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
                            Sửa phiếu nhập
                        </Button>
                        
                        <div className="flex items-center gap-3">
                            <div className="relative w-80">
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
                            </div>
                            
                        <Tooltip title="Thêm từ nhóm hàng">
                                <IconButton 
                                    onClick={handleOpenCategoryDialog}
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
                                <MdCategory />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Tạo mới hàng hóa">
                                <IconButton 
                                    onClick={() => setOpenDialog(true)}
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
                    </div>

                    <div className="flex items-center gap-2">
                        <Tooltip title="Ẩn/hiện cột hiển thị">
                            <IconButton 
                                onClick={(e) => setAnchorEl(e.currentTarget)}
                                sx={{
                                    color: '#666',
                                    backgroundColor: '#f8f9fa',
                                    '&:hover': {
                                        backgroundColor: '#e9ecef',
                                        transform: 'scale(1.05)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
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
                zones={zones}
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
            <Dialog 
                open={showCategoryDialog}
                onClose={handleCloseCategoryDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle className="flex justify-between items-center text-xl font-bold text-blue-700 border-b border-blue-100 pb-2">
                    <span>Thêm từ nhóm hàng</span>
                    <IconButton onClick={handleCloseCategoryDialog} size="small">
                        <span>×</span>
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-6">
                        {/* Danh sách Category */}
                        <div>
                            <h3 className="font-semibold mb-3 text-blue-600 text-lg">Danh mục sản phẩm</h3>
                            <div className="border border-blue-100 rounded-2xl shadow-sm max-h-60 overflow-y-auto bg-white divide-y divide-blue-50">
                                {categories.length > 0 ? (
                                    categories.map((category) => (
                                        <div
                                            key={category.id}
                                            onClick={() => {
                                                handleSelectCategory(category);
                                                setSelectedCategoryProducts([]);
                                            }}
                                            className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-150 rounded-xl m-2
                                                ${selectedCategory?.id === category.id ? 'bg-blue-50 border border-blue-400 font-bold text-blue-800 shadow' : 'hover:bg-blue-50'}
                                            `}
                                        >
                                            <div className="font-medium text-base">{category.name}</div>
                                            <div className="text-sm text-gray-500 font-semibold bg-blue-100 rounded-full px-3 py-1 ml-2">
                                                {products.filter(p => p.categoryId === category.id || p.category?.id === category.id).length} sản phẩm
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-gray-400">Không có danh mục nào</div>
                                )}
                            </div>
                        </div>

                        {/* Danh sách sản phẩm theo category */}
                        <div>
                            <h3 className="font-semibold mb-3 text-green-700 text-lg">
                                {selectedCategory ? `Sản phẩm - ${selectedCategory.name}` : 'Chọn danh mục để xem sản phẩm'}
                            </h3>
                            <div className="border border-green-100 rounded-2xl shadow-sm max-h-60 overflow-y-auto bg-white divide-y divide-green-50">
                                {selectedCategory ? (
                                    categoryProducts.length > 0 ? (
                                        categoryProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => handleToggleCategoryProduct(product.id)}
                                                className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-150 rounded-xl m-2 font-semibold
                                                    hover:bg-green-50
                                                    ${selectedCategoryProducts.includes(product.id) ? 'bg-green-100/60 border border-green-400 text-green-900 font-bold shadow' : ''}
                                                `}
                                            >
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <span className="font-bold text-base text-gray-900 truncate">{product.name || product.productName}</span>
                                                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-700">
                                                        <span className="truncate">Mã: {product.code || product.productCode || 'N/A'}</span>
                                                    </span>
                                                    {product.productDescription && (
                                                        <span className="text-xs text-gray-500 italic truncate">{product.productDescription}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 ml-2">quả</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-gray-400 flex flex-col items-center gap-2">
                                            <span className="text-3xl">😕</span>
                                            <span>Không có sản phẩm nào trong danh mục này</span>
                                        </div>
                                    )
                                ) : (
                                    <div className="p-6 text-center text-gray-400">Vui lòng chọn một danh mục</div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseCategoryDialog} 
                        color="primary"
                        sx={{
                            color: '#666',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                    >
                        Đóng
                    </Button>
                    <Button 
                        onClick={handleAddSelectedProducts} 
                        variant="contained" 
                        disabled={selectedCategoryProducts.length === 0}
                        sx={{
                            backgroundColor: '#1976d2',
                            color: 'white',
                            '&:hover': { backgroundColor: '#1565c0' },
                            '&:disabled': { backgroundColor: '#ccc', color: '#666' }
                        }}
                    >
                        Thêm {selectedCategoryProducts.length > 0 ? `(${selectedCategoryProducts.length})` : ''} sản phẩm
                    </Button>
                </DialogActions>
            </Dialog>

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
                            const zone = zones.find(z => z.id == zoneId || z.id === parseInt(zoneId));
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

            {/* Save Confirmation Dialog */}
            <Dialog
                open={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <SaveIcon color="primary" />
                    Xác nhận lưu thay đổi
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <div className="text-gray-700">
                        <p>Bạn đã thực hiện một số thay đổi quan trọng:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            {originalData?.supplierId !== selectedSupplier && (
                                <li>Thay đổi nhà cung cấp</li>
                            )}
                            {(() => {
                                const originalTotal = originalData?.details?.reduce((sum, detail) => 
                                    sum + (detail.unitImportPrice || 0) * (detail.importQuantity || 0), 0) || 0;
                                const currentTotal = selectedProducts.reduce((sum, product) => 
                                    sum + (product.price || 0) * (product.quantity || 0), 0);
                                const changePercentage = Math.abs(currentTotal - originalTotal) / originalTotal;
                                if (changePercentage > 0.1) {
                                    return <li>Tổng tiền thay đổi đáng kể ({((changePercentage - 1) * 100).toFixed(1)}%)</li>;
                                }
                                return null;
                            })()}
                            {(() => {
                                const originalProductCount = originalData?.details?.length || 0;
                                const currentProductCount = selectedProducts.length;
                                if (Math.abs(currentProductCount - originalProductCount) > 2) {
                                    return <li>Thay đổi số lượng sản phẩm ({originalProductCount} → {currentProductCount})</li>;
                                }
                                return null;
                            })()}
                        </ul>
                        <p className="mt-3 font-medium">Bạn có chắc chắn muốn lưu những thay đổi này?</p>
                    </div>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={() => setShowSaveConfirm(false)}
                        variant="outlined"
                        sx={{
                            borderColor: '#ddd',
                            color: '#666',
                            '&:hover': {
                                borderColor: '#999',
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={performSave}
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
                        Lưu thay đổi
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Back Confirmation Dialog */}
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
                    <ArrowBackIcon color="warning" />
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
                        onClick={handleCancelBack}
                        variant="outlined"
                        sx={{
                            borderColor: '#ddd',
                            color: '#666',
                            '&:hover': {
                                borderColor: '#999',
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                    >
                        Ở lại
                    </Button>
                    <Button 
                        onClick={handleConfirmBack}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
                            boxShadow: '0 3px 15px rgba(245, 124, 0, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #ef6c00 30%, #f57c00 90%)',
                                boxShadow: '0 5px 20px rgba(245, 124, 0, 0.4)',
                                transform: 'translateY(-1px)'
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Rời khỏi
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Summary Dialog */}
            <ImportSummaryDialog
                open={showSummaryDialog}
                onClose={() => setShowSummaryDialog(false)}
                onConfirm={handleConfirmSummary}
                importData={summaryData}
                formatCurrency={formatCurrency}
                loading={saving}
                currentUser={currentUser}
                supplierDetails={supplierDetails}
                storeDetails={storeDetails}
            />
        </div>
    );
};

export default EditPage; 