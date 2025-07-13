import React from 'react';
import {
    Select,
    MenuItem,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    CircularProgress,
} from '@mui/material';
import { FaLock, FaCheck } from 'react-icons/fa';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

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
    return (
        <div className="w-96 bg-white p-4 m-4 rounded-md shadow-none space-y-4 text-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        👤 {currentUser?.fullName || currentUser?.name || currentUser?.username || 'User'}
                    </span>
                </div>
                <span className="text-xs text-gray-500">
                    {new Date().toLocaleString('vi-VN')}
                </span>
            </div>

            <div>
                <div className="font-semibold mb-1">Khách hàng</div>
                <Select
                    size="small"
                    fullWidth
                    displayEmpty
                    value={isValidValue(selectedCustomer, customers) ? selectedCustomer : ''}
                    onChange={onCustomerChange}
                    renderValue={(selected) =>
                        selected && customers.find((c) => String(c.id) === String(selected))
                            ? customers.find((c) => String(c.id) === String(selected)).name || 
                              customers.find((c) => String(c.id) === String(selected)).customerName
                            : 'Chọn khách hàng'
                    }
                >
                    {customers.map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>
                            👤 {customer.name || customer.customerName}
                        </MenuItem>
                    ))}
                </Select>
            </div>

            <div>
                <div className="font-semibold mb-1">Cửa hàng</div>
                <Select
                    size="small"
                    fullWidth
                    displayEmpty
                    value={isValidValue(selectedStore, stores) ? selectedStore : ''}
                    onChange={onStoreChange}
                    renderValue={(selected) =>
                        selected && stores.find((s) => String(s.id) === String(selected))
                            ? stores.find((s) => String(s.id) === String(selected)).name || 
                              stores.find((s) => String(s.id) === String(selected)).storeName
                            : 'Chọn cửa hàng'
                    }
                >
                    {stores.map((store) => (
                        <MenuItem key={store.id} value={store.id}>
                            🏬 {store.name || store.storeName}
                        </MenuItem>
                    ))}
                </Select>
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
                    onChange={onNoteChange}
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
                    onChange={onPaidAmountChange}
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
    );
};

export default SaleSidebar; 