import React from 'react';
import {
    Paper,
    Typography,
    TextField,
    Select,
    MenuItem,
    Divider,
    Box,
    InputAdornment,
    IconButton,
    Tooltip,
    Button,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import CircularProgress from '@mui/material/CircularProgress';
import { FaSearch } from 'react-icons/fa';

const EditSidebar = ({
    currentUser,
    currentTime,
    importCode,
    suppliers,
    setSuppliers,
    selectedSupplier,
    setSelectedSupplier,
    supplierSearch,
    setSupplierSearch,
    supplierDropdownOpen,
    setSupplierDropdownOpen,
    filteredSuppliers,
    stores,
    selectedStore,
    setSelectedStore,
    storeSearch,
    setStoreSearch,
    storeDropdownOpen,
    setStoreDropdownOpen,
    filteredStores,
    note,
    setNote,
    importDate,
    setImportDate,
    totalAmount,
    paidAmount,
    paidAmountInput,
    setPaidAmountInput,
    setPaidAmount,
    highlightSupplier,
    highlightStore,
    hasChanges,
    onSave,
    onBack,
    saving,
}) => {
    const formatCurrency = (value) => {
        const number = Number(value);
        return !isNaN(number) ? number.toLocaleString('vi-VN') + ' VND' : '0 VND';
    };

    return (
        <div className="w-96 bg-white p-4 m-4 rounded-md shadow-none space-y-4 text-sm">
            {/* Header with Back and Save buttons */}
            <div className="flex justify-between items-center">
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                    size="small"
                    sx={{
                        borderColor: '#ddd',
                        color: '#666',
                        fontSize: '0.75rem',
                        '&:hover': {
                            borderColor: '#999',
                            backgroundColor: '#f5f5f5'
                        }
                    }}
                >
                    Quay lại
                </Button>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={onSave}
                    disabled={!hasChanges || saving}
                    size="small"
                    sx={{
                        background: hasChanges ? 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' : '#ccc',
                        boxShadow: hasChanges ? '0 3px 15px rgba(25, 118, 210, 0.3)' : 'none',
                        fontSize: '0.75rem',
                        '&:hover': {
                            background: hasChanges ? 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)' : '#ccc',
                            boxShadow: hasChanges ? '0 5px 20px rgba(25, 118, 210, 0.4)' : 'none',
                            transform: hasChanges ? 'translateY(-1px)' : 'none'
                        },
                        fontWeight: 600,
                        borderRadius: 2,
                        transition: 'all 0.2s ease'
                    }}
                >
                    {saving ? <CircularProgress size={16} color="inherit" /> : 'Lưu thay đổi'}
                </Button>
            </div>

            {/* User and Time Info */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">👤 {currentUser?.name || currentUser?.username || 'Đang tải...'}</span>
                </div>
                <span className="text-xs text-gray-500">{currentTime.toLocaleString('vi-VN')}</span>
            </div>

            {/* Import Code */}
            <div className="mb-2">
                <div className="text-xs text-gray-600 font-medium">Mã phiếu nhập</div>
                <div className="font-bold text-lg tracking-widest text-blue-900">{importCode}</div>
            </div>

            {/* Import Date */}
            <div className="mb-4">
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">
                    Ngày nhập hàng
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                    <DatePicker
                        format="dd/MM/yyyy"
                        value={importDate}
                        onChange={(date) => setImportDate(date)}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: 'small',
                                variant: 'outlined',
                            }
                        }}
                    />
                </LocalizationProvider>
            </div>

            {/* Supplier */}
            <div className="mb-4">
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">
                    Nhà cung cấp
                </Typography>
                <div className="relative">
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Tìm nhà cung cấp..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        onFocus={() => setSupplierDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setSupplierDropdownOpen(false), 150)}
                        variant="outlined"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Thêm nhà cung cấp mới">
                                        <IconButton size="small">
                                            <AddIcon />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                        sx={highlightSupplier ? { 
                            boxShadow: '0 0 0 3px #ffbdbd', 
                            '& .MuiOutlinedInput-root': { backgroundColor: '#fff6f6' }
                        } : {}}
                    />
                    {supplierDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredSuppliers.map((supplier) => (
                                <div
                                    key={supplier.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                        setSelectedSupplier(supplier.id);
                                        setSupplierSearch(supplier.name);
                                        setSupplierDropdownOpen(false);
                                    }}
                                >
                                    {supplier.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Store */}
            <div className="mb-4">
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">
                    Cửa hàng
                </Typography>
                <div className="relative">
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Tìm cửa hàng..."
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                        onFocus={() => setStoreDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setStoreDropdownOpen(false), 150)}
                        variant="outlined"
                        sx={highlightStore ? { 
                            boxShadow: '0 0 0 3px #ffbdbd', 
                            '& .MuiOutlinedInput-root': { backgroundColor: '#fff6f6' }
                        } : {}}
                    />
                    {storeDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredStores.map((store) => (
                                <div
                                    key={store.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                        setSelectedStore(store.id);
                                        setStoreSearch(store.name);
                                        setStoreDropdownOpen(false);
                                    }}
                                >
                                    {store.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">
                    Ghi chú
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú"
                    variant="outlined"
                    size="small"
                />
            </div>

            {/* Summary */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <Typography variant="subtitle2" className="font-semibold text-gray-700">
                        Tổng tiền hàng
                    </Typography>
                    <Typography variant="h6" className="font-bold text-gray-800">
                        {formatCurrency(totalAmount)}
                    </Typography>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                    <Typography variant="subtitle2" className="font-semibold text-gray-700">
                        Số tiền đã trả
                    </Typography>
                    <TextField
                        size="small"
                        value={paidAmountInput}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '');
                            setPaidAmountInput(value);
                            setPaidAmount(Number(value) || 0);
                        }}
                        InputProps={{
                            endAdornment: <span className="text-gray-500">VND</span>,
                        }}
                        sx={{ width: '120px' }}
                    />
                </div>
                
                <Divider className="my-2" />
                
                <div className="flex justify-between items-center">
                    <Typography variant="subtitle2" className="font-semibold text-gray-700">
                        Còn lại
                    </Typography>
                    <Typography variant="h6" className="font-bold text-green-600">
                        {formatCurrency(totalAmount - paidAmount)}
                    </Typography>
                </div>
            </div>

            {/* Payment Status */}
            <div className="mb-4">
                <div className="flex gap-2">
                    <Button
                        variant={paidAmount >= totalAmount ? "contained" : "outlined"}
                        size="small"
                        fullWidth
                        sx={{
                            backgroundColor: paidAmount >= totalAmount ? '#4caf50' : 'transparent',
                            color: paidAmount >= totalAmount ? 'white' : '#666',
                            '&:hover': {
                                backgroundColor: paidAmount >= totalAmount ? '#388e3c' : '#f5f5f5'
                            }
                        }}
                    >
                        TRẢ ĐỦ
                    </Button>
                    <Button
                        variant={paidAmount < totalAmount ? "contained" : "outlined"}
                        size="small"
                        fullWidth
                        sx={{
                            backgroundColor: paidAmount < totalAmount ? '#ff9800' : 'transparent',
                            color: paidAmount < totalAmount ? 'white' : '#666',
                            '&:hover': {
                                backgroundColor: paidAmount < totalAmount ? '#f57c00' : '#f5f5f5'
                            }
                        }}
                    >
                        CHƯA TRẢ
                    </Button>
                </div>
            </div>

            {/* Status Indicator */}
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <Typography variant="body2" className={hasChanges ? 'text-yellow-800' : 'text-green-800'}>
                        {hasChanges ? 'Có thay đổi chưa lưu' : 'Đã lưu'}
                    </Typography>
                </div>
            </div>
        </div>
    );
};

export default EditSidebar; 