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
// Không cần import FiPlus nữa vì đã dùng Material-UI icons
import AddIcon from '@mui/icons-material/Add';
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
import { useNavigate, useLocation } from 'react-router-dom';

import importTransactionService from '../../services/importTransactionService';
import { userService } from '../../services/userService';
import { getCategories } from '../../services/categoryService';
import ImportSummaryDialog from '../../components/import-transaction/ImportSummaryDialog';
import ImportSidebar from '../../components/import-transaction/ImportSidebar';
import { useNotification } from '../../contexts/NotificationContext';
const ImportPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { createImportTransactionNotification } = useNotification();
    const [currentUser, setCurrentUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false); // Thêm state này
    const [activeIndex, setActiveIndex] = useState(-1); // Thêm state highlight dòng hover
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng': true,
        'Đơn giá': true,
        'Giá bán': true,
        'Zone': true,
        'Thành tiền': true,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [zones, setZones] = useState([]);
    const [allZones, setAllZones] = useState([]); // Lưu tất cả zones
    const [filteredZones, setFilteredZones] = useState([]); // Zones được filter theo store
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);

    // State for locked store from stocktake
    const [lockedStoreId, setLockedStoreId] = useState(null);
    const [lockedStoreName, setLockedStoreName] = useState(null);
    const [fromStocktake, setFromStocktake] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [supplierDetails, setSupplierDetails] = useState(null);
    const [storeDetails, setStoreDetails] = useState(null);
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');

    const [nextImportCode, setNextImportCode] = useState('');
    const [note, setNote] = useState('');
    const [paidAmount, setPaidAmount] = useState(0);
    const [paidAmountInput, setPaidAmountInput] = useState('0');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [highlightSupplier, setHighlightSupplier] = useState(false);
    const [highlightStore, setHighlightStore] = useState(false);
    const [highlightProducts, setHighlightProducts] = useState(false);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]); // Sản phẩm đã chọn trong dialog

    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [storeSearch, setStoreSearch] = useState('');
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [filteredStores, setFilteredStores] = useState([]);
    const [zoneSearch, setZoneSearch] = useState('');
    const [showBackConfirm, setShowBackConfirm] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [shouldSaveTemp, setShouldSaveTemp] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);

    const [zonePopoverAnchor, setZonePopoverAnchor] = useState(null);
    const [zonePopoverProductId, setZonePopoverProductId] = useState(null);
    const [openDropdowns, setOpenDropdowns] = useState({});
    const [isClient, setIsClient] = useState(false);

    const zoneSearchInputRef = useRef();
    const selectRefs = useRef({});

    // Đơn vị tính mặc định cho sản phẩm mới
    const defaultUnit = 'quả';

    // Auto-dismiss error/success after 5s
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

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load current user
                const currentUserData = await userService.getCurrentUser();
                setCurrentUser(currentUserData);

                // Load form data (includes all data filtered by user role)
                const formData = await importTransactionService.getCreateFormData();
                setSuppliers(formData.customers || []); // customers are suppliers in import
                setProducts(formData.products || []);
                setAllZones(formData.zones || []); // Lưu tất cả zones
                setZones(formData.zones || []); // Zones hiện tại (có thể đã được filter theo store)
                setStores(formData.stores || []); // stores are filtered by user role

                // Auto-select store for STAFF users (if they have only one store)
                if (formData.stores && formData.stores.length === 1) {
                    setSelectedStore(formData.stores[0].id);
                }

                // Load categories
                const categoriesData = await getCategories();
                setCategories(categoriesData);

                // Lấy mã phiếu nhập tiếp theo
                const code = await importTransactionService.getNextCode();
                setNextImportCode(code);
            } catch (error) {
                setError('Không thể tải dữ liệu: ' + error.message);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Function để refresh products sau khi tạo mới
    const refreshProducts = async () => {
        try {
            const formData = await importTransactionService.getCreateFormData();
            setProducts(formData.products || []);
        } catch (error) {
            console.error('Failed to refresh products:', error);
        }
    };

    // Function để thêm product mới vào bảng
    const handleAddNewProduct = (newProduct) => {
        // Kiểm tra cửa hàng trước khi thêm sản phẩm
        if (!checkStoreBeforeSearch()) {
            return;
        }

        // Kiểm tra xem product đã có trong bảng chưa
        if (!selectedProducts.find((p) => p.id === newProduct.id)) {
            const price = 0; // Để user nhập vào
            const quantity = 1;
            const total = price * quantity;
            const defaultExpireDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 2 tuần, yyyy-MM-dd

            setSelectedProducts((prev) => [
                ...prev,
                {
                    id: newProduct.id,
                    name: newProduct.name || newProduct.productName,
                    productCode: newProduct.code || newProduct.productCode,
                    productDescription: newProduct.productDescription,
                    unit: 'quả',
                    price,
                    quantity,
                    total,
                    productId: newProduct.id,
                    salePrice: 0,
                    zoneId: '',
                    expireDate: defaultExpireDate,
                },
            ]);
        }
    };

    // Cập nhật category products khi products, selectedCategory hoặc selectedStore thay đổi
    useEffect(() => {
        if (selectedCategory) {
            const filteredProducts = products.filter(product => {
                // Lọc theo category
                const matchesCategory = product.categoryId === selectedCategory.id || product.category?.id === selectedCategory.id;
                
                // Lọc theo store (nếu đã chọn store)
                const matchesStore = selectedStore ? product.storeId === selectedStore : true;
                
                return matchesCategory && matchesStore;
            });
            setCategoryProducts(filteredProducts);
        }
    }, [products, selectedCategory, selectedStore]);

    // Cập nhật search results khi products, searchTerm, isSearchFocused hoặc selectedStore thay đổi
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            // Ưu tiên lọc searchTerm nếu có nhập, và lọc theo store
            const results = products.filter(
                (p) => {
                    const name = p.name || p.productName || '';
                    const code = p.code || '';
                    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        code.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    // Lọc theo store (nếu đã chọn store)
                    const matchesStore = selectedStore ? p.storeId === selectedStore : true;
                    
                    return matchesSearch && matchesStore;
                }
            );
            setFilteredProducts(results);
        } else if (isSearchFocused) {
            // Nếu chưa nhập gì và đang focus thì gợi ý 5 sản phẩm đầu tiên (theo store)
            const storeProducts = selectedStore ? 
                products.filter(p => p.storeId === selectedStore) : 
                products;
            setFilteredProducts(storeProducts.slice(0, 5));
        } else {
            // Không focus và không nhập thì không gợi ý gì
            setFilteredProducts([]);
        }
    }, [products, searchTerm, isSearchFocused, selectedStore]);

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
            const filtered = stores.filter(s => 
                s.storeName?.toLowerCase().includes(storeSearch.toLowerCase()) ||
                s.storeAddress?.toLowerCase().includes(storeSearch.toLowerCase())
            );
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

        // Clear error và highlight khi store được chọn
        if (selectedStore) {
            setError(null);
            setHighlightStore(false);
        }
    }, [selectedStore, allZones, currentUser]);

    // Reset selectedProducts khi store thay đổi (chỉ reset bảng datagrid, giữ nguyên thông tin khác)
    useEffect(() => {
        if (selectedStore) {
            // Reset selectedProducts khi store thay đổi
            setSelectedProducts([]);
            // Clear search term và filtered products
            setSearchTerm('');
            setFilteredProducts([]);
            setIsSearchFocused(false);
        }
    }, [selectedStore]);

    // Clear zone selection khi store thay đổi - tách riêng để tránh infinite loop
    useEffect(() => {
        if (selectedStore) {
            setSelectedProducts(prev => prev.map(product => ({
                ...product,
                zoneIds: []
            })));
        }
    }, [selectedStore]);

    // Set client-side rendering
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Cleanup refs when component unmounts
    useEffect(() => {
        return () => {
            selectRefs.current = {};
            setOpenDropdowns({});
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isDropdownClick = event.target.closest('.MuiSelect-root') || event.target.closest('.MuiMenu-root');
            if (!isDropdownClick) {
                setOpenDropdowns({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatCurrency = (value) => {
        const number = Number(value);
        return !isNaN(number) ? number.toLocaleString('vi-VN') + ' VND' : '0 VND';
    };

    const toggleColumn = (col) => {
        setColumnVisibility((prev) => ({ ...prev, [col]: !prev[col] }));
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        // Không cần setFilteredProducts ở đây nữa, đã xử lý trong useEffect
    };

    // Hàm kiểm tra cửa hàng trước khi search
    const checkStoreBeforeSearch = () => {
        // Kiểm tra xem đã chọn store chưa (đối với ADMIN/MANAGER)
        const isAdminOrManager = currentUser?.roles?.includes("ADMIN") || currentUser?.roles?.includes("MANAGER") || 
                                currentUser?.roles?.includes("ROLE_ADMIN") || currentUser?.roles?.includes("ROLE_MANAGER");
        
        if (isAdminOrManager && !selectedStore) {
            setError('Vui lòng chọn cửa hàng trước khi tìm kiếm sản phẩm');
            setHighlightStore(true);
            return false;
        }
        return true;
    };

    // Hàm xử lý thay đổi ngày hết hạn
    const handleExpireDateChange = (id, newDate) => {
        // newDate là object Date hoặc null
        let formatted = '';
        if (newDate instanceof Date && !isNaN(newDate)) {
            // Validation ngày hết hạn
            const now = new Date();
            const selectedDate = new Date(newDate);
            
            // Kiểm tra ngày hết hạn không được ở quá khứ
            if (selectedDate < now) {
                setError('Ngày hết hạn không được ở quá khứ.');
                return;
            }
            
            // Kiểm tra ngày hết hạn không được quá 30 ngày từ hiện tại
            const daysDiff = Math.ceil((selectedDate - now) / (1000 * 60 * 60 * 24));
            if (daysDiff > 30) {
                setError('Ngày hết hạn không được quá 30 ngày từ ngày hiện tại.');
                return;
            }
            
            // format yyyy-MM-dd để lưu backend
            formatted = newDate.toISOString().slice(0, 10);
            setError(null); // Xóa lỗi nếu validation thành công
        }
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? { ...p, expireDate: formatted }
                    : p
            )
        );
    };


    // Hàm format ngày dd/MM/yyyy

    // Sửa handleSelectProduct để truyền unit hiện tại, price luôn là giá 1 quả
    const handleSelectProduct = (product) => {
        // Kiểm tra cửa hàng trước khi thêm sản phẩm
        if (!checkStoreBeforeSearch()) {
            return;
        }

        if (!selectedProducts.find((p) => p.id === product.id)) {
            const price = product.price || 0;
            const quantity = 1; // Mặc định 1 quả
            const total = price * quantity;
            const defaultExpireDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 2 tuần, yyyy-MM-dd

            setSelectedProducts((prev) => [
                ...prev,
                {
                    id: product.id,
                    name: product.name || product.productName,
                    productCode: product.code || product.productCode,
                    productDescription: product.productDescription,
                    unit: defaultUnit,
                    price,
                    quantity,
                    total,
                    productId: product.id,
                    salePrice: 0,
                    zoneId: '',
                    expireDate: defaultExpireDate,
                },
            ]);
        }
        setSearchTerm('');
        setFilteredProducts([]);
        setIsSearchFocused(false); // Ẩn gợi ý khi chọn
    };

    const handleQuantityChange = (id, delta) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    const newQuantity = Math.max(1, p.quantity + delta);
                    const unit = p.unit || 'quả';
                    const quantityInQua = unit === 'khay' ? newQuantity * 30 : newQuantity;
                    
                    return {
                        ...p,
                        quantity: newQuantity,
                        total: (p.price || 0) * quantityInQua,
                    };
                }
                return p;
            })
        );
    };

    const handleQuantityInputChange = useCallback((id, newQuantity) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    const quantity = Math.max(1, newQuantity);
                    const unit = p.unit || 'quả';
                    const quantityInQua = unit === 'khay' ? quantity * 30 : quantity;
                    
                    return {
                        ...p,
                        quantity: quantity,
                        total: (p.price || 0) * quantityInQua,
                    };
                }
                return p;
            })
        );
    }, []);

    const handlePriceChange = useCallback((id, newPrice) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    const unit = p.unit || 'quả';
                    const quantityInQua = unit === 'khay' ? (p.quantity || 0) * 30 : (p.quantity || 0);
                    
                    return {
                        ...p,
                        price: newPrice,
                        total: newPrice * quantityInQua,
                    };
                }
                return p;
            })
        );
    }, []);

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

    const handleUnitChange = useCallback((id, newUnit) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    let newQuantity = 1; // Reset về 1 khi đổi đơn vị
                    const quantityInQua = newUnit === 'khay' ? newQuantity * 30 : newQuantity;
                    
                    return {
                        ...p,
                        unit: newUnit,
                        quantity: newQuantity,
                        total: (p.price || 0) * quantityInQua
                    };
                }
                return p;
            })
        );
    }, []);


    const handleDeleteProduct = (id) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
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

    const handleCloseCategoryDialog = () => {
        setShowCategoryDialog(false);
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        // Lọc sản phẩm theo category và store
        const filteredProducts = products.filter(product => {
            // Lọc theo category
            const matchesCategory = product.categoryId === category.id || product.category?.id === category.id;
            
            // Lọc theo store (nếu đã chọn store)
            const matchesStore = selectedStore ? product.storeId === selectedStore : true;
            
            return matchesCategory && matchesStore;
        });
        setCategoryProducts(filteredProducts);
    };

    const handleSelectCategoryProduct = (product) => {
        // Kiểm tra cửa hàng trước khi thêm sản phẩm
        if (!checkStoreBeforeSearch()) {
            return;
        }

        if (!selectedProducts.find((p) => p.productId === product.id)) {
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
                    zoneId: '',
                    expireDate: defaultExpireDate,
                },
            ]);
        }
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

    // Sửa handleZoneChange để nhận mảng zoneIds
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
        setZoneSearch(''); // reset search sau khi chọn
    };

    // Hàm bỏ chọn zone khỏi sản phẩm
    const handleRemoveZone = (productId, zoneId) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === productId
                    ? { ...p, zoneIds: (p.zoneIds || []).filter((zid) => zid !== zoneId) }
                    : p
            )
        );
    };

    const formatExpireDateForBackend = (dateStr) => {
        if (!dateStr) return null;
        // Nếu đã có T, giữ nguyên
        if (dateStr.includes('T')) return dateStr;
        return dateStr + 'T00:00:00';
    };

    const handleSaveDraft = async () => {
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            setHighlightSupplier(true);
            return;
        }

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
        setSuccess(null);

        try {
            const importData = {
                name: nextImportCode,
                supplierId: selectedSupplier,
                storeId: selectedStore,
                staffId: currentUser?.id || 1,
                importTransactionNote: note,
                paidAmount: paidAmount,
                createdBy: currentUser?.id, // Thêm dòng này
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    remainQuantity: product.quantity,
                    expireDate: formatExpireDateForBackend(product.expireDate),
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: Array.isArray(product.zoneIds) ? product.zoneIds.map(String) : (product.zoneId ? [String(product.zoneId)] : []),
                })),
                status: 'DRAFT',
            };

            await importTransactionService.create(importData);
            
            // Hiển thị thông báo thành công
            setSuccess('Tạo phiếu nhập hàng thành công!');
            
            // Gửi thông báo notification (chỉ gọi 1 function để tránh duplicate)
            createImportTransactionNotification('create', nextImportCode);
            
            // Lưu thông báo thành công vào localStorage để hiển thị khi quay về trang index
            localStorage.setItem('import_creation_success', 'true');
            
            // Reset form
            setSelectedProducts([]);
            setPaidAmount(0);
            setNote('');
            
            // Chuyển hướng về trang index sau 0.5 giây
            setTimeout(() => {
                navigate('/import');
            }, 500);
        } catch (err) {
            setError('Không thể tạo phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            setHighlightSupplier(true);
            return;
        }

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
        setSuccess(null);

        try {
            const importData = {
                name: nextImportCode,
                supplierId: selectedSupplier,
                storeId: selectedStore,
                staffId: currentUser?.id || 1,
                importTransactionNote: note,
                paidAmount: paidAmount,
                createdBy: currentUser?.id, // Thêm dòng này
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    remainQuantity: product.quantity,
                    expireDate: formatExpireDateForBackend(product.expireDate),
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: Array.isArray(product.zoneIds) ? product.zoneIds.map(String) : (product.zoneId ? [String(product.zoneId)] : []),
                })),
                status: 'WAITING_FOR_APPROVE',
            };

            await importTransactionService.create(importData);
            
            // Hiển thị thông báo thành công
            setSuccess('Tạo phiếu nhập hàng thành công!');
            
            // Gửi thông báo notification (chỉ gọi 1 function để tránh duplicate)
            createImportTransactionNotification('create', nextImportCode);
            
            // Lưu thông báo thành công vào localStorage để hiển thị khi quay về trang index
            localStorage.setItem('import_creation_success', 'true');
            
            // Reset form
            setSelectedProducts([]);
            setPaidAmount(0);
            setNote('');
            
            // Chuyển hướng về trang index sau 0.5 giây
            setTimeout(() => {
                navigate('/import');
            }, 500);
        } catch (err) {
            setError('Không thể tạo phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    // Helper: kiểm tra value có hợp lệ trong danh sách không
    const isValidValue = (value, options) => options.some(opt => String(opt.id) === String(value));

    const columns = [
        columnVisibility['STT'] && {
            field: 'stt',
            headerName: 'STT',
            width: 80,
            renderCell: (params) => {
                // Sử dụng rowIndex nếu có, fallback tìm index trong selectedProducts
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
                    {params.row.name || params.row.productName || `Sản phẩm ${params.row.productId}`}
                </div>
            )
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
                        value={params.row.unit || defaultUnit}
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
        columnVisibility['Giá bán'] && {
            field: 'salePrice',
            headerName: 'Giá bán',
            renderHeader: () => (
                <span>
                    Giá bán<span style={{ color: '#6b7280', fontSize: '0.875em' }}>/quả</span>
                </span>
            ),
            width: 150,
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => (
                <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    height: '100%' ,
                }}>
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
                const price = parseFloat(row.price) || 0; // Đơn giá theo quả
                const quantity = parseInt(row.quantity) || 0;
                const unit = row.unit || 'quả';
                
                // Quy đổi số lượng về quả để tính thành tiền
                const quantityInQua = unit === 'khay' ? quantity * 30 : quantity;
                return price * quantityInQua;
            },
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => {
                const price = parseFloat(params.row.price) || 0; // Đơn giá theo quả
                const quantity = parseInt(params.row.quantity) || 0;
                const unit = params.row.unit || 'quả';
                
                // Quy đổi số lượng về quả để tính thành tiền
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
                                zIndex: 3
                            }}>
                                {selectedZoneIds.length > 0 && (
                                    <>
                                        {selectedZoneIds.slice(0, 2).map((zoneId) => {
                                            const zone = zones.find(z => z.id === zoneId);
                                            return zone ? (
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
                                            ) : null;
                                        })}
                                        {selectedZoneIds.length > 2 && (
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
                                        )}
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
                                                const zone = zones.find(z => String(z.id) === String(id));
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
        {
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
                                        '& .MuiInput-underline:hover:before': {
                                            borderBottomColor: 'transparent',
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
    // Hàm lấy chi tiết cửa hàng (nếu cần)
    const fetchStoreDetails = async (storeId) => {
        // Nếu có nhiều store, implement lấy chi tiết ở đây
        setStoreDetails(null); // placeholder
    };

    // Tổng tiền hàng
    const totalAmount = selectedProducts.reduce((sum, p) => {
        const price = parseFloat(p.price) || 0; // Đơn giá theo quả
        const quantity = parseInt(p.quantity) || 0;
        const unit = p.unit || 'quả';
        
        // Quy đổi số lượng về quả để tính thành tiền
        const quantityInQua = unit === 'khay' ? quantity * 30 : quantity;
        return sum + (price * quantityInQua);
    }, 0);

    // Xử lý mở dialog tổng kết
    const handleShowSummary = async (status) => {
        let missing = false;
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            setHighlightSupplier(true);
            missing = true;
        } else {
            setHighlightSupplier(false);
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

        // Kiểm tra tất cả sản phẩm đều có zone
        const productsWithoutZone = selectedProducts.filter(product => 
            !product.zoneIds || product.zoneIds.length === 0
        );
        
        if (productsWithoutZone.length > 0) {
            setError(`Sản phẩm "${productsWithoutZone[0].name || productsWithoutZone[0].productName}" chưa được chọn zone. Vui lòng chọn zone cho tất cả sản phẩm.`);
            setHighlightProducts(true);
            missing = true;
        }

        if (missing) return;
        await fetchSupplierDetails(selectedSupplier);
        setSummaryData({
            importCode: nextImportCode, // Thêm mã phiếu nhập vào summary
            supplier: suppliers.find(s => s.id === selectedSupplier) || {},
            store: stores.find(s => s.id === selectedStore) || {}, // Use selectedStore
            products: selectedProducts,
            zones: zones, // Thêm zones để hiển thị trong summary
            totalAmount,
            paidAmount,
            note,
            importDate: new Date(),
            status,
        });
        setShowSummaryDialog(true);
    };

    // Xác nhận lưu phiếu nhập
    const handleConfirmSummary = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        // Validate required fields
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            setHighlightSupplier(true);
            setLoading(false);
            return;
        }
        
        if (!selectedStore) {
            setError('Vui lòng chọn cửa hàng');
            setHighlightStore(true);
            setLoading(false);
            return;
        }
        
        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            setHighlightProducts(true);
            setLoading(false);
            return;
        }
        
        // Validate product data
        for (let i = 0; i < selectedProducts.length; i++) {
            const product = selectedProducts[i];
            if (!product.productId) {
                setError(`Sản phẩm thứ ${i + 1} không có ID hợp lệ`);
                setLoading(false);
                return;
            }
            if (!product.quantity || product.quantity <= 0) {
                setError(`Sản phẩm "${product.name}" phải có số lượng lớn hơn 0`);
                setLoading(false);
                return;
            }
        }

        // Kiểm tra tất cả sản phẩm đều có zone
        const productsWithoutZone = selectedProducts.filter(product => 
            !product.zoneIds || product.zoneIds.length === 0
        );
        
        if (productsWithoutZone.length > 0) {
            setError(`Sản phẩm "${productsWithoutZone[0].name || productsWithoutZone[0].productName}" chưa được chọn zone. Vui lòng chọn zone cho tất cả sản phẩm.`);
            setHighlightProducts(true);
            setLoading(false);
            return;
        }
        
        try {
            const importData = {
                name: nextImportCode,
                stocktakeId: (location.state?.surplusFromStocktake?.stocktakeId) || undefined,
                supplierId: selectedSupplier,
                storeId: selectedStore,
                staffId: currentUser?.id || 1,
                importTransactionNote: note,
                paidAmount: paidAmount,
                createdBy: currentUser?.id,
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    remainQuantity: product.quantity,
                    expireDate: formatExpireDateForBackend(product.expireDate),
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: Array.isArray(product.zoneIds) ? product.zoneIds.map(String) : (product.zoneId ? [String(product.zoneId)] : []),
                })),
                status: summaryData.status,
            };
            
            await importTransactionService.create(importData);
            
            // Hiển thị thông báo thành công
            setSuccess('Tạo phiếu nhập hàng thành công!');
            
            // Gửi thông báo notification (chỉ gọi 1 function để tránh duplicate)
            createImportTransactionNotification('create', nextImportCode);
            
            // Lưu thông báo thành công vào localStorage để hiển thị khi quay về trang index
            localStorage.setItem('import_creation_success', 'true');
            
            // Reset form
            setSelectedProducts([]);
            setPaidAmount(0);
            setNote('');
            setShowSummaryDialog(false);
            setSummaryData(null);
            
            // Chuyển hướng về trang index sau 0.5 giây
            setTimeout(() => {
                navigate('/import');
            }, 500);
        } catch (err) {
            setError('Không thể tạo phiếu nhập hàng: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Theo dõi thay đổi để hiển thị dialog xác nhận - tối ưu hóa
    useEffect(() => {
        const shouldCheckStore = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';
        const hasChanges = selectedProducts.length > 0 || 
                          selectedSupplier !== '' || 
                          (shouldCheckStore && selectedStore !== '') || 
                          (note && note.trim() !== '') || 
                          paidAmount > 0;
        
        setHasUnsavedChanges(hasChanges);
    }, [selectedProducts, selectedSupplier, selectedStore, note, paidAmount, currentUser?.role]);

    // Xử lý lưu tạm thời riêng biệt để tránh re-render không cần thiết
    useEffect(() => {
        if (shouldSaveTemp && hasUnsavedChanges) {
            const tempData = {
                selectedProducts,
                selectedSupplier,
                selectedStore,
                note,
                paidAmount,
                timestamp: Date.now()
            };
            localStorage.setItem('importPage_tempData', JSON.stringify(tempData));
            setShouldSaveTemp(false);
        }
    }, [shouldSaveTemp, hasUnsavedChanges, selectedProducts, selectedSupplier, selectedStore, note, paidAmount]);

    // Khôi phục dữ liệu tạm thời khi vào lại trang - tối ưu hóa
    useEffect(() => {
        const tempData = localStorage.getItem('importPage_tempData');
        if (!tempData) return;

        try {
            const parsed = JSON.parse(tempData);
            const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000; // 24 giờ
            
            if (isExpired) {
                localStorage.removeItem('importPage_tempData');
                return;
            }

            // Sử dụng React 18 batch updates để tối ưu performance
            startTransition(() => {
                if (parsed.selectedProducts?.length > 0) {
                    setSelectedProducts(parsed.selectedProducts);
                }
                if (parsed.selectedSupplier) {
                    setSelectedSupplier(parsed.selectedSupplier);
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
            localStorage.removeItem('importPage_tempData');
        }
    }, []);

    // Xóa dữ liệu tạm thời khi lưu thành công
    useEffect(() => {
        if (success && (success.includes('thành công') || success.includes('Đã lưu phiếu'))) {
            clearTempData();
        }
    }, [success]);

    // Xử lý khi dialog xác nhận đóng - tối ưu hóa
    useEffect(() => {
        if (!showBackConfirm) {
            setShouldSaveTemp(false);
        }
    }, [showBackConfirm]);

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

    // Hàm xử lý quay lại
    const handleBack = () => {
        if (hasUnsavedChanges) {
            setShowBackConfirm(true);
        } else {
            navigate('/import');
        }
    };

    const handleConfirmBack = useCallback(() => {
        // Xóa dữ liệu tạm thời khi chọn rời khỏi
        localStorage.removeItem('importPage_tempData');
        
        // Chuyển hướng ngay lập tức
        setShowBackConfirm(false);
        setIsNavigatingAway(true);
        
        if (pendingNavigation) {
            // Sử dụng window.location.href để chuyển hướng nhanh hơn
            window.location.href = pendingNavigation;
        } else {
            navigate('/import');
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
                selectedSupplier,
                selectedStore,
                note,
                paidAmount,
                timestamp: Date.now()
            };
            localStorage.setItem('importPage_tempData', JSON.stringify(tempData));
            
            // Hiển thị thông báo ngắn gọn
            setSuccess('Đã lưu tạm thời!');
            
            // Chuyển hướng ngay lập tức
            setShowBackConfirm(false);
            setIsNavigatingAway(true);
            
            if (pendingNavigation) {
                window.location.href = pendingNavigation;
            } else {
                navigate('/import');
            }
            
            setPendingNavigation(null);
        } catch (error) {
            setError('Không thể lưu tạm thời. Vui lòng thử lại.');
        }
    }, [pendingNavigation, navigate, selectedProducts, selectedSupplier, selectedStore, note, paidAmount]);

    // Xóa dữ liệu tạm thời khi lưu thành công
    const clearTempData = useCallback(() => {
        localStorage.removeItem('importPage_tempData');
        setHasUnsavedChanges(false);
    }, []);
    
    // Load temp data when component mounts
    useEffect(() => {
        try {
            const tempData = localStorage.getItem('importPage_tempData');
            if (tempData) {
                const parsed = JSON.parse(tempData);
                const now = Date.now();
                const dataAge = now - (parsed.timestamp || 0);
                
                // Only restore if data is less than 1 hour old
                if (dataAge < 60 * 60 * 1000) {
                    if (parsed.selectedProducts?.length > 0) {
                        setSelectedProducts(parsed.selectedProducts);
                        setHasUnsavedChanges(true);
                    }
                    if (parsed.selectedSupplier) {
                        setSelectedSupplier(parsed.selectedSupplier);
                    }
                    if (parsed.selectedStore) {
                        setSelectedStore(parsed.selectedStore);
                    }
                    if (parsed.note) {
                        setNote(parsed.note);
                    }
                    if (parsed.paidAmount) {
                        setPaidAmount(parsed.paidAmount);
                        setPaidAmountInput(String(parsed.paidAmount));
                    }
                } else {
                    // Clear old data
                    localStorage.removeItem('importPage_tempData');
                }
            }
        } catch (error) {
            console.error('Error loading temp data:', error);
            localStorage.removeItem('importPage_tempData');
        }
    }, []);
    
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
                            Nhập hàng
                        </Button>
                        
                        <div className="flex items-center gap-3">
                            <div className="relative w-96">
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onFocus={() => {
                                        // Kiểm tra cửa hàng trước khi search
                                        if (!checkStoreBeforeSearch()) {
                                            return;
                                        }
                                        setIsSearchFocused(true);
                                    }}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)} // Delay để cho phép click chọn
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
                                
                                                                {/* Search Dropdown - Fixed positioning */}
                                {(isSearchFocused || searchTerm.trim() !== '') && (
                                    <div 
                                        className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl w-full font-medium text-base max-h-80 overflow-y-auto overflow-x-hidden transition-all duration-200"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            zIndex: 9999,
                                            marginTop: '4px',
                                            minWidth: '384px'
                                        }}
                                    >
                                        {selectedStore ? (
                                            filteredProducts.length > 0 ? (
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
                                                <div className="px-7 py-4 text-center text-gray-400">
                                                    Không tìm thấy sản phẩm
                                                </div>
                                            )
                                        ) : (
                                            <div className="px-7 py-4 text-center text-gray-400">
                                                Vui lòng chọn cửa hàng trước khi tìm kiếm
                                            </div>
                                        )}
                                    </div>
                                )}
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
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Tooltip title="Ẩn/hiện cột hiển thị">
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}><VisibilityIcon /></IconButton>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                            {Object.entries(columnVisibility).map(([col, visible]) => (
                                <MenuItem key={col} dense>
                                    <MuiFormControlLabel control={<Checkbox checked={visible} onChange={() => toggleColumn(col)} />} label={col} />
                                </MenuItem>
                            ))}
                        </Menu>
                    </div>
                </div>

                <div style={{ height: 400, width: '100%' }}>
                    {isClient ? (
                        <DataGrid
                            rows={selectedProducts}
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
                setPaidAmount={setPaidAmount}
                highlightSupplier={highlightSupplier}
                highlightStore={highlightStore}
                loading={loading}
                onSaveDraft={() => handleShowSummary('DRAFT')}
                onComplete={() => handleShowSummary('WAITING_FOR_APPROVE')}
                lockedStoreId={lockedStoreId}
                lockedStoreName={lockedStoreName}
                fromStocktake={fromStocktake}
            />

            <AddProductDialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                onProductCreated={refreshProducts}
                onProductAdded={handleAddNewProduct}
                unit={defaultUnit}
                currentUser={currentUser}
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
                                                {products.filter(p => {
                                                    const matchesCategory = p.categoryId === category.id || p.category?.id === category.id;
                                                    const matchesStore = selectedStore ? p.storeId === selectedStore : true;
                                                    return matchesCategory && matchesStore;
                                                }).length} sản phẩm
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
                                                <div className="text-xs text-gray-400 ml-2">{defaultUnit}</div>
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
                            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                            boxShadow: '0 3px 15px rgba(76, 175, 80, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                                boxShadow: '0 5px 20px rgba(76, 175, 80, 0.4)',
                                transform: 'translateY(-1px)'
                            },
                            '&:disabled': {
                                background: '#ccc',
                                boxShadow: 'none',
                                transform: 'none'
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Thêm ({selectedCategoryProducts.length})
                    </Button>
                </DialogActions>
            </Dialog>

            <ImportSummaryDialog
                open={showSummaryDialog}
                onClose={() => setShowSummaryDialog(false)}
                onConfirm={handleConfirmSummary}
                importData={summaryData}
                formatCurrency={formatCurrency}
                loading={loading}
                currentUser={currentUser}
                supplierDetails={supplierDetails}
                storeDetails={storeDetails}
            />

            {/* Popup xem tất cả zone đã chọn */}
            <Popover
                open={Boolean(zonePopoverAnchor)}
                anchorEl={zonePopoverAnchor}
                onClose={() => { setZonePopoverAnchor(null); setZonePopoverProductId(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ 
                    sx: { 
                        p: 2, 
                        minWidth: 260, 
                        maxWidth: 380, 
                        maxHeight: 300, 
                        overflowY: 'auto', 
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        border: '1px solid #e9ecef'
                    } 
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #f8f9fa'
                }}>
                    <div style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#667eea',
                        borderRadius: '50%'
                    }}></div>
                    <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#495057'
                    }}>
                        Vị trí đã chọn
                    </span>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 6,
                    minHeight: '32px',
                    alignItems: 'center'
                }}>
                    {(() => {
                        const product = selectedProducts.find(p => p.id === zonePopoverProductId);
                        if (!product || !Array.isArray(product.zoneIds) || product.zoneIds.length === 0) {
                            return (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#6c757d',
                                    fontStyle: 'italic',
                                    padding: '8px 12px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '6px',
                                    border: '1px dashed #dee2e6',
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{
                                        width: '3px',
                                        height: '3px',
                                        backgroundColor: '#adb5bd',
                                        borderRadius: '50%'
                                    }}></span>
                                    Chưa chọn vị trí nào
                                </div>
                            );
                        }
                        return product.zoneIds.map(zoneId => {
                            const zone = zones.find(z => z.id === zoneId);
                            return zone ? (
                                <Chip
                                    key={zoneId}
                                    label={zone.name || zone.zoneName}
                                    size="small"
                                    onDelete={(e) => {
                                        e.stopPropagation();
                                        handleRemoveZone(product.id, zoneId);
                                    }}
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        fontWeight: '600',
                                        borderRadius: '8px',
                                        height: '24px',
                                        fontSize: '0.75rem',
                                        maxWidth: '120px',
                                        '& .MuiChip-label': {
                                            padding: '0 8px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        },
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
                                        },
                                        '& .MuiChip-deleteIcon': {
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            fontSize: '0.875rem',
                                            '&:hover': {
                                                color: 'white'
                                            }
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            ) : null;
                        });
                    })()}
                </div>
                
                {(() => {
                    const product = selectedProducts.find(p => p.id === zonePopoverProductId);
                    if (product && Array.isArray(product.zoneIds) && product.zoneIds.length > 0) {
                        return (
                            <div style={{
                                marginTop: '12px',
                                paddingTop: '8px',
                                borderTop: '1px solid #f8f9fa',
                                fontSize: '0.7rem',
                                color: '#6c757d',
                                textAlign: 'center'
                            }}>
                                Nhấn vào dấu × để xóa vị trí
                            </div>
                        );
                    }
                    return null;
                })()}
            </Popover>

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
                        color="inherit"
                        sx={{
                            color: '#666',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                    >
                        Hủy
                    </Button>
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

export default ImportPage;
