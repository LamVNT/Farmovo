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
} from '@mui/material';
import { FaSearch } from 'react-icons/fa';
import { MdKeyboardArrowDown, MdCategory } from 'react-icons/md';
// Không cần import FiPlus nữa vì đã dùng Material-UI icons
import AddIcon from '@mui/icons-material/Add';
import { DataGrid } from '@mui/x-data-grid';
import { FaRegTrashCan } from "react-icons/fa6";
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddProductDialog from '../../components/import-transaction/AddProductDialog.jsx';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

import importTransactionService from '../../services/importTransactionService';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { userService } from '../../services/userService';
import { getCategories } from '../../services/categoryService';
import { getZones } from '../../services/zoneService';
import { getAllStores } from '../../services/storeService';
import ImportSummaryDialog from '../../components/import-transaction/ImportSummaryDialog';
import ImportSidebar from '../../components/import-transaction/ImportSidebar';
const ImportPage = () => {
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
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
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

    const [zonePopoverAnchor, setZonePopoverAnchor] = useState(null);
    const [zonePopoverProductId, setZonePopoverProductId] = useState(null);

    const zoneSearchInputRef = useRef();

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
                // Không setSelectedUser nữa

                // Load all users for dropdown (không cần nữa)
                // const allUsers = await userService.getAllUsers();
                // setUsers(allUsers);

                // Load products
                const productsData = await productService.getAllProducts();
                setProducts(productsData);

                // Load suppliers
                const suppliersData = await customerService.getSuppliers();
                setSuppliers(suppliersData);

                // Load categories
                const categoriesData = await getCategories();
                setCategories(categoriesData);

                // Load zones
                const zonesData = await getZones();
                setZones(zonesData);

                // Load stores
                const storesData = await getAllStores();
                setStores(storesData);

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
            const productsData = await productService.getAllProducts();
            setProducts(productsData);
        } catch (error) {
            console.error('Failed to refresh products:', error);
        }
    };

    // Function để thêm product mới vào bảng
    const handleAddNewProduct = (newProduct) => {
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

    // Cập nhật category products khi products thay đổi
    useEffect(() => {
        if (selectedCategory) {
            const filteredProducts = products.filter(product => 
                product.categoryId === selectedCategory.id || product.category?.id === selectedCategory.id
            );
            setCategoryProducts(filteredProducts);
        }
    }, [products, selectedCategory]);

    // Cập nhật search results khi products hoặc searchTerm hoặc isSearchFocused thay đổi
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            // Ưu tiên lọc searchTerm nếu có nhập
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
            // Nếu chưa nhập gì và đang focus thì gợi ý 5 sản phẩm đầu tiên
            setFilteredProducts(products.slice(0, 5));
        } else {
            // Không focus và không nhập thì không gợi ý gì
            setFilteredProducts([]);
        }
    }, [products, searchTerm, isSearchFocused]);

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

    // Hàm xử lý thay đổi ngày hết hạn
    const handleExpireDateChange = (id, newDate) => {
        // newDate là object Date hoặc null
        let formatted = '';
        if (newDate instanceof Date && !isNaN(newDate)) {
            // format yyyy-MM-dd để lưu backend
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


    // Hàm format ngày dd/MM/yyyy

    // Sửa handleSelectProduct để truyền unit hiện tại, price luôn là giá 1 quả
    const handleSelectProduct = (product) => {
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

    const handleQuantityInputChange = (id, newQuantity) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        quantity: Math.max(1, newQuantity),
                        total: (p.price || 0) * Math.max(1, newQuantity),
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

    const handleUnitChange = (id, newUnit) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    let newQuantity = p.quantity;
                    // Chuyển đổi số lượng khi đổi đơn vị
                    if (newUnit === 'khay' && p.unit !== 'khay') {
                        // Từ quả sang khay: chia cho 25, tối thiểu 1 khay
                        newQuantity = Math.max(1, Math.ceil((p.quantity || 1) / 25));
                    } else if (newUnit === 'quả' && p.unit !== 'quả') {
                        // Từ khay sang quả: nhân với 25
                        newQuantity = (p.quantity || 1) * 25;
                    }
                    
                    return {
                        ...p,
                        unit: newUnit,
                        quantity: newQuantity,
                        total: (p.price || 0) * newQuantity
                    };
                }
                return p;
            })
        );
    };


    const handleDeleteProduct = (id) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
    };

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
        if (!dateStr) return '';
        // Nếu đã có T, giữ nguyên
        if (dateStr.includes('T')) return dateStr;
        return dateStr + 'T00:00:00';
    };

    const handleSaveDraft = async () => {
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const importData = {
                name: nextImportCode,
                supplierId: selectedSupplier,
                storeId: selectedStore || 1, // Use selectedStore if available, otherwise default
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
            setSuccess('Tạo phiếu nhập hàng thành công!');
            setSelectedProducts([]);
            setPaidAmount(0);
            setNote('');
            // setImportCode('');
        } catch (err) {
            setError('Không thể tạo phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!selectedSupplier) {
            setError('Vui lòng chọn nhà cung cấp');
            return;
        }

        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const importData = {
                name: nextImportCode,
                supplierId: selectedSupplier,
                storeId: selectedStore || 1, // Use selectedStore if available, otherwise default
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
            setSuccess('Tạo phiếu nhập hàng thành công!');
            setSelectedProducts([]);
            setPaidAmount(0);
            setNote('');
            // setImportCode('');
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
                if (typeof params.rowIndex === 'number') return params.rowIndex + 1;
                if (params.id) {
                    const idx = selectedProducts.findIndex(row => row.id === params.id);
                    return idx >= 0 ? idx + 1 : '';
                }
                return '';
            }
        },
        columnVisibility['Tên hàng'] && { field: 'name', headerName: 'Tên hàng', width: 150, minWidth: 150 },
        columnVisibility['ĐVT'] && { 
            field: 'unit', 
            headerName: 'ĐVT', 
            width: 120,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <Select
                        size="small"
                        value={params.row.unit || defaultUnit}
                        onChange={(e) => handleUnitChange(params.row.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        sx={{
                            width: '80px',
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
                        onChange={(e) => handleQuantityInputChange(params.row.id, Number(e.target.value) || 1)}
                        onClick={e => e.stopPropagation()}
                        sx={{
                            width: '60px',
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
            valueFormatter: (params) => formatCurrency(params.value || 0),
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
            width: 150,
            valueFormatter: (params) => formatCurrency(params.value || 0),
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
                return price * quantity;
            },
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => {
                const price = parseFloat(params.row.price) || 0;
                const quantity = parseInt(params.row.quantity) || 0;
                const total = price * quantity;
                return (
                    <div className="text-right w-full">
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
            const supplier = await customerService.getCustomerById(supplierId);
            setSupplierDetails(supplier);
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
    const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0);

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
        if (missing) return;
        await fetchSupplierDetails(selectedSupplier);
        setSummaryData({
            importCode: nextImportCode, // Thêm mã phiếu nhập vào summary
            supplier: suppliers.find(s => s.id === selectedSupplier) || {},
            store: stores.find(s => s.id === selectedStore) || {}, // Use selectedStore
            products: selectedProducts,
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
        try {
            const importData = {
                name: nextImportCode,
                supplierId: selectedSupplier,
                storeId: selectedStore || 1, // Use selectedStore if available, otherwise default
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
                status: summaryData.status,
            };
            await importTransactionService.create(importData);
            setSuccess('Tạo phiếu nhập hàng thành công!');
            setSelectedProducts([]);
            setPaidAmount(0);
            setNote('');
            setShowSummaryDialog(false);
            setSummaryData(null);
        } catch (err) {
            setError('Không thể tạo phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };
    
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
                        <Tooltip title="Thêm từ nhóm hàng"><IconButton onClick={handleOpenCategoryDialog}><MdCategory /></IconButton></Tooltip>
                        <Tooltip title="Tạo mới hàng hóa"><IconButton onClick={() => setOpenDialog(true)}><AddIcon /></IconButton></Tooltip>
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
            />

            <AddProductDialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                onProductCreated={refreshProducts}
                onProductAdded={handleAddNewProduct}
                unit={defaultUnit}
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

export default ImportPage;
