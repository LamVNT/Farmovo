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
} from '@mui/material';
import { FaLock, FaCheck } from 'react-icons/fa';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import Autocomplete from '@mui/material/Autocomplete';
import saleTransactionService from '../../services/saleTransactionService';

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
    isValidValue
}) => {
    const [nextCode, setNextCode] = useState('');
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

    // State cho số tiền đã trả focus
    const [isPaidAmountFocused, setIsPaidAmountFocused] = useState(false);
    // State cho lỗi nhập số tiền
    const [paidAmountError, setPaidAmountError] = useState('');
    // State cho snackbar lỗi
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

    useEffect(() => {
        saleTransactionService.getNextCode().then(setNextCode).catch(() => setNextCode(''));
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
        <div className="w-96 bg-white p-4 m-4 rounded-md shadow-none space-y-4 text-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        👤 {currentUser?.fullName || currentUser?.name || currentUser?.username || 'User'}
                    </span>
                </div>
                <span className="text-xs text-gray-500">
                    {currentTime.toLocaleString('vi-VN')}
                </span>
            </div>
            {/* Hiển thị mã phiếu bán */}
            <div className="mb-2">
                <div className="text-xs text-gray-600 font-medium">Mã phiếu bán</div>
                <div className="font-bold text-lg tracking-widest text-blue-900">{nextCode}</div>
            </div>

            {/* Khách hàng */}
            <div>
                <div className="font-semibold mb-1">Khách hàng</div>
                <div className="relative">
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Tìm khách hàng..."
                        value={customerSearch || (customers.find(c => String(c.id) === String(selectedCustomer))?.name || customers.find(c => String(c.id) === String(selectedCustomer))?.customerName || '')}
                        onChange={e => {
                            setCustomerSearch(e.target.value);
                            onCustomerChange({ target: { value: '' } });
                        }}
                        onFocus={() => setCustomerDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 150)}
                        variant="outlined"
                    />
                    {(customerDropdownOpen || customerSearch.trim() !== '') && filteredCustomers.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-60 max-w-xl w-full font-medium text-base max-h-60 overflow-y-auto overflow-x-hidden transition-all duration-200">
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    onClick={() => {
                                        onCustomerChange({ target: { value: customer.id } });
                                        setCustomerSearch('');
                                        setCustomerDropdownOpen(false);
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

            {/* Cửa hàng */}
            <div>
                <div className="font-semibold mb-1">Cửa hàng</div>
                <div className="relative">
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Tìm cửa hàng..."
                        value={storeSearch || (stores.find(s => String(s.id) === String(selectedStore))?.name || stores.find(s => String(s.id) === String(selectedStore))?.storeName || '')}
                        onChange={e => {
                            setStoreSearch(e.target.value);
                            onStoreChange({ target: { value: '' } });
                        }}
                        onFocus={() => setStoreDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setStoreDropdownOpen(false), 150)}
                        variant="outlined"
                    />
                    {(storeDropdownOpen || storeSearch.trim() !== '') && filteredStores.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-60 max-w-xl w-full font-medium text-base max-h-60 overflow-y-auto overflow-x-hidden transition-all duration-200">
                            {filteredStores.map((store) => (
                                <div
                                    key={store.id}
                                    onClick={() => {
                                        onStoreChange({ target: { value: store.id } });
                                        setStoreSearch('');
                                        setStoreDropdownOpen(false);
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
                </div>
            </div>

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

            {/* Số tiền đã trả */}
            <div>
                <div className="font-semibold mb-1">Số tiền đã trả</div>
                <TextField
                    size="small"
                    fullWidth
                    type="text"
                    placeholder="Nhập số tiền đã trả"
                    value={isPaidAmountFocused && (paidAmount === 0 || paidAmount === '0') ? '' : paidAmount}
                    onFocus={e => {
                        setIsPaidAmountFocused(true);
                        if (paidAmount === 0 || paidAmount === '0') onPaidAmountChange({ target: { value: '' } });
                    }}
                    onBlur={e => {
                        setIsPaidAmountFocused(false);
                        if (e.target.value === '' || isNaN(Number(e.target.value))) {
                            onPaidAmountChange({ target: { value: '0' } });
                        } else {
                            onPaidAmountChange({ target: { value: e.target.value } });
                        }
                    }}
                    onChange={e => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                            if (val === '' || Number(val) <= Number.MAX_SAFE_INTEGER) {
                                setPaidAmountError('');
                                onPaidAmountChange({ target: { value: val } });
                            } else {
                                setPaidAmountError('');
                                setSnackbar({ open: true, message: 'Không được nhập số quá lớn (tối đa 9,007,199,254,740,991)', severity: 'error' });
                            }
                        } else {
                            setPaidAmountError('');
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
                        '& .MuiFormHelperText-root': {
                            marginLeft: 0,
                            textAlign: 'left',
                            paddingLeft: 0,
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
                    onClick={() => onPaidAmountChange({ target: { value: '0' } })}
                    disabled={paidAmount === 0}
                >
                    Chưa trả
                </Button>
                <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => onPaidAmountChange({ target: { value: totalAmount.toString() } })}
                    disabled={paidAmount === totalAmount}
                >
                    Trả đủ
                </Button>
            </div>

            <div className="flex gap-2 pt-2">
                    <Button 
                        fullWidth 
                        variant="outlined"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50" 
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FaLock />} 
                        onClick={onSaveDraft} 
                        disabled={loading}
                    >
                        Lưu tạm
                    </Button>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        className="!bg-green-600 hover:!bg-green-700 text-white" 
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FaCheck />} 
                        onClick={onComplete} 
                        disabled={loading}
                    >
                        Hoàn thành
                    </Button>
                </div>

            <Button 
                fullWidth 
                variant="outlined" 
                onClick={onCancel}
                className="border-gray-400 text-gray-600 hover:bg-gray-50"
            >
                Hủy
            </Button>
        </div>
        <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
        </>
    );
};

export default SaleSidebar; 