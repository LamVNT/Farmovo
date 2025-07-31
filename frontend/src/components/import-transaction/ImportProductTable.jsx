import React, { useMemo } from 'react';
import {
    TextField,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    InputAdornment,
    IconButton,
    Tooltip,
    Menu,
    FormControlLabel as MuiFormControlLabel,
} from '@mui/material';
import { FaEye } from 'react-icons/fa';
import { DataGrid } from '@mui/x-data-grid';
import { FaRegTrashCan } from "react-icons/fa6";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatters';

const ImportProductTable = ({
    selectedProducts,
    columnVisibility,
    zones,
    anchorEl,
    dataGridKey,
    onQuantityChange,
    onQuantityInputChange,
    onImportPriceChange,
    onSalePriceChange,
    onZoneChange,
    onExpireDateChange,
    onDeleteProduct,
    onToggleColumn,
    onSetAnchorEl,
}) => {
    // Memoized columns for DataGrid
    const columns = useMemo(() => [
        columnVisibility['STT'] && { field: 'id', headerName: 'STT', width: 80 },
        columnVisibility['Tên hàng'] && { field: 'productName', headerName: 'Tên hàng', flex: 1 },
        columnVisibility['ĐVT'] && { field: 'unit', headerName: 'ĐVT', width: 80, valueGetter: () => 'quả' },
        columnVisibility['Số lượng'] && {
            field: 'quantity',
            headerName: 'Số lượng',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full gap-1">
                    <button 
                        onClick={() => onQuantityChange(params.row.id, -1)} 
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                    >
                        –
                    </button>
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.quantity || 1}
                        onChange={(e) => onQuantityInputChange(params.row.id, Number(e.target.value) || 1)}
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
                        onClick={() => onQuantityChange(params.row.id, 1)} 
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                    >
                        +
                    </button>
                </div>
            )
        },
        columnVisibility['Đơn giá'] && {
            field: 'unitImportPrice',
            headerName: 'Đơn giá',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.unitImportPrice || 0}
                        onChange={(e) => onImportPriceChange(params.row.id, Number(e.target.value) || 0)}
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
            field: 'unitSalePrice',
            headerName: 'Giá bán',
            width: 150,
            renderCell: (params) => (
                <div className="flex items-center justify-center h-full">
                    <TextField
                        size="small"
                        type="number"
                        variant="standard"
                        value={params.row.unitSalePrice || 0}
                        onChange={(e) => onSalePriceChange(params.row.id, Number(e.target.value) || 0)}
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
        columnVisibility['Zone'] && {
            field: 'zones_id',
            headerName: 'Khu vực',
            width: 150,
            renderCell: (params) => (
                <Select
                    size="small"
                    value={params.row.zones_id || ''}
                    onChange={(e) => onZoneChange(params.row.id, e.target.value)}
                    variant="standard"
                    sx={{
                        width: '120px',
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
                    {console.log('zones in ImportProductTable:', zones)}
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
                            onChange={(date) => onExpireDateChange(params.row.id, date)}
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
        columnVisibility['Thành tiền'] && {
            field: 'total',
            headerName: 'Thành tiền',
            width: 150,
            valueGetter: (params) => {
                const row = params?.row ?? {};
                const price = parseFloat(row.unitImportPrice) || 0;
                const quantity = parseInt(row.quantity) || 0;
                return price * quantity;
            },
            valueFormatter: (params) => formatCurrency(params.value || 0),
            renderCell: (params) => {
                const price = parseFloat(params.row.unitImportPrice) || 0;
                const quantity = parseInt(params.row.quantity) || 0;
                const total = price * quantity;
                return (
                    <div className="text-right w-full">
                        {formatCurrency(total)}
                    </div>
                );
            },
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Tooltip title="Xóa">
                    <IconButton size="small" onClick={() => onDeleteProduct(params.row.id)}>
                        <FaRegTrashCan />
                    </IconButton>
                </Tooltip>
            ),
        },
    ].filter(Boolean), [columnVisibility, onQuantityChange, onQuantityInputChange, onImportPriceChange, onSalePriceChange, onZoneChange, onExpireDateChange, onDeleteProduct, zones]);

    return (
        <div>
            <div className="ml-auto">
                <Tooltip title="Ẩn/hiện cột hiển thị">
                    <IconButton onClick={(e) => onSetAnchorEl(e.currentTarget)}>
                        <FaEye />
                    </IconButton>
                </Tooltip>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => onSetAnchorEl(null)}>
                    {Object.entries(columnVisibility).map(([col, visible]) => (
                        <MenuItem key={col} dense>
                            <MuiFormControlLabel 
                                control={<Checkbox checked={visible} onChange={() => onToggleColumn(col)} />} 
                                label={col} 
                            />
                        </MenuItem>
                    ))}
                </Menu>
            </div>

            <div style={{ height: 400, width: '100%' }}>
                <DataGrid
                    key={dataGridKey}
                    rows={selectedProducts}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    disableSelectionOnClick
                    getRowId={(row) => row.id}
                />
            </div>
        </div>
    );
};

export default ImportProductTable; 