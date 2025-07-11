import React, {useEffect, useState} from "react";
import {DataGrid} from "@mui/x-data-grid";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    Popover,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {FaFileExport, FaPlus} from "react-icons/fa";
import {DateRange} from "react-date-range";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {
    endOfMonth,
    endOfQuarter,
    endOfWeek,
    endOfYear,
    format,
    startOfMonth,
    startOfQuarter,
    startOfWeek,
    startOfYear,
    subDays
} from "date-fns";
import ClickAwayListener from '@mui/material/ClickAwayListener';
import {Link} from "react-router-dom";
import saleTransactionService from "../../services/saleTransactionService";
import DialogActions from '@mui/material/DialogActions';

const getRange = (key) => {
    const today = new Date();
    switch (key) {
        case "today":
            return [{startDate: today, endDate: today, key: 'selection'}];
        case "yesterday": {
            const y = subDays(today, 1);
            return [{startDate: y, endDate: y, key: 'selection'}];
        }
        case "this_week":
            return [{startDate: startOfWeek(today), endDate: endOfWeek(today), key: 'selection'}];
        case "last_week": {
            const lastWeekStart = startOfWeek(subDays(today, 7));
            const lastWeekEnd = endOfWeek(subDays(today, 7));
            return [{startDate: lastWeekStart, endDate: lastWeekEnd, key: 'selection'}];
        }
        case "this_month":
            return [{startDate: startOfMonth(today), endDate: endOfMonth(today), key: 'selection'}];
        case "last_month": {
            const lastMonth = subDays(startOfMonth(today), 1);
            return [{startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth), key: 'selection'}];
        }
        case "this_quarter":
            return [{startDate: startOfQuarter(today), endDate: endOfQuarter(today), key: 'selection'}];
        case "this_year":
            return [{startDate: startOfYear(today), endDate: endOfYear(today), key: 'selection'}];
        default:
            return [{startDate: today, endDate: today, key: 'selection'}];
    }
};

const labelMap = {
    today: "Hôm nay",
    yesterday: "Hôm qua",
    this_week: "Tuần này",
    last_week: "Tuần trước",
    this_month: "Tháng này",
    last_month: "Tháng trước",
    this_quarter: "Quý này",
    this_year: "Năm nay"
};

