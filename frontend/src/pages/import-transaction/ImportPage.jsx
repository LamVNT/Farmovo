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
} from '@mui/material';
import { FaLock, FaCheck, FaSearch, FaEye } from 'react-icons/fa';
import { MdKeyboardArrowDown, MdCategory } from 'react-icons/md';
import { FiPlus } from 'react-icons/fi';
import { DataGrid } from '@mui/x-data-grid';
import AddProductDialog from './AddProductDialog';
import { FaRegTrashCan } from "react-icons/fa6";
import importTransactionService from '../../services/importTransactionService';



// Dữ liệu mẫu
const sampleProducts = [
    { id: 1, code: 'SP001', name: 'Sữa tươi Vinamilk', unit: 'Thùng', price: 300000 },
    { id: 2, code: 'SP002', name: 'Trà xanh C2', unit: 'Thùng', price: 250000 },
    { id: 3, code: 'SP003', name: 'Mì Hảo Hảo', unit: 'Thùng', price: 200000 },
];

const ImportPage = () => {
    const [selectedUser, setSelectedUser] = useState('Vũ Lâm');
    const [importCode, setImportCode] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState({
        STT: true,
        'Mã hàng': true,
        'Tên hàng': true,
        'ĐVT': true,
        'Số lượng': true,
        'Đơn giá': true,
        'Giảm giá': true,
        'Thành tiền': true,
    });

    // API data states
    const [formData, setFormData] = useState({
        customers: [],
        products: [],
        zones: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const users = ['Vũ Lâm', 'Minh Tuấn', 'Hoàng Anh'];

    // Load form data from API
    useEffect(() => {
        const loadFormData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await importTransactionService.getCreateFormData();
                setFormData(data);
            } catch (err) {
                console.error('Error loading form data:', err);
                setError('Không thể tải dữ liệu form');
            } finally {
                setLoading(false);
            }
        };

        loadFormData();
    }, []);

    const formatCurrency = (value) => {
        const number = Number(value);
        return !isNaN(number) ? number.toLocaleString('vi-VN') + '₫' : '0₫';
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
            const results = formData.products.filter(
                (p) =>
                    p.productName.toLowerCase().includes(value.toLowerCase()) ||
                    p.productCode.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredProducts(results);
        }
    };

    const handleSelectProduct = (product) => {
        if (!selectedProducts.find((p) => p.id === product.id)) {
            const price = Number(product.unitPrice) || 0;
            const quantity = 1;
            const discount = 0;
            const total = price * quantity - discount;

            setSelectedProducts((prev) => [
                ...prev,
                {
                    id: product.id,
                    code: product.productCode,
                    name: product.productName,
                    unit: product.unit,
                    price,
                    quantity,
                    discount,
                    total,
                    productId: product.id,
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
                        total: (p.price || 0) * (p.quantity + delta) - (p.discount || 0),
                    }
                    : p
            )
        );
    };

    const handleDeleteProduct = (id) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
    };

    const handleSaveDraft = async () => {
        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const importData = {
                name: importCode || `PN${Date.now()}`,
                supplierId: 1, // TODO: Get from form
                storeId: 1, // TODO: Get from form
                staffId: 1, // TODO: Get from form
                importTransactionNote: '', // TODO: Get from form
                details: selectedProducts.map(product => ({
                    productId: product.productId,
                    importQuantity: product.quantity,
                    remainQuantity: product.quantity,
                    expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
                    unitImportPrice: product.price,
                    unitSalePrice: product.price * 1.2, // 20% markup
                    zones_id: "A1" // TODO: Get from form
                }))
            };

            await importTransactionService.create(importData);
            setSuccess('Tạo phiếu nhập hàng thành công!');
            setSelectedProducts([]);
            setImportCode('');
        } catch (err) {
            console.error('Error creating import transaction:', err);
            setError('Không thể tạo phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        // Similar to save draft but with different status
        await handleSaveDraft();
    };

    const columns = [
        columnVisibility['STT'] && {
            field: 'id',
            headerName: 'STT',
            width: 80,
            cellClassName: 'custom-cell',
        },
        columnVisibility['Mã hàng'] && {
            field: 'code',
            headerName: 'Mã hàng',
            flex: 1,
            cellClassName: 'custom-cell',
        },
        columnVisibility['Tên hàng'] && {
            field: 'name',
            headerName: 'Tên hàng',
            flex: 1,
            cellClassName: 'custom-cell',
        },
        columnVisibility['ĐVT'] && {
            field: 'unit',
            headerName: 'ĐVT',
            width: 100,
            cellClassName: 'custom-cell',
        },
        columnVisibility['Số lượng'] && {
            field: 'quantity',
            headerName: 'Số lượng',
            width: 160,
            renderCell: (params) => (
                <div className="quantity-cell">
                    <button
                        onClick={() => handleQuantityChange(params.row.id, -1)}
                        className="quantity-square-btn"
                    >
                        –
                    </button>
                    <span className="quantity-value">{params.row.quantity}</span>
                    <button
                        onClick={() => handleQuantityChange(params.row.id, 1)}
                        className="quantity-square-btn"
                    >
                        +
                    </button>
                </div>
            )


        },
        columnVisibility['Đơn giá'] && {
            field: 'price',
            headerName: 'Đơn giá',
            flex: 1,
            valueFormatter: (params) => formatCurrency(params.value),
            cellClassName: 'custom-cell',
        },
        columnVisibility['Giảm giá'] && {
            field: 'discount',
            headerName: 'Giảm giá',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value),
            cellClassName: 'custom-cell',
        },
        columnVisibility['Thành tiền'] && {
            field: 'total',
            headerName: 'Thành tiền',
            width: 150,
            valueGetter: (params) => {
                const row = params?.row ?? {};
                const price = Number(row.price) || 0;
                const quantity = Number(row.quantity) || 0;
                const discount = Number(row.discount) || 0;
                return price * quantity - discount;
            },
            valueFormatter: (params) => formatCurrency(params.value),
            cellClassName: 'custom-cell',
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Tooltip title="Tạo mới hàng hóa">
                    <IconButton
                        size="small"
                        onClick={() => handleDeleteProduct(params.row.id)}
                    >
                        <FaRegTrashCan />
                    </IconButton>
                </Tooltip>

            ),
        },
    ].filter(Boolean);

    const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.total || 0), 0);

    if (loading && formData.products.length === 0) {
        return (
            <div className="flex w-full h-screen bg-gray-100 items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="flex w-full h-screen bg-gray-100">
            {error && (
                <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                    {success}
                </Alert>
            )}
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
                        <Tooltip title="Thêm từ nhóm hàng">
                            <IconButton>
                                <MdCategory />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Tạo mới hàng hóa">
                            <IconButton
                                size="small"
                                onClick={() => setOpenDialog(true)}
                            >
                                <FiPlus />
                            </IconButton>
                        </Tooltip>
                        {filteredProducts.length > 0 && (
                            <div className="absolute top-10 left-0 z-10 bg-white border shadow-md rounded w-full max-h-60 overflow-y-auto text-sm">
                                {filteredProducts.map((product, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSelectProduct(product)}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <div className="font-medium">{product.productName}</div>
                                        <div className="text-xs text-gray-500">
                                            {product.productCode} - {product.unit}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="ml-auto">
                        <Tooltip title="Ẩn/hiện cột hiển thị">
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                                <FaEye />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                        >
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
                    <Select
                        size="small"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="text-sm"
                        IconComponent={MdKeyboardArrowDown}
                    >
                        {users.map((user) => (
                            <MenuItem key={user} value={user}>
                                👤 {user}
                            </MenuItem>
                        ))}
                    </Select>
                    <span className="text-xs text-gray-500">01/07/2025 01:17</span>
                </div>

                <TextField
                    size="small"
                    fullWidth
                    placeholder="Tìm nhà cung cấp"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton size="small">
                                    <FiPlus className="text-blue-600" />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <div>
                    <div className="font-semibold mb-1">Mã phiếu nhập</div>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Nhập mã phiếu"
                        value={importCode}
                        onChange={(e) => setImportCode(e.target.value)}
                    />
                </div>

                <div className="font-semibold">Mã đặt hàng nhập</div>
                <div className="text-gray-500">----</div>

                <div className="font-semibold">Trạng thái</div>
                <FormControlLabel control={<Checkbox checked />} label="Phiếu tạm" />

                <div className="flex justify-between items-center">
                    <div className="font-semibold">Tổng tiền hàng</div>
                    <TextField value={formatCurrency(totalAmount)} size="small" style={{ width: '120px' }} />
                </div>

                <div className="flex justify-between">
                    <div className="font-semibold">Giảm giá</div>
                    <div>0</div>
                </div>

                <div className="flex justify-between">
                    <div className="font-semibold">Cần trả nhà cung cấp</div>
                    <div className="text-blue-600 cursor-pointer">{formatCurrency(totalAmount)}</div>
                </div>

                <TextField multiline rows={2} placeholder="Ghi chú" fullWidth variant="outlined" size="small" />

                <div className="flex gap-2 pt-2">
                    <Button 
                        fullWidth 
                        variant="contained" 
                        className="!bg-blue-600 hover:!bg-blue-700 text-white" 
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FaLock />}
                        onClick={handleSaveDraft}
                        disabled={loading}
                    >
                        Lưu tạm
                    </Button>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        className="!bg-green-600 hover:!bg-green-700 text-white" 
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FaCheck />}
                        onClick={handleComplete}
                        disabled={loading}
                    >
                        Hoàn thành
                    </Button>
                </div>
            </div>

            <AddProductDialog open={openDialog} onClose={() => setOpenDialog(false)} />
        </div>
    );
};

export default ImportPage;
