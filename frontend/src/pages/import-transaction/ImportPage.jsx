import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { FaLock, FaCheck, FaSearch, FaEye } from 'react-icons/fa';
import { MdKeyboardArrowDown, MdCategory } from 'react-icons/md';
import { FiPlus } from 'react-icons/fi';
import { DataGrid } from '@mui/x-data-grid';
import { FaRegTrashCan } from "react-icons/fa6";
import AddProductDialog from './AddProductDialog';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

import importTransactionService from '../../services/importTransactionService';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { userService } from '../../services/userService';
import { getCategories } from '../../services/categoryService';
import { getZones } from '../../services/zoneService';
const ImportPage = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
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

    const [nextImportCode, setNextImportCode] = useState('');
    const [note, setNote] = useState('');
    const [paidAmount, setPaidAmount] = useState(0);

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

                // Lấy mã phiếu nhập tiếp theo
                const code = await importTransactionService.getNextCode();
                setNextImportCode(code);
            } catch (error) {
                console.error('Failed to load data:', error);
                setError('Không thể tải dữ liệu: ' + error.message);
            }
        };

        loadData();
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

    // Cập nhật search results khi products thay đổi
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            const results = products.filter(
                (p) =>
                    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(results);
        }
    }, [products, searchTerm]);

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
        if (value.trim() === '') {
            setFilteredProducts([]);
        } else {
            const results = products.filter(
                (p) =>
                    p.name?.toLowerCase().includes(value.toLowerCase()) ||
                    p.code?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredProducts(results);
        }
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

    const handleSelectProduct = (product) => {
        if (!selectedProducts.find((p) => p.id === product.id)) {
            const price = 0; // Để user nhập vào
            const quantity = 1;
            const total = price * quantity;
            const defaultExpireDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 2 tuần, yyyy-MM-dd

            setSelectedProducts((prev) => [
                ...prev,
                {
                    id: product.id,
                    name: product.name || product.productName,
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
        setSearchTerm('');
        setFilteredProducts([]);
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

    const handleZoneChange = (id, zoneId) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        zoneId,
                    }
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
                storeId: 1,
                staffId: currentUser?.id || 1,
                importTransactionNote: note,
                paidAmount: paidAmount,
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    remainQuantity: product.quantity,
                    expireDate: formatExpireDateForBackend(product.expireDate),
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: product.zoneId || '',
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
            console.error('Error creating import transaction:', err);
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
                storeId: 1,
                staffId: currentUser?.id || 1,
                importTransactionNote: note,
                paidAmount: paidAmount,
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    remainQuantity: product.quantity,
                    expireDate: formatExpireDateForBackend(product.expireDate),
                    unitImportPrice: product.price,
                    unitSalePrice: product.salePrice,
                    zones_id: product.zoneId || '',
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
            console.error('Error creating import transaction:', err);
            setError('Không thể tạo phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    // Helper: kiểm tra value có hợp lệ trong danh sách không
    const isValidValue = (value, options) => options.some(opt => String(opt.id) === String(value));

    const columns = [
        columnVisibility['STT'] && { field: 'id', headerName: 'STT', width: 80 },
        columnVisibility['Tên hàng'] && { field: 'name', headerName: 'Tên hàng', flex: 1 },
        columnVisibility['ĐVT'] && { field: 'unit', headerName: 'ĐVT', width: 80 },
        columnVisibility['Số lượng'] && {
            field: 'quantity',
            headerName: 'Số lượng',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full gap-1">
                    <button 
                        onClick={() => handleQuantityChange(params.row.id, -1)} 
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
                        onClick={() => handleQuantityChange(params.row.id, 1)} 
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
                        type="number"
                        variant="standard"
                        value={params.row.price || 0}
                        onChange={(e) => handlePriceChange(params.row.id, Number(e.target.value) || 0)}
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
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                display: 'none',
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield',
                            }
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
                        type="number"
                        variant="standard"
                        value={params.row.salePrice || 0}
                        onChange={(e) => handleSalePriceChange(params.row.id, Number(e.target.value) || 0)}
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
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                display: 'none',
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield',
                            }
                        }}
                    />
                </div>
            ),
        },
        columnVisibility['Thành tiền'] && {
            field: 'total',
            headerName: 'Thành tiền',
            width: 150,
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => {
                const total = params.value || 0;
                return (
                    <div className="text-right w-full">
                        {formatCurrency(total)}
                    </div>
                );
            },
        },
        columnVisibility['Zone'] && {
            field: 'zoneId',
            headerName: 'Vị trí',
            width: 120,
            renderCell: (params) => (
                <Select
                    size="small"
                    variant="standard"
                    value={isValidValue(params.row.zoneId, zones) ? params.row.zoneId : ''}
                    onChange={(e) => handleZoneChange(params.row.id, e.target.value)}
                    displayEmpty
                    sx={{
                        width: '100%',
                        minWidth: '80px',
                        fontSize: '0.95rem',
                        background: 'transparent',
                        boxShadow: 'none',
                        '& .MuiSelect-select': {
                            padding: '4px 0 2px 0',
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
                >
                    <MenuItem value=""><em>Chọn vị trí</em></MenuItem>
                    {zones.map((zone) => (
                        <MenuItem key={zone.id} value={zone.id}>{zone.name || zone.zoneName}</MenuItem>
                    ))}
                </Select>
            ),
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
                    <IconButton size="small" onClick={() => handleDeleteProduct(params.row.id)}>
                        <FaRegTrashCan />
                    </IconButton>
                </Tooltip>
            ),
        },
    ].filter(Boolean);

    const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.total || 0), 0);
    
    return (
        <div className="flex w-full h-screen bg-gray-100">
            {error && <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">{error}</Alert>}
            {success && <Alert severity="success" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">{success}</Alert>}

            <div className="flex-1 p-4 bg-white rounded-md m-4 shadow-md overflow-auto">
                <div className="flex justify-between items-center mb-2">
                    <div className="relative w-full max-w-2xl flex items-center gap-2">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FaSearch className="text-gray-500" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Tooltip title="Thêm từ nhóm hàng"><IconButton onClick={handleOpenCategoryDialog}><MdCategory /></IconButton></Tooltip>
                        <Tooltip title="Tạo mới hàng hóa"><IconButton onClick={() => setOpenDialog(true)}><FiPlus /></IconButton></Tooltip>
                        {searchTerm.trim() !== '' && filteredProducts.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 z-10 bg-white border shadow-md rounded w-full max-h-60 overflow-y-auto text-sm">
                                {filteredProducts.map((product, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSelectProduct(product)}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <div className="font-medium">{product.name || product.productName}</div>
                                        <div className="text-xs text-gray-500">quả</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="ml-auto">
                        <Tooltip title="Ẩn/hiện cột hiển thị">
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}><FaEye /></IconButton>
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
                    />
                </div>
            </div>

            <div className="w-96 bg-white p-4 m-4 rounded-md shadow-none space-y-4 text-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">👤 {currentUser?.name || currentUser?.username || 'Đang tải...'}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date().toLocaleString('vi-VN')}</span>
                </div>

                <div>
                    <div className="font-semibold mb-1">Nhà cung cấp</div>
                    <Select
                        size="small"
                        fullWidth
                        displayEmpty
                        value={isValidValue(selectedSupplier, suppliers) ? selectedSupplier : ''}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        renderValue={(selected) =>
                            selected && suppliers.find((s) => String(s.id) === String(selected))
                                ? suppliers.find((s) => String(s.id) === String(selected)).name
                                : 'Chọn nhà cung cấp'
                        }
                    >
                        {suppliers.map((supplier) => (
                            <MenuItem key={supplier.id} value={supplier.id}>🏬 {supplier.name}</MenuItem>
                        ))}
                    </Select>
                </div>

                <div>
                    <div className="font-semibold mb-1">Mã phiếu nhập</div>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Nhập mã phiếu"
                        value={nextImportCode}
                        InputProps={{ readOnly: true }}
                        variant="standard"
                        sx={{
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                            '& .MuiInput-underline:hover:before': {
                                borderBottomColor: 'transparent',
                            }
                        }}
                    />
                </div>

                <div>
                    <div className="font-semibold mb-1">Ghi chú</div>
                    <TextField
                        multiline
                        rows={2}
                        placeholder="Ghi chú"
                        fullWidth
                        variant="standard"
                        size="small"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        sx={{
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                            '& .MuiInput-underline:hover:before': {
                                borderBottomColor: 'transparent',
                            }
                        }}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <div className="font-semibold">Tổng tiền hàng</div>
                    <div className="text-right w-32">{formatCurrency(totalAmount)}</div>
                </div>

                <div>
                    <div className="font-semibold mb-1">Số tiền đã trả</div>
                    <TextField
                        size="small"
                        fullWidth
                        type="number"
                        placeholder="0"
                        value={paidAmount}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setPaidAmount(Math.max(0, value));
                        }}
                        InputProps={{
                            endAdornment: <span className="text-gray-500">VND</span>,
                        }}
                        variant="standard"
                        sx={{
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'transparent',
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#1976d2',
                            },
                            '& .MuiInput-underline:hover:before': {
                                borderBottomColor: 'transparent',
                            }
                        }}
                    />
                </div>

                {paidAmount > 0 && (
                    <div className="flex justify-between items-center">
                        <div className="font-semibold">Còn lại</div>
                        <div className={`text-right w-32 ${totalAmount - paidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(totalAmount - paidAmount)}
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={() => setPaidAmount(0)}
                        disabled={paidAmount === 0}
                    >
                        Chưa trả
                    </Button>
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={() => setPaidAmount(totalAmount)}
                        disabled={paidAmount === totalAmount}
                    >
                        Trả đủ
                    </Button>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button fullWidth variant="contained" className="!bg-blue-600 hover:!bg-blue-700 text-white" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FaLock />} onClick={handleSaveDraft} disabled={loading}>Lưu tạm</Button>
                    <Button fullWidth variant="contained" className="!bg-green-600 hover:!bg-green-700 text-white" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FaCheck />} onClick={handleComplete} disabled={loading}>Hoàn thành</Button>
                </div>
            </div>

            <AddProductDialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                onProductCreated={refreshProducts}
                onProductAdded={handleAddNewProduct}
            />

            {/* Category Dialog */}
            <Dialog 
                open={showCategoryDialog} 
                onClose={handleCloseCategoryDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle className="flex justify-between items-center">
                    <span>Thêm từ nhóm hàng</span>
                    <IconButton onClick={handleCloseCategoryDialog} size="small">
                        <span>×</span>
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Danh sách Category */}
                        <div>
                            <h3 className="font-semibold mb-3 text-gray-700">Danh mục sản phẩm</h3>
                            <div className="border rounded-lg max-h-80 overflow-y-auto">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => handleSelectCategory(category)}
                                        className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${
                                            selectedCategory?.id === category.id ? 'bg-blue-50 border-blue-200' : ''
                                        }`}
                                    >
                                        <div className="font-medium">{category.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {products.filter(p => p.categoryId === category.id || p.category?.id === category.id).length} sản phẩm
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Danh sách sản phẩm theo category */}
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
                                                <div className="font-medium">{product.name || product.productName}</div>
                                                <div className="text-sm text-gray-500">quả</div>
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
        </div>
    );
};

export default ImportPage;
