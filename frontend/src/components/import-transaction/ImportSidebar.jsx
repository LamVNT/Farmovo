import React, { useState } from 'react';
import { TextField, Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';

const ImportSidebar = ({
    currentUser,
    currentTime = new Date(),
    nextImportCode,
    suppliers = [],
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
    return (
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
                        onBlur={() => setTimeout(() => setSupplierDropdownOpen(false), 150)}
                        variant="outlined"
                        error={highlightSupplier}
                        sx={highlightSupplier ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 1, background: '#fff6f6' } : {}}
                    />
                    {(supplierDropdownOpen || supplierSearch.trim() !== '') && filteredSuppliers.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-60 max-w-xl w-full font-medium text-base max-h-60 overflow-y-auto overflow-x-hidden transition-all duration-200">
                            {filteredSuppliers.map((supplier) => (
                                <div
                                    key={supplier.id}
                                    onClick={() => {
                                        setSelectedSupplier(supplier.id);
                                        setSupplierSearch('');
                                        setSupplierDropdownOpen(false);
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
                        onBlur={() => setTimeout(() => setStoreDropdownOpen(false), 150)}
                        variant="outlined"
                        error={highlightStore}
                        sx={highlightStore ? { boxShadow: '0 0 0 3px #ffbdbd', borderRadius: 1, background: '#fff6f6' } : {}}
                    />
                    {(storeDropdownOpen || storeSearch.trim() !== '') && filteredStores.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl min-w-60 max-w-xl w-full font-medium text-base max-h-60 overflow-y-auto overflow-x-hidden transition-all duration-200">
                            {filteredStores.map((store) => (
                                <div
                                    key={store.id}
                                    onClick={() => {
                                        setSelectedStore(store.id);
                                        setStoreSearch('');
                                        setStoreDropdownOpen(false);
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

            <div>
                <div className="font-semibold mb-1">Số tiền đã trả</div>
                <TextField
                    size="small"
                    fullWidth
                    type="number"
                    placeholder="Nhập số tiền đã trả"
                    value={paidAmountInput}
                    onFocus={e => {
                        if (paidAmountInput === '0') setPaidAmountInput('');
                    }}
                    onBlur={e => {
                        if (paidAmountInput === '' || isNaN(Number(paidAmountInput))) {
                            setPaidAmountInput('0');
                            setPaidAmount(0);
                        } else {
                            setPaidAmount(Number(paidAmountInput));
                        }
                    }}
                    onChange={e => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                            setPaidAmountInput(val);
                        }
                    }}
                    InputProps={{
                        endAdornment: <span className="text-gray-500">VND</span>,
                    }}
                    variant="outlined"
                />
            </div>

            {paidAmount > 0 && (
                <div className="flex justify-between items-center">
                    <div className="font-semibold">Còn lại</div>
                    <div className={`text-right w-32 ${totalAmount - paidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(totalAmount - paidAmount).toLocaleString('vi-VN')} VND
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
                <Button fullWidth variant="contained" className="!bg-blue-600 hover:!bg-blue-700 text-white" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockIcon />} onClick={onSaveDraft} disabled={loading}>Lưu tạm</Button>
                <Button fullWidth variant="contained" className="!bg-green-600 hover:!bg-green-700 text-white" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />} onClick={onComplete} disabled={loading}>Hoàn thành</Button>
            </div>
        </div>
    );
};

export default ImportSidebar; 