import React, { useEffect, useState } from 'react';
import {
    Select,
    MenuItem,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    Snackbar,
    Alert,
    Popover,
    IconButton,
    Tooltip,
} from '@mui/material';
import { FaLock, FaCheck } from 'react-icons/fa';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import saleTransactionService from '../../services/saleTransactionService';
import { userService } from '../../services/userService';
import AddCustomerDialog from './AddCustomerDialog';
import SaveIcon from '@mui/icons-material/Save';

const SaleSidebar = ({
    currentUser,
    customers,
    stores,
    selectedCustomer,
    selectedStore,
    saleDate,
    note,
    paidAmount,
    totalAmount,
    loading,
    onCustomerChange,
    onStoreChange,
    onDateChange,
    onNoteChange,
    onPaidAmountChange,
    onSaveDraft,
    onComplete,
    onCancel,
    formatCurrency,
    isValidValue,
    highlightCustomer = false,
    highlightStore = false,
    highlightProducts = false,
    setCustomers = () => { },
    paidAmountInput = '0',
    setPaidAmountInput = () => { },
    isBalanceStock = false,
    // Thêm props mới để hiển thị thông tin thay đổi
    originalData = null,
    hasChanges = false,
    onSave = null,
    selectedProducts = [], // Thêm selectedProducts vào props
    lockedStoreId = null,
    lockedStoreName = null,
    fromStocktake = false,
    props,
}) => {
    const [nextCode, setNextCode] = useState('');

    // Prefill for STAFF: default store to user's store and default customer to 'Khách lẻ' if available
    useEffect(() => {
        const roles = Array.isArray(currentUser?.roles) ? currentUser.roles.map(r => r?.toString().toUpperCase()) : [(currentUser?.role || '').toString().toUpperCase()];
        const isStaff = roles.some(r => r.includes('STAFF'));
        if (isStaff) {
            // prefill store
            const userStoreId = currentUser?.store?.id || currentUser?.storeId || localStorage.getItem('staff_store_id');
            if (userStoreId && !selectedStore) {
                // Tìm đúng id trong danh sách stores nếu dữ liệu là số/chuỗi
                const candidate = String(userStoreId);
                const storeMatch = stores.find(s => String(s.id) === candidate || String(s.storeId) === candidate || (s.storeName && s.storeName === currentUser?.storeName));
                const value = storeMatch ? String(storeMatch.id || storeMatch.storeId) : candidate;
                onStoreChange({ target: { value } });
            }
            // prefill customer chỉ khi là phiếu cân bằng
            if (isBalanceStock) {
                const khachLe = customers.find(c => (c.name || c.customerName) === 'Khách lẻ');
                if (khachLe && !selectedCustomer) {
                    onCustomerChange({ target: { value: khachLe.id } });
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, customers, stores, isBalanceStock, selectedStore, selectedCustomer]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // State cho khách hàng
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
    const filteredCustomers = customers.filter(c => {
        const name = c.name || c.customerName || '';
        const address = c.address || c.customerAddress || '';
        return (
            name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            address.toLowerCase().includes(customerSearch.toLowerCase())
        );
    });

    // State cho cửa hàng
    const [storeSearch, setStoreSearch] = useState('');
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const filteredStores = stores.filter(s => {
        const name = s.name || s.storeName || '';
        const address = s.address || s.storeAddress || '';
        return (
            name.toLowerCase().includes(storeSearch.toLowerCase()) ||
            address.toLowerCase().includes(storeSearch.toLowerCase())
        );
    });

    // Cập nhật search values khi có originalData
    useEffect(() => {
        if (originalData) {
            // Cập nhật customer search
            const customer = customers.find(c => String(c.id) === String(originalData.customerId));
            if (customer) {
                // Không set customerSearch để tránh dropdown mở ngay
                // setCustomerSearch(customer.name || customer.customerName || '');
                // Tự động set selectedCustomer nếu chưa có
                if (!selectedCustomer) {
                    onCustomerChange({ target: { value: customer.id } });
                }
            }
            
            // Cập nhật store search
            const store = stores.find(s => String(s.id) === String(originalData.storeId));
            if (store) {
                // Không set storeSearch để tránh dropdown mở ngay
                // setStoreSearch(store.name || store.storeName || '');
                // Tự động set selectedStore nếu chưa có
                if (!selectedStore) {
                    onStoreChange({ target: { value: store.id } });
                }
            }
        }
    }, [originalData, customers, stores, selectedCustomer, selectedStore, onCustomerChange, onStoreChange]);

    // Cập nhật search values khi selectedCustomer hoặc selectedStore thay đổi
    useEffect(() => {
        if (selectedCustomer) {
            const customer = customers.find(c => String(c.id) === String(selectedCustomer));
            if (customer) {
                setCustomerSearch(customer.name || customer.customerName || '');
            }
        }
    }, [selectedCustomer, customers]);

    useEffect(() => {
        if (selectedStore) {
            const store = stores.find(s => String(s.id) === String(selectedStore));
            if (store) {
                setStoreSearch(store.name || store.storeName || '');
            }
        }
    }, [selectedStore, stores]);

    // State cho số tiền đã trả focus
    const [isPaidAmountFocused, setIsPaidAmountFocused] = useState(false);
    // State cho lỗi nhập số tiền
    const [paidAmountError, setPaidAmountError] = useState('');
    // State cho snackbar lỗi
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

    // State hover cho customer và store
    const [hoveredCustomer, setHoveredCustomer] = useState(null);
    const [hoverCustomerAnchorEl, setHoverCustomerAnchorEl] = useState(null);
    const [hoveredStore, setHoveredStore] = useState(null);
    const [hoverStoreAnchorEl, setHoverStoreAnchorEl] = useState(null);

    const [creatorInfo, setCreatorInfo] = useState(null);
    const [isLoadingCreator, setIsLoadingCreator] = useState(false);

    // State cho dialog thêm khách hàng
    const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);

    // Auto-hide error highlight after 5 seconds
    React.useEffect(() => {
        if (paidAmountError) {
            const timer = setTimeout(() => {
                setPaidAmountError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [paidAmountError]);

    // Hàm xử lý khi thêm khách hàng thành công
    const handleCustomerAdded = (newCustomer) => {
        // Thêm vào danh sách customers
        setCustomers([...customers, newCustomer]);
        // Chọn khách hàng vừa thêm
        onCustomerChange({ target: { value: newCustomer.id } });
        setCustomerSearch(newCustomer.name);
    };

    useEffect(() => {
        const fetchNext = async () => {
            try {
                const code = isBalanceStock
                    ? await saleTransactionService.getNextBalanceCode()
                    : await saleTransactionService.getNextCode();
                setNextCode(code || '');
            } catch (e) {
                setNextCode('');
            }
        };
        fetchNext();
    }, [isBalanceStock]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // useEffect auto-clear hover khi dropdown đóng
    useEffect(() => {
        if (!customerDropdownOpen) {
            setHoveredCustomer(null);
            setHoverCustomerAnchorEl(null);
            setCreatorInfo(null);
            setIsLoadingCreator(false);
        }
    }, [customerDropdownOpen]);
    useEffect(() => {
        if (!storeDropdownOpen) {
            setHoveredStore(null);
            setHoverStoreAnchorEl(null);
        }
    }, [storeDropdownOpen]);

    // 1. useEffect: Mặc định trả đủ khi là phiếu cân bằng
    useEffect(() => {
        if (isBalanceStock) {
            onPaidAmountChange({ target: { value: totalAmount } });
            setPaidAmountInput(totalAmount.toLocaleString('vi-VN'));
        }
    }, [isBalanceStock, totalAmount]);

    return (
        <>
            <div className="w-96 bg-white p-4 m-4 rounded-md shadow-none space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                                                 <span className="text-sm font-medium">
                             👤 {currentUser?.fullName || currentUser?.name || currentUser?.username || currentUser?.username || 'User'}
                         </span>
                    </div>
                    <span className="text-xs text-gray-500">
                        {currentTime.toLocaleString('vi-VN')}
                    </span>
                </div>
                {/* Hiển thị mã phiếu bán */}
                <div className="mb-2">
                    <div className="text-xs text-gray-600 font-medium">{(note || '').toLowerCase().includes('cân bằng kho') || isBalanceStock ? 'Mã phiếu cân bằng' : 'Mã phiếu bán'}</div>
                    <div className="font-bold text-lg tracking-widest text-blue-900">{nextCode || (isBalanceStock ? 'PCB------' : 'PB------')}</div>
                </div>

                {/* Khách hàng */}
                <div>
                    <div className="font-semibold mb-1">Khách hàng</div>
                    <div className="relative">
                        {customers.length === 1 ? (
                            <TextField
                                size="small"
                                fullWidth
                                value={customers[0].name || customers[0].customerName || ''}
                                disabled
                                variant="outlined"
                                sx={highlightCustomer ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 1, background: '#fff6f6' } : {}}
                            />
                        ) : (
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Tìm khách hàng..."
                                value={(() => {
                                    // Nếu có originalData, hiển thị tên từ customer tương ứng
                                    if (originalData && originalData.customerId) {
                                        const customer = customers.find(c => String(c.id) === String(originalData.customerId));
                                        if (customer) {
                                            return customer.name || customer.customerName || '';
                                        }
                                    }
                                    // Nếu không có originalData, hiển thị từ customerSearch hoặc selectedCustomer
                                    return customerSearch || (customers.find(c => String(c.id) === String(selectedCustomer))?.name || customers.find(c => String(c.id) === String(selectedCustomer))?.customerName || '');
                                })()}
                                onChange={e => {
                                    setCustomerSearch(e.target.value);
                                    onCustomerChange({ target: { value: '' } });
                                }}
                                onFocus={() => setCustomerDropdownOpen(true)}
                                onBlur={() => {
                                    if (!hoveredCustomer) {
                                        setCustomerDropdownOpen(false);
                                        setHoveredCustomer(null);
                                        setHoverCustomerAnchorEl(null);
                                    }
                                }}
                                variant="outlined"
                                error={highlightCustomer}
                                sx={highlightCustomer ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 1, background: '#fff6f6' } : {}}
                                InputProps={{
                                    endAdornment: (
                                        <Tooltip title="Thêm khách hàng mới">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAddCustomerDialog(true);
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
                        )}
                        {customerDropdownOpen && filteredCustomers.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-60 max-w-xl w-full font-medium text-base max-h-60 overflow-y-auto overflow-x-hidden transition-all duration-200"
                                onMouseLeave={() => {
                                    setHoveredCustomer(null);
                                    setHoverCustomerAnchorEl(null);
                                    setCustomerDropdownOpen(false);
                                }}
                            >
                                {filteredCustomers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        onMouseDown={() => {
                                            onCustomerChange({ target: { value: customer.id } });
                                            setCustomerSearch('');
                                            setCustomerDropdownOpen(false);
                                            setHoveredCustomer(null);
                                            setHoverCustomerAnchorEl(null);
                                        }}
                                        onMouseEnter={e => {
                                            if (customerDropdownOpen) {
                                                setHoveredCustomer(customer);
                                                setHoverCustomerAnchorEl(e.currentTarget);
                                                if (customer.createBy && !creatorInfo) {
                                                    setIsLoadingCreator(true);
                                                    userService.getUserById(customer.createBy)
                                                        .then(user => {
                                                            setCreatorInfo(user);
                                                            setIsLoadingCreator(false);
                                                        })
                                                        .catch(() => {
                                                            setCreatorInfo(null);
                                                            setIsLoadingCreator(false);
                                                        });
                                                }
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredCustomer(null);
                                            setHoverCustomerAnchorEl(null);
                                        }}
                                        className={`flex flex-col px-6 py-3 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors duration-150 hover:bg-blue-50 ${String(selectedCustomer) === String(customer.id) ? 'bg-blue-100/70 text-blue-900 font-bold' : ''}`}
                                    >
                                        <span className="font-medium truncate max-w-[180px]">{customer.name || customer.customerName}</span>
                                        {(customer.address || customer.customerAddress) && (
                                            <span className="text-xs text-gray-400 truncate max-w-[260px]">{customer.address || customer.customerAddress}</span>
                                        )}
                                        {customer.phone && (
                                            <span className="text-xs text-gray-400 truncate max-w-[260px]">{customer.phone}</span>
                                        )}
                                        {customer.email && (
                                            <span className="text-xs text-gray-400 truncate max-w-[260px]">{customer.email}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <Popover
                    open={Boolean(hoveredCustomer) && Boolean(hoverCustomerAnchorEl) && customerDropdownOpen}
                    anchorEl={hoverCustomerAnchorEl}
                    onClose={() => {
                        setHoveredCustomer(null);
                        setHoverCustomerAnchorEl(null);
                    }}
                    anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'center', horizontal: 'left' }}
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
                                '0%': { opacity: 0, transform: 'scale(0.95) translateX(-10px)' },
                                '100%': { opacity: 1, transform: 'scale(1) translateX(0)' },
                            },
                        }
                    }}
                >
                    {hoveredCustomer && (
                        <div className="p-5 bg-white">
                            <div className="space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">{hoveredCustomer.name || hoveredCustomer.customerName}</h3>
                                    <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        Khách hàng
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {hoveredCustomer.phone && (
                                        <div className="flex items-center group">
                                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                                                <span className="text-green-600 text-sm">📞</span>
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium">{hoveredCustomer.phone}</span>
                                        </div>
                                    )}
                                    {hoveredCustomer.email && (
                                        <div className="flex items-center group">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                                                <span className="text-blue-600 text-sm">✉️</span>
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium">{hoveredCustomer.email}</span>
                                        </div>
                                    )}
                                    {(hoveredCustomer.address || hoveredCustomer.customerAddress) && (
                                        <div className="flex items-start group">
                                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 mt-0.5 group-hover:bg-orange-200 transition-colors">
                                                <span className="text-orange-600 text-sm">📍</span>
                                            </div>
                                            <span className="text-sm text-gray-700 leading-relaxed">{hoveredCustomer.address || hoveredCustomer.customerAddress}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Tổng nợ */}
                                {hoveredCustomer.totalDebt !== undefined && (
                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">Tổng nợ:</span>
                                            <span className={`text-sm font-bold px-2 py-1 rounded ${hoveredCustomer.totalDebt < 0 ? 'bg-red-100 text-red-700' : hoveredCustomer.totalDebt > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {(() => {
                                                    const totalDebt = hoveredCustomer.totalDebt || 0;
                                                    if (totalDebt < 0) {
                                                        return `-${Math.abs(totalDebt).toLocaleString('vi-VN')} VND`;
                                                    } else if (totalDebt > 0) {
                                                        return `+${totalDebt.toLocaleString('vi-VN')} VND`;
                                                    } else {
                                                        return `${totalDebt.toLocaleString('vi-VN')} VND`;
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* Ngày tạo, Người tạo */}
                                <div className="pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-500 space-y-2">
                                        {hoveredCustomer.createAt && (
                                            <div className="flex items-center">
                                                <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                                                <span>Ngày tạo: {new Date(hoveredCustomer.createAt).toLocaleDateString('vi-VN')}</span>
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

                {/* Cửa hàng */}
                <div>
                    <div className="font-semibold mb-1 flex items-center gap-2">
                        Cửa hàng
                        {currentUser?.roles?.includes('STAFF') && (
                            <Tooltip title="Cửa hàng được gán cố định cho nhân viên">
                                <FaLock size={12} className="text-gray-500" />
                            </Tooltip>
                        )}
                    </div>
                    <div className="relative">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder={
                                fromStocktake ? "Kho được chọn từ kiểm kê" :
                                currentUser?.roles?.includes('STAFF') ? "Cửa hàng được gán cố định" : "Tìm cửa hàng..."
                            }
                            value={(() => {
                                // Nếu có lockedStoreName từ stocktake, hiển thị nó
                                if (fromStocktake && lockedStoreName) {
                                    return lockedStoreName;
                                }
                                // Nếu có originalData, hiển thị tên từ store tương ứng
                                if (originalData && originalData.storeId) {
                                    const store = stores.find(s => String(s.id) === String(originalData.storeId));
                                    if (store) {
                                        return store.name || store.storeName || '';
                                    }
                                }
                                // Nếu không có originalData, hiển thị từ storeSearch hoặc selectedStore
                                return storeSearch || (stores.find(s => String(s.id) === String(selectedStore))?.name || stores.find(s => String(s.id) === String(selectedStore))?.storeName || '');
                            })()}
                            onChange={e => {
                                if (!currentUser?.roles?.includes('STAFF') && !fromStocktake) {
                                    setStoreSearch(e.target.value);
                                    onStoreChange({ target: { value: '' } });
                                }
                            }}
                            onFocus={() => {
                                if (!currentUser?.roles?.includes('STAFF') && !fromStocktake) {
                                    setStoreDropdownOpen(true);
                                }
                            }}
                            onBlur={() => {
                                if (!hoveredStore) {
                                    setStoreDropdownOpen(false);
                                    setHoveredStore(null);
                                    setHoverStoreAnchorEl(null);
                                }
                            }}
                            variant="outlined"
                            error={highlightStore}
                            disabled={currentUser?.roles?.includes('STAFF') || fromStocktake}
                            sx={{
                                ...(highlightStore ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 1, background: '#fff6f6' } : {}),
                                ...((currentUser?.roles?.includes('STAFF') || fromStocktake) ? {
                                    '& .MuiInputBase-input': {
                                        backgroundColor: fromStocktake ? '#e8f5e8' : '#f5f5f5',
                                        color: fromStocktake ? '#2e7d32' : '#666',
                                        cursor: 'not-allowed',
                                        fontWeight: fromStocktake ? 600 : 'normal'
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: fromStocktake ? '#e8f5e8' : '#f5f5f5',
                                        borderColor: fromStocktake ? '#4caf50' : undefined
                                    }
                                } : {})
                            }}
                        />
                        {!currentUser?.roles?.includes('STAFF') && !fromStocktake && storeDropdownOpen && filteredStores.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-60 max-w-xl w-full font-medium text-base max-h-60 overflow-y-auto overflow-x-hidden transition-all duration-200"
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
                                            onStoreChange({ target: { value: store.id } });
                                            setStoreSearch('');
                                            setStoreDropdownOpen(false);
                                            setHoveredStore(null);
                                            setHoverStoreAnchorEl(null);
                                        }}
                                        onMouseEnter={e => {
                                            if (storeDropdownOpen) {
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
                                        <span className="font-medium truncate max-w-[180px]">{store.name || store.storeName}</span>
                                        {(store.address || store.storeAddress) && (
                                            <span className="text-xs text-gray-400 truncate max-w-[260px]">{store.address || store.storeAddress}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {fromStocktake && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center text-green-700 text-sm">
                                    <span className="mr-2">🔒</span>
                                    <span>Kho đã được chọn từ bản kiểm kê</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <Popover
                    open={Boolean(hoveredStore) && Boolean(hoverStoreAnchorEl) && storeDropdownOpen}
                    anchorEl={hoverStoreAnchorEl}
                    onClose={() => {
                        setHoveredStore(null);
                        setHoverStoreAnchorEl(null);
                    }}
                    anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'center', horizontal: 'left' }}
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
                                '0%': { opacity: 0, transform: 'scale(0.95) translateX(-10px)' },
                                '100%': { opacity: 1, transform: 'scale(1) translateX(0)' },
                            },
                        }
                    }}
                >
                    {hoveredStore && (
                        <div className="p-5 bg-white">
                            <div className="space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">{hoveredStore.name || hoveredStore.storeName}</h3>
                                    <div className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        Cửa hàng
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {(hoveredStore.address || hoveredStore.storeAddress) && (
                                        <div className="flex items-start group">
                                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 mt-0.5 group-hover:bg-orange-200 transition-colors">
                                                <span className="text-orange-600 text-sm">📍</span>
                                            </div>
                                            <span className="text-sm text-gray-700 leading-relaxed">{hoveredStore.address || hoveredStore.storeAddress}</span>
                                        </div>
                                    )}
                                </div>
                                {hoveredStore.description && (
                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="text-xs text-gray-500">Mô tả: {hoveredStore.description}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Popover>

                <div>
                    <div className="font-semibold mb-1">Ngày bán</div>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                        <DatePicker
                            format="dd/MM/yyyy"
                            value={saleDate}
                            onChange={onDateChange}
                            slotProps={{
                                textField: {
                                    variant: 'standard',
                                    size: 'small',
                                    fullWidth: true,
                                    sx: {
                                        '& .MuiInput-underline:before': {
                                            borderBottomColor: 'transparent',
                                        },
                                        '& .MuiInput-underline:after': {
                                            borderBottomColor: '#1976d2',
                                        },
                                        '& .MuiInput-underline:hover:before': {
                                            borderBottomColor: 'transparent',
                                        },
                                    }
                                }
                            }}
                        />
                    </LocalizationProvider>
                </div>

                {/* Ghi chú */}
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
                        onChange={onNoteChange}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <div className="font-semibold">Tổng tiền hàng</div>
                    <div className="text-right w-32">{formatCurrency(totalAmount)}</div>
                </div>

                {/* Tổng nợ hiện tại của khách hàng */}
                {!isBalanceStock && selectedCustomer && (
                    <div className="flex justify-between items-start">
                        <div className="font-semibold">Tổng nợ hiện tại</div>
                        <div className={`text-right w-32 ${(() => {
                            const customer = customers.find(c => String(c.id) === String(selectedCustomer));
                            const totalDebt = customer?.totalDebt || 0;
                            return totalDebt < 0 ? 'text-red-600' : totalDebt > 0 ? 'text-green-600' : 'text-gray-600';
                        })()}`}>
                            {(() => {
                                const customer = customers.find(c => String(c.id) === String(selectedCustomer));
                                const totalDebt = customer?.totalDebt || 0;
                                if (totalDebt < 0) {
                                    return (
                                        <div>
                                            <div>-{formatCurrency(Math.abs(totalDebt))}</div>
                                            <div className="text-xs">(Khách đang nợ)</div>
                                        </div>
                                    );
                                } else if (totalDebt > 0) {
                                    return (
                                        <div>
                                            <div>+{formatCurrency(totalDebt)}</div>
                                            <div className="text-xs">(Cửa hàng nợ)</div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div>
                                            <div>{formatCurrency(0)}</div>
                                            <div className="text-xs">(Không nợ)</div>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                )}

                {/* Số tiền đã trả */}
                <div>
                    <div className="font-semibold mb-1">Số tiền đã trả</div>
                    <TextField
                        size="small"
                        fullWidth
                        type="text"
                        placeholder="Nhập số tiền đã trả"
                        value={isPaidAmountFocused && (paidAmountInput === '0' || paidAmountInput === '') ? '' : paidAmountInput}
                        onFocus={e => {
                            if (!isBalanceStock) {
                                setIsPaidAmountFocused(true);
                                if (paidAmountInput === '0') setPaidAmountInput('');
                            }
                        }}
                        onBlur={e => {
                            if (!isBalanceStock) {
                                setIsPaidAmountFocused(false);
                                const numericValue = e.target.value.replace(/\./g, '');
                                if (numericValue === '' || isNaN(Number(numericValue))) {
                                    setPaidAmountInput('0');
                                    onPaidAmountChange({ target: { value: 0 } });
                                } else {
                                    const formattedValue = Number(numericValue).toLocaleString('vi-VN');
                                    setPaidAmountInput(formattedValue);
                                    onPaidAmountChange({ target: { value: Number(numericValue) } });
                                }
                            }
                        }}
                        onChange={e => {
                            if (!isBalanceStock) {
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
                            }
                        }}
                        error={!!paidAmountError}
                        helperText={''}
                        disabled={isBalanceStock}
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
                        {formatCurrency(totalAmount - paidAmount)}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                            onPaidAmountChange({ target: { value: 0 } });
                            setPaidAmountInput('0');
                        }}
                        disabled={paidAmount === 0 || isBalanceStock}
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
                            onPaidAmountChange({ target: { value: totalAmount } });
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

                {/* Actions: Lưu tạm & Hoàn thành */}
                <div className="flex gap-2 mt-2">
                    {!isBalanceStock && (
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={onSaveDraft}
                            disabled={loading}
                            startIcon={<FaLock />}
                            sx={{
                                borderColor: '#bcd0ee',
                                color: '#1976d2',
                                '&:hover': {
                                    borderColor: '#1976d2',
                                    backgroundColor: '#e3f0ff'
                                }
                            }}
                        >
                            Lưu tạm
                        </Button>
                    )}
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={onComplete}
                        disabled={loading}
                        startIcon={<FaCheck />}
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
                        Hoàn thành
                    </Button>
                </div>

                {typeof onSave === 'function' && (
                    <Button
                        fullWidth
                        variant="contained" 
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} 
                        onClick={onSave} 
                        disabled={!hasChanges || loading}
                        sx={{
                            background: hasChanges ? 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' : '#ccc',
                            boxShadow: hasChanges ? '0 3px 15px rgba(25, 118, 210, 0.3)' : 'none',
                            '&:hover': {
                                background: hasChanges ? 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)' : '#ccc',
                                boxShadow: hasChanges ? '0 5px 20px rgba(25, 118, 210, 0.4)' : 'none',
                                transform: hasChanges ? 'translateY(-1px)' : 'none'
                            },
                            '&:disabled': {
                                background: '#ccc',
                                boxShadow: 'none',
                                transform: 'none'
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            mt: 1
                        }}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                )}


            </div>
            <AddCustomerDialog
                open={showAddCustomerDialog}
                onClose={() => setShowAddCustomerDialog(false)}
                onCustomerAdded={handleCustomerAdded}
                currentUser={currentUser}
            />

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
        </>
    );
};

export default SaleSidebar; 