const SaleTransactionPage = () => {
    const [presetLabel, setPresetLabel] = useState("Tháng này");
    const [customLabel, setCustomLabel] = useState("Lựa chọn khác");
    const [customDate, setCustomDate] = useState(getRange("this_month"));
    const [selectedMode, setSelectedMode] = useState("preset");
    const [anchorEl, setAnchorEl] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const openPopover = Boolean(anchorEl);

    const [filter, setFilter] = useState({
        status: {
            draft: false,
            complete: false,
        },
        customer: '',
        store: '',
        search: ''
    });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await saleTransactionService.listAll();
            setTransactions(data);
        } catch (err) {
            setError('Không thể tải danh sách phiếu bán hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const getStatusKeys = () => {
        const keys = [];
        if (filter.status.draft) keys.push('DRAFT');
        if (filter.status.complete) keys.push('COMPLETE');
        return keys;
    };

    const filteredTransactions = transactions.filter(t => {
        const statusKeys = getStatusKeys();
        if (statusKeys.length > 0 && !statusKeys.includes(t.status)) return false;

        if (customDate && customDate[0]) {
            const start = customDate[0].startDate;
            const end = customDate[0].endDate;
            const saleDate = t.saleDate ? new Date(t.saleDate) : null;
            if (saleDate) {
                if (saleDate < new Date(start.setHours(0, 0, 0, 0)) || saleDate > new Date(end.setHours(23, 59, 59, 999))) {
                    return false;
                }
            }
        }

        if (
            filter.search &&
            !(
                (t.customerName && t.customerName.toLowerCase().includes(filter.search.toLowerCase())) ||
                (t.storeName && t.storeName.toLowerCase().includes(filter.search.toLowerCase()))
            )
        ) {
            return false;
        }

        return true;
    });

    const handlePresetChange = (key) => {
        setCustomDate(getRange(key));
        setPresetLabel(labelMap[key]);
        setSelectedMode("preset");
        setShowDatePicker(false);
        setAnchorEl(null);
    };

    const handleCustomChange = (range) => {
        const start = format(range.startDate, "dd/MM/yyyy");
        const end = format(range.endDate, "dd/MM/yyyy");
        setCustomLabel(`${start} - ${end}`);
        setCustomDate([range]);
        setSelectedMode("custom");
    };

    const handleViewDetail = async (row) => {
        setSelectedTransaction(row);
        setOpenDetailDialog(true);
    };

    const columns = [
        {field: 'id', headerName: 'ID', flex: 0.5},
        {field: 'customerName', headerName: 'Khách hàng', flex: 1},
        {field: 'storeName', headerName: 'Cửa hàng', flex: 1},
        {
            field: 'saleDate',
            headerName: 'Thời gian',
            flex: 1,
            renderCell: (params) => {
                if (params.value) {
                    return new Date(params.value).toLocaleString('vi-VN');
                }
                return '';
            }
        },
        {
            field: 'totalAmount',
            headerName: 'Tổng tiền',
            flex: 1,
            renderCell: (params) => {
                if (params.value) {
                    return params.value.toLocaleString('vi-VN') + ' VNĐ';
                }
                return '0 VNĐ';
            }
        },
        {
            field: 'paidAmount',
            headerName: 'Đã thanh toán',
            flex: 1,
            renderCell: (params) => {
                if (params.value) {
                    return params.value.toLocaleString('vi-VN') + ' VNĐ';
                }
                return '0 VNĐ';
            }
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    'COMPLETE': {label: 'Đã hoàn thành', color: '#10b981'},
                    'DRAFT': {label: 'Nháp', color: '#6b7280'}
                };
                const status = statusMap[params.value] || {label: params.value, color: '#6b7280'};
                return (
                    <Chip
                        label={status.label}
                        style={{
                            backgroundColor: status.color,
                            color: '#fff',
                            fontWeight: 600
                        }}
                        size="small"
                    />
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 130,
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleViewDetail(params.row);
                    }}
                >
                    Chi tiết
                </Button>
            )
        }
    ];

    return (
        <div className="w-full relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Phiếu bán hàng</h2>
                <div className="flex gap-2">
                    <Link to="/sale/new">
                        <Button variant="contained" startIcon={<FaPlus/>} className="!bg-green-600 hover:!bg-green-700">
                            Bán hàng
                        </Button>
                    </Link>
                    <Button variant="outlined" startIcon={<FaFileExport/>}>Xuất file</Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-5">
                <div className="w-full lg:w-1/5 relative">
                    <div className="bg-white p-4 rounded shadow mb-4">
                        <FormLabel className="mb-2 font-semibold">Lọc theo thời gian</FormLabel>
                        <div className="flex flex-col gap-2">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedMode === "preset"}
                                        onChange={() => {
                                            setSelectedMode("preset");
                                            setShowDatePicker(false);
                                            setAnchorEl(null);
                                        }}
                                    />
                                }
                                label={
                                    <div
                                        className="flex items-center justify-between w-full cursor-pointer"
                                        onClick={(e) => {
                                            setSelectedMode("preset");
                                            setShowDatePicker(false);
                                            setAnchorEl(e.currentTarget);
                                        }}
                                    >
                                        <span>{presetLabel}</span>
                                        <Button size="small">▼</Button>
                                    </div>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedMode === "custom"}
                                        onChange={() => {
                                            setSelectedMode("custom");
                                            setAnchorEl(null);
                                            setShowDatePicker(true);
                                        }}
                                    />
                                }
                                label={
                                    <div className="flex items-center justify-between w-full">
                                        <span>{customLabel}</span>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setSelectedMode("custom");
                                                setAnchorEl(null);
                                                setShowDatePicker(!showDatePicker);
                                            }}
                                        >
                                            📅
                                        </Button>
                                    </div>
                                }
                            />
                        </div>
                        <Popover
                            open={openPopover}
                            anchorEl={anchorEl}
                            onClose={() => setAnchorEl(null)}
                            anchorOrigin={{vertical: "bottom", horizontal: "left"}}
                            transformOrigin={{vertical: "top", horizontal: "left"}}
                        >
                            <div className="p-4 grid grid-cols-2 gap-2">
                                {Object.entries(labelMap).map(([key, label]) => (
                                    <Button key={key} size="small" variant="outlined"
                                            onClick={() => handlePresetChange(key)}>
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        </Popover>
                    </div>

                    <div className="bg-white p-4 rounded shadow mb-4">
                        <FormLabel className="font-semibold mb-2 block">Trạng thái</FormLabel>
                        <FormControl component="fieldset" className="flex flex-col gap-2">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.draft}
                                        onChange={() => setFilter(prev => ({
                                            ...prev,
                                            status: {...prev.status, draft: !prev.status.draft}
                                        }))}
                                    />
                                }
                                label="Nháp"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.complete}
                                        onChange={() => setFilter(prev => ({
                                            ...prev,
                                            status: {...prev.status, complete: !prev.status.complete}
                                        }))}
                                    />
                                }
                                label="Đã hoàn thành"
                            />
                        </FormControl>
                    </div>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <span className="font-semibold">Khách hàng</span>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Tìm khách hàng"
                                value={filter.customer}
                                onChange={(e) => setFilter({...filter, customer: e.target.value})}
                            />
                        </AccordionDetails>
                    </Accordion>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <span className="font-semibold">Cửa hàng</span>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Tìm cửa hàng"
                                value={filter.store}
                                onChange={(e) => setFilter({...filter, store: e.target.value})}
                            />
                        </AccordionDetails>
                    </Accordion>

                    {showDatePicker && selectedMode === "custom" && (
                        <ClickAwayListener onClickAway={() => setShowDatePicker(false)}>
                            <div
                                className="absolute z-50 top-0 left-full ml-4 bg-white p-4 rounded shadow-lg border w-max">
                                <DateRange
                                    editableDateInputs={true}
                                    onChange={(item) => handleCustomChange(item.selection)}
                                    moveRangeOnFirstSelection={false}
                                    ranges={customDate}
                                    direction="horizontal"
                                />
                                <div className="mt-2 text-right">
                                    <Button variant="contained" size="small" onClick={() => setShowDatePicker(false)}>
                                        Áp dụng
                                    </Button>
                                </div>
                            </div>
                        </ClickAwayListener>
                    )}
                </div>

                <div className="w-full lg:w-4/5">
                    <div className="mb-4 w-1/2">
                        <TextField
                            label="Tìm kiếm khách hàng, cửa hàng..."
                            size="small"
                            fullWidth
                            value={filter.search}
                            onChange={(e) => setFilter({...filter, search: e.target.value})}
                        />
                    </div>

                    {error && (
                        <Alert severity="error" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    <div style={{height: 500}} className="bg-white rounded shadow">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <CircularProgress/>
                            </div>
                        ) : (
                            <DataGrid
                                rows={filteredTransactions}
                                columns={columns}
                                pageSize={10}
                                rowsPerPageOptions={[10]}
                                checkboxSelection
                                disableSelectionOnClick
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Chi tiết phiếu bán hàng */}
            <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Chi tiết phiếu bán hàng: {selectedTransaction?.id}</DialogTitle>
                <DialogContent>
                    {selectedTransaction ? (
                        <div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <strong>Khách hàng:</strong> {selectedTransaction.customerName}
                                </div>
                                <div>
                                    <strong>Cửa hàng:</strong> {selectedTransaction.storeName}
                                </div>
                                <div>
                                    <strong>Thời
                                        gian:</strong> {selectedTransaction.saleDate ? new Date(selectedTransaction.saleDate).toLocaleString('vi-VN') : ''}
                                </div>
                                <div>
                                    <strong>Trạng thái:</strong>
                                    <Chip
                                        label={selectedTransaction.status === 'COMPLETE' ? 'Đã hoàn thành' : 'Nháp'}
                                        style={{
                                            backgroundColor: selectedTransaction.status === 'COMPLETE' ? '#10b981' : '#6b7280',
                                            color: '#fff',
                                            marginLeft: 8
                                        }}
                                        size="small"
                                    />
                                </div>
                            </div>

                            {selectedTransaction.detail && selectedTransaction.detail.length > 0 ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Sản phẩm</TableCell>
                                            <TableCell>Số lượng</TableCell>
                                            <TableCell>Đơn giá</TableCell>
                                            <TableCell>Thành tiền</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedTransaction.detail.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.productName}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>{item.unitSalePrice?.toLocaleString('vi-VN')} VNĐ</TableCell>
                                                <TableCell>{(item.unitSalePrice * item.quantity)?.toLocaleString('vi-VN')} VNĐ</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p>Không có dữ liệu chi tiết.</p>
                            )}

                            <div className="mt-4 text-right">
                                <div className="text-lg font-semibold">
                                    Tổng tiền: {selectedTransaction.totalAmount?.toLocaleString('vi-VN')} VNĐ
                                </div>
                                <div className="text-md">
                                    Đã thanh toán: {selectedTransaction.paidAmount?.toLocaleString('vi-VN')} VNĐ
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>Không có dữ liệu chi tiết.</p>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetailDialog(false)} color="primary">Đóng</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SaleTransactionPage; 