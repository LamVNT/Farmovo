import React, { useState, useEffect } from 'react';
import { TextField, Button, CircularProgress, IconButton, Tooltip, Snackbar, Alert, Popover } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import AddSupplierDialog from './AddSupplierDialog';
import { userService } from '../../services/userService';
import { useNavigate } from 'react-router-dom';

const ImportSidebar = ({
    currentUser,
    currentTime = new Date(),
    nextImportCode,
    suppliers = [],
    setSuppliers = () => {},
    selectedSupplier,
    setSelectedSupplier,
    supplierSearch = '',
    setSupplierSearch = () => {},
    supplierDropdownOpen = false,
    setSupplierDropdownOpen = () => {},
    filteredSuppliers = [],
    stores = [],
    selectedStore,
    setSelectedStore,
    storeSearch = '',
    setStoreSearch = () => {},
    storeDropdownOpen = false,
    setStoreDropdownOpen = () => {},
    filteredStores = [],
    note,
    setNote,
    totalAmount = 0,
    paidAmount = 0,
    paidAmountInput = '0',
    setPaidAmountInput = () => {},
    setPaidAmount = () => {},
    highlightSupplier = false,
    highlightStore = false,
    loading = false,
    onSaveDraft = () => {},
    onComplete = () => {},
}) => {
    // State cho số tiền đã trả focus
    const [isPaidAmountFocused, setIsPaidAmountFocused] = useState(false);
    // State cho lỗi nhập số tiền
    const [paidAmountError, setPaidAmountError] = useState('');
    // State cho snackbar lỗi
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    
    // State cho dialog thêm nhà cung cấp
    const [showAddSupplierDialog, setShowAddSupplierDialog] = useState(false);
    
    // State cho dialog hover supplier
    const [hoveredSupplier, setHoveredSupplier] = useState(null);
    const [hoverAnchorEl, setHoverAnchorEl] = useState(null);
    const [creatorInfo, setCreatorInfo] = useState(null);
    const [isLoadingCreator, setIsLoadingCreator] = useState(false);

    // State cho dialog hover store
    const [hoveredStore, setHoveredStore] = useState(null);
    const [hoverStoreAnchorEl, setHoverStoreAnchorEl] = useState(null);

    // Auto-hide error highlight after 5 seconds
    React.useEffect(() => {
        if (paidAmountError) {
            const timer = setTimeout(() => {
                setPaidAmountError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [paidAmountError]);

    // Thêm useEffect để auto-clear hover khi dropdown đóng
    useEffect(() => {
        if (!supplierDropdownOpen) {
            setHoveredSupplier(null);
            setHoverAnchorEl(null);
            setCreatorInfo(null);
            setIsLoadingCreator(false);
        }
    }, [supplierDropdownOpen]);

    // Thêm useEffect cho storeDropdownOpen
    useEffect(() => {
        if (!storeDropdownOpen) {
            setHoveredStore(null);
            setHoverStoreAnchorEl(null);
        }
    }, [storeDropdownOpen]);

    // Hàm xử lý khi thêm nhà cung cấp thành công
    const handleSupplierAdded = (newSupplier) => {
        // Thêm vào danh sách suppliers
        setSuppliers([...suppliers, newSupplier]);
        // Chọn nhà cung cấp vừa thêm
        setSelectedSupplier(newSupplier.id);
        setSupplierSearch(newSupplier.name);
    };

    const navigate = useNavigate();

    return (
        <>
        <div className="w-96 bg-white p-4 m-4 rounded-md shadow-none space-y-4 text-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">👤 {currentUser?.name || currentUser?.username || 'Đang tải...'}</span>
                </div>
                <span className="text-xs text-gray-500">{currentTime.toLocaleString('vi-VN')}</span>
            </div>

            {/* Mã phiếu nhập lên trên cùng */}
            <div className="mb-2">
                <div className="text-xs text-gray-600 font-medium">Mã phiếu nhập</div>
                <div className="font-bold text-lg tracking-widest text-blue-900">{nextImportCode}</div>
            </div>

            {/* Nhà cung cấp */}
            <div>
                <div className="font-semibold mb-1">Nhà cung cấp</div>
                <div className="relative">
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Tìm nhà cung cấp..."
                        value={supplierSearch || (suppliers.find(s => String(s.id) === String(selectedSupplier))?.name || '')}
                        onChange={e => {
                            setSupplierSearch(e.target.value);
                            setSelectedSupplier('');
                        }}
                        onFocus={() => setSupplierDropdownOpen(true)}
                        onBlur={() => {
                            if (!hoveredSupplier) {
                                setSupplierDropdownOpen(false);
                                setHoveredSupplier(null);
                                setHoverAnchorEl(null);
                                setCreatorInfo(null);
                                setIsLoadingCreator(false);
                            }
                        }}
                        variant="outlined"
                        error={highlightSupplier}
                        sx={highlightSupplier ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 1, background: '#fff6f6' } : {}}
                        InputProps={{
                            endAdornment: (
                                <Tooltip title="Thêm nhà cung cấp mới">
                                    <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAddSupplierDialog(true);
                                        }}
                                        sx={{ 
                                            color: '#1976d2',
                                            '&:hover': { 
                                                backgroundColor: '#e3f0ff',
                                                transform: 'scale(1.1)'
                                            },
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            ),
                        }}
                    />
                    {(supplierDropdownOpen || supplierSearch.trim() !== '') && filteredSuppliers.length > 0 && (
                        <div 
                            className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-60 max-w-xl w-full font-medium text-base max-h-60 overflow-y-auto overflow-x-hidden transition-all duration-200"
                            onMouseLeave={() => {
                                setHoveredSupplier(null);
                                setHoverAnchorEl(null);
                                setCreatorInfo(null);
                                setIsLoadingCreator(false);
                                setSupplierDropdownOpen(false);
                            }}
                        >
                            {filteredSuppliers.map((supplier) => (
                                <div
                                    key={supplier.id}
                                    onMouseDown={() => {
                                        setSelectedSupplier(supplier.id);
                                        setSupplierSearch('');
                                        setSupplierDropdownOpen(false);
                                        setHoveredSupplier(null);
                                        setHoverAnchorEl(null);
                                        setCreatorInfo(null);
                                        setIsLoadingCreator(false);
                                    }}
                                    onMouseEnter={(e) => {
                                        // Chỉ set hover khi dropdown đang mở
                                        if (supplierDropdownOpen || supplierSearch.trim() !== '') {
                                            setHoveredSupplier(supplier);
                                            setHoverAnchorEl(e.currentTarget);
                                            
                                            // Lấy thông tin người tạo nếu có
                                            if (supplier.createBy && !creatorInfo) {
                                                setIsLoadingCreator(true);
                                                userService.getUserById(supplier.createBy)
                                                    .then(user => {
                                                        setCreatorInfo(user);
                                                        setIsLoadingCreator(false);
                                                    })
                                                    .catch(error => {
                                                        setCreatorInfo(null);
                                                        setIsLoadingCreator(false);
                                                    });
                                            }
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        // Clear hover state
                                        setHoveredSupplier(null);
                                        setHoverAnchorEl(null);
                                        setCreatorInfo(null);
                                        setIsLoadingCreator(false);
                                    }}
                                    className={`flex flex-col px-6 py-3 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors duration-150 hover:bg-blue-50 ${String(selectedSupplier) === String(supplier.id) ? 'bg-blue-100/70 text-blue-900 font-bold' : ''}`}
                                >
                                    <span className="font-medium truncate max-w-[180px]">{supplier.name}</span>
                                    {supplier.address && (
                                        <span className="text-xs text-gray-400 truncate max-w-[260px]">{supplier.address}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Cửa hàng */}
            <div>
                <div className="font-semibold mb-1">Cửa hàng</div>
                <div className="relative">
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Tìm cửa hàng..."
                        value={storeSearch || (stores.find(s => String(s.id) === String(selectedStore))?.name || '')}
                        onChange={e => {
                            setStoreSearch(e.target.value);
                            setSelectedStore('');
                        }}
                        onFocus={() => setStoreDropdownOpen(true)}
                        onBlur={() => {
                            if (!hoveredStore) {
                                setStoreDropdownOpen(false);
                                setHoveredStore(null);
                                setHoverStoreAnchorEl(null);
                            }
                        }}
                        variant="outlined"
                        error={highlightStore}
                        sx={highlightStore ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 1, background: '#fff6f6' } : {}}
                    />
                    {(storeDropdownOpen || storeSearch.trim() !== '') && filteredStores.length > 0 && (
                        <div
                            className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-60 max-w-xl w-full font-medium text-base max-h-60 overflow-y-auto overflow-x-hidden transition-all duration-200"
                            onMouseLeave={() => {
                                setHoveredStore(null);
                                setHoverStoreAnchorEl(null);
                                setStoreDropdownOpen(false);
                            }}
                        >
                            {filteredStores.map((store) => (
                                <div
                                    key={store.id}
                                    onMouseDown={() => {
                                        setSelectedStore(store.id);
                                        setStoreSearch('');
                                        setStoreDropdownOpen(false);
                                        setHoveredStore(null);
                                        setHoverStoreAnchorEl(null);
                                    }}
                                    onMouseEnter={e => {
                                        if (storeDropdownOpen || storeSearch.trim() !== '') {
                                            setHoveredStore(store);
                                            setHoverStoreAnchorEl(e.currentTarget);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredStore(null);
                                        setHoverStoreAnchorEl(null);
                                    }}
                                    className={`flex flex-col px-6 py-3 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors duration-150 hover:bg-blue-50 ${String(selectedStore) === String(store.id) ? 'bg-blue-100/70 text-blue-900 font-bold' : ''}`}
                                >
                                    <span className="font-medium truncate max-w-[180px]">{store.name}</span>
                                    {store.address && (
                                        <span className="text-xs text-gray-400 truncate max-w-[260px]">{store.address}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div className="font-semibold mb-1">Ghi chú</div>
                <TextField
                    multiline
                    rows={2}
                    placeholder="Nhập ghi chú"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />
            </div>

            <div className="flex justify-between items-center">
                <div className="font-semibold">Tổng tiền hàng</div>
                <div className="text-right w-32">{totalAmount.toLocaleString('vi-VN')} VND</div>
            </div>

            {/* Tổng nợ hiện tại của nhà cung cấp */}
            {selectedSupplier && (
                <div className="flex justify-between items-center">
                    <div className="font-semibold">Tổng nợ hiện tại</div>
                    <div className={`text-right w-32 ${(() => {
                        const supplier = suppliers.find(s => String(s.id) === String(selectedSupplier));
                        const totalDebt = supplier?.totalDebt || 0;
                        return totalDebt > 0 ? 'text-red-600' : totalDebt < 0 ? 'text-green-600' : 'text-gray-600';
                    })()}`}>
                        {(() => {
                            const supplier = suppliers.find(s => String(s.id) === String(selectedSupplier));
                            const totalDebt = supplier?.totalDebt || 0;
                            if (totalDebt > 0) {
                                return `+${totalDebt.toLocaleString('vi-VN')} VND (Nhà cung cấp nợ)`;
                            } else if (totalDebt < 0) {
                                return `-${Math.abs(totalDebt).toLocaleString('vi-VN')} VND (Cửa hàng nợ)`;
                            } else {
                                return `${totalDebt.toLocaleString('vi-VN')} VND (Không nợ)`;
                            }
                        })()}
                    </div>
                </div>
            )}

            <div>
                <div className="font-semibold mb-1">Số tiền đã trả</div>
                <TextField
                    size="small"
                    fullWidth
                    type="text"
                    placeholder="Nhập số tiền đã trả"
                    value={isPaidAmountFocused && (paidAmountInput === '0' || paidAmountInput === '') ? '' : paidAmountInput}
                    onFocus={e => {
                        setIsPaidAmountFocused(true);
                        if (paidAmountInput === '0') setPaidAmountInput('');
                    }}
                    onBlur={e => {
                        setIsPaidAmountFocused(false);
                        const numericValue = e.target.value.replace(/\./g, '');
                        if (numericValue === '' || isNaN(Number(numericValue))) {
                            setPaidAmountInput('0');
                            setPaidAmount(0);
                        } else {
                            const formattedValue = Number(numericValue).toLocaleString('vi-VN');
                            setPaidAmountInput(formattedValue);
                            setPaidAmount(Number(numericValue));
                        }
                    }}
                    onChange={e => {
                        const val = e.target.value.replace(/\./g, ''); // Loại bỏ dấu chấm để validate
                        // Cho phép nhập số và chuỗi rỗng
                        if (val === '' || /^\d+$/.test(val)) {
                            if (val === '' || Number(val) <= Number.MAX_SAFE_INTEGER) {
                                setPaidAmountError('');
                                // Thêm dấu chấm phân cách hàng nghìn ngay khi nhập
                                const formattedVal = val === '' ? '' : Number(val).toLocaleString('vi-VN');
                                setPaidAmountInput(formattedVal);
                            } else {
                                setPaidAmountError('Số quá lớn');
                                setSnackbar({ open: true, message: 'Không được nhập số quá lớn (tối đa 9,007,199,254,740,991)', severity: 'error' });
                            }
                        } else {
                            setPaidAmountError('Chỉ được nhập số');
                            setSnackbar({ open: true, message: 'Chỉ được nhập số nguyên dương', severity: 'error' });
                        }
                    }}
                    error={!!paidAmountError}
                    helperText={''}
                    InputProps={{
                        endAdornment: <span className="text-gray-500">VND</span>,
                        inputProps: {
                            style: { textAlign: 'left', padding: '6px 8px' },
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                        }
                    }}
                    variant="outlined"
                    sx={{
                        ...(!!paidAmountError && { 
                            boxShadow: '0 0 0 3px #ffbdbd', 
                            borderRadius: 1, 
                            background: '#fff6f6' 
                        }),
                        '& .MuiFormHelperText-root': {
                            marginLeft: 0,
                            textAlign: 'left',
                            paddingLeft: 0,
                        }
                    }}
                />
            </div>

            <div className="flex justify-between items-center">
                <div className="font-semibold">Còn lại</div>
                <div className={`text-right w-32 ${totalAmount - paidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {(totalAmount - paidAmount).toLocaleString('vi-VN')} VND
                </div>
            </div>

            <div className="flex gap-2">
                <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => {
                        setPaidAmount(0);
                        setPaidAmountInput('0');
                    }}
                    disabled={paidAmount === 0}
                    sx={{
                        borderColor: '#ddd',
                        color: '#666',
                        '&:hover': {
                            borderColor: '#999',
                            backgroundColor: '#f5f5f5'
                        },
                        '&:disabled': {
                            borderColor: '#eee',
                            color: '#ccc'
                        }
                    }}
                >
                    Chưa trả
                </Button>
                <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => {
                        setPaidAmount(totalAmount);
                        setPaidAmountInput(totalAmount.toLocaleString('vi-VN'));
                    }}
                    disabled={paidAmount === totalAmount}
                    sx={{
                        borderColor: '#ddd',
                        color: '#666',
                        '&:hover': {
                            borderColor: '#999',
                            backgroundColor: '#f5f5f5'
                        },
                        '&:disabled': {
                            borderColor: '#eee',
                            color: '#ccc'
                        }
                    }}
                >
                    Trả đủ
                </Button>
            </div>

            <div className="flex gap-2 pt-2">
                <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockIcon />} 
                    onClick={onSaveDraft} 
                    disabled={loading}
                    sx={{
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        boxShadow: '0 3px 15px rgba(25, 118, 210, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                            boxShadow: '0 5px 20px rgba(25, 118, 210, 0.4)',
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
                    Lưu tạm
                </Button>
                <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />} 
                    onClick={onComplete} 
                    disabled={loading}
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
                    Hoàn thành
                </Button>
            </div>
            <Button
                fullWidth
                variant="contained"
                color="inherit"
                sx={{
                    mt: 2,
                    borderRadius: 2,
                    fontWeight: 600,
                    color: '#fff',
                    background: '#888',
                    boxShadow: 'none',
                    '&:hover': {
                        background: '#555',
                        boxShadow: 'none',
                        transform: 'none'
                    },
                    transition: 'all 0.2s ease'
                }}
                onClick={() => navigate('/import')}
            >
                Đóng
            </Button>
        </div>

        {/* Snackbar cho thông báo lỗi */}
        <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
                severity={snackbar.severity}
                sx={{ width: '100%' }}
            >
                {snackbar.message}
            </Alert>
        </Snackbar>

        {/* Dialog thêm nhà cung cấp */}
        <AddSupplierDialog
            open={showAddSupplierDialog}
            onClose={() => setShowAddSupplierDialog(false)}
            onSupplierAdded={handleSupplierAdded}
            currentUser={currentUser}
        />

        {/* Popover hiển thị thông tin chi tiết nhà cung cấp */}
        <Popover
            open={Boolean(hoveredSupplier) && Boolean(hoverAnchorEl) && supplierDropdownOpen}
            anchorEl={hoverAnchorEl}
            onClose={() => {
                setHoveredSupplier(null);
                setHoverAnchorEl(null);
                setCreatorInfo(null);
                setIsLoadingCreator(false);
            }}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'left',
            }}
            sx={{
                pointerEvents: 'none',
                '& .MuiPopover-paper': {
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    borderRadius: 3,
                    border: '1px solid #e8e8e8',
                    maxWidth: 320,
                    minWidth: 280,
                    animation: 'fadeInScale 0.2s ease-out',
                    '@keyframes fadeInScale': {
                        '0%': {
                            opacity: 0,
                            transform: 'scale(0.95) translateX(-10px)',
                        },
                        '100%': {
                            opacity: 1,
                            transform: 'scale(1) translateX(0)',
                        },
                    },
                }
            }}
        >
            {hoveredSupplier && (
                <div className="p-5 bg-white">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{hoveredSupplier.name}</h3>
                            <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                Nhà cung cấp
                            </div>
                        </div>
                        
                        {/* Thông tin liên hệ */}
                        <div className="space-y-3">
                            {hoveredSupplier.phone && (
                                <div className="flex items-center group">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                                        <span className="text-green-600 text-sm">📞</span>
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{hoveredSupplier.phone}</span>
                                </div>
                            )}
                            
                            {hoveredSupplier.email && (
                                <div className="flex items-center group">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                                        <span className="text-blue-600 text-sm">✉️</span>
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{hoveredSupplier.email}</span>
                                </div>
                            )}
                            
                            {hoveredSupplier.address && (
                                <div className="flex items-start group">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 mt-0.5 group-hover:bg-orange-200 transition-colors">
                                        <span className="text-orange-600 text-sm">📍</span>
                                    </div>
                                    <span className="text-sm text-gray-700 leading-relaxed">{hoveredSupplier.address}</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Thông tin tài chính */}
                        {hoveredSupplier.totalDebt !== undefined && (
                            <div className="pt-3 border-t border-gray-100">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">Tổng nợ:</span>
                                    <span className={`text-sm font-bold px-2 py-1 rounded ${hoveredSupplier.totalDebt > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {hoveredSupplier.totalDebt?.toLocaleString('vi-VN') || '0'} VND
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {/* Thông tin hệ thống */}
                        <div className="pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 space-y-2">
                                {hoveredSupplier.createAt && (
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                                        <span>Ngày tạo: {new Date(hoveredSupplier.createAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                )}
                                {isLoadingCreator ? (
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                                        <span>Người tạo: <span className="text-blue-500">Đang tải...</span></span>
                                    </div>
                                ) : creatorInfo ? (
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                                        <span>Người tạo: <span className="font-medium text-gray-700">{creatorInfo.fullName || creatorInfo.username}</span></span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Popover>

        {/* Popover hiển thị thông tin chi tiết cửa hàng */}
        <Popover
            open={Boolean(hoveredStore) && Boolean(hoverStoreAnchorEl) && storeDropdownOpen}
            anchorEl={hoverStoreAnchorEl}
            onClose={() => {
                setHoveredStore(null);
                setHoverStoreAnchorEl(null);
            }}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'left',
            }}
            sx={{
                pointerEvents: 'none',
                '& .MuiPopover-paper': {
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    borderRadius: 3,
                    border: '1px solid #e8e8e8',
                    maxWidth: 320,
                    minWidth: 280,
                    animation: 'fadeInScale 0.2s ease-out',
                    '@keyframes fadeInScale': {
                        '0%': {
                            opacity: 0,
                            transform: 'scale(0.95) translateX(-10px)',
                        },
                        '100%': {
                            opacity: 1,
                            transform: 'scale(1) translateX(0)',
                        },
                    },
                }
            }}
        >
            {hoveredStore && (
                <div className="p-5 bg-white">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{hoveredStore.name}</h3>
                            <div className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Cửa hàng
                            </div>
                        </div>
                        {/* Thông tin liên hệ */}
                        <div className="space-y-3">
                            {hoveredStore.address && (
                                <div className="flex items-start group">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 mt-0.5 group-hover:bg-orange-200 transition-colors">
                                        <span className="text-orange-600 text-sm">📍</span>
                                    </div>
                                    <span className="text-sm text-gray-700 leading-relaxed">{hoveredStore.address}</span>
                                </div>
                            )}
                        </div>
                        {/* Thông tin mô tả */}
                        {hoveredStore.description && (
                            <div className="pt-3 border-t border-gray-100">
                                <div className="text-xs text-gray-500">Mô tả: {hoveredStore.description}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Popover>
    </>
    );
};

export default ImportSidebar; 