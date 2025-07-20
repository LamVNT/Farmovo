import React from 'react';
import {
    TextField,
    Button,
    Select,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { formatCurrency, isValidValue } from '../../utils/formatters';

const ImportSidebar = ({
    currentUser,
    suppliers,
    selectedSupplier,
    onSupplierChange,
    stores,
    selectedStore,
    onStoreChange,
    nextImportCode,
    note,
    paidAmount,
    totalAmount,
    loading,
    onNoteChange,
    onPaidAmountChange,
    onSaveDraft,
    onComplete,
    onCancel,
    formatCurrency,
    isValidValue,
}) => {
    return (
        <div className="w-96 bg-white p-4 m-4 rounded-md shadow-none space-y-4 text-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        👤 {currentUser?.name || currentUser?.username || 'Đang tải...'}
                    </span>
                </div>
                <span className="text-xs text-gray-500">
                    {new Date().toLocaleString('vi-VN')}
                </span>
            </div>

            <div>
                <div className="font-semibold mb-1">Nhà cung cấp</div>
                <Select
                    size="small"
                    fullWidth
                    displayEmpty
                    value={isValidValue(selectedSupplier, suppliers) ? selectedSupplier : ''}
                    onChange={onSupplierChange}
                    renderValue={(selected) =>
                        selected && suppliers.find((s) => String(s.id) === String(selected))
                            ? suppliers.find((s) => String(s.id) === String(selected)).name
                            : 'Chọn nhà cung cấp'
                    }
                >
                    {suppliers.map((supplier) => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                            🏬 {supplier.name}
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
                            ? stores.find((s) => String(s.id) === String(selected)).name
                            : 'Chọn cửa hàng'
                    }
                >
                    {stores.map((store) => (
                        <MenuItem key={store.id} value={store.id}>
                            🏪 {store.name}
                        </MenuItem>
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
                    value={note}
                    onChange={onNoteChange}
                    variant="standard"
                    fullWidth
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
                <div className="font-semibold mb-1">Đã trả</div>
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

            <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Đã trả:</span>
                    <span className="font-semibold">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Còn lại:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount - paidAmount)}</span>
                </div>
            </div>

            <div className="space-y-2 pt-4">
                <Button
                    variant="contained"
                    fullWidth
                    onClick={onSaveDraft}
                    disabled={loading}
                    className="!bg-gray-600 hover:!bg-gray-700"
                >
                    {loading ? <CircularProgress size={20} /> : 'Lưu nháp'}
                </Button>
                
                <Button
                    variant="contained"
                    fullWidth
                    onClick={onComplete}
                    disabled={loading}
                    className="!bg-green-600 hover:!bg-green-700"
                >
                    {loading ? <CircularProgress size={20} /> : 'Hoàn thành'}
                </Button>
                
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={onCancel}
                    disabled={loading}
                >
                    Hủy bỏ
                </Button>
            </div>
        </div>
    );
};

export default ImportSidebar; 