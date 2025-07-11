import React, {useEffect, useState} from "react";
import {DataGrid} from "@mui/x-data-grid";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Button,
    Checkbox,
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
import importTransactionService from "../../services/importTransactionService";
import ReplyIcon from '@mui/icons-material/Reply';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
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
const ImportTransactionPage = () => {
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
            waiting: false,
            complete: false,
            cancel: false,
        },
        creator: '',
        importer: '',
        search: ''
    });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedDetails, setSelectedDetails] = useState([]);

    // Thêm state cho thông báo lỗi khi huỷ
    const [cancelError, setCancelError] = useState(null);
    // Thêm state cho thông báo lỗi khi mở phiếu
    const [openError, setOpenError] = useState(null);

    // Load transactions from API
    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await importTransactionService.listAll();
            setTransactions(data);
        } catch (err) {
            console.error('Error loading transactions:', err);
            setError('Không thể tải danh sách phiếu nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    // Thay thế đoạn filter transactions:
    const getStatusKeys = () => {
        const keys = [];
        if (filter.status.draft) keys.push('DRAFT');
        if (filter.status.waiting) keys.push('WAITING_FOR_APPROVE');
        if (filter.status.complete) keys.push('COMPLETE');
        if (filter.status.cancel) keys.push('CANCEL');
        return keys;
    };

    const filteredTransactions = transactions.filter(t => {
        // Lọc theo trạng thái
        const statusKeys = getStatusKeys();
        // Nếu không chọn gì thì không lọc theo trạng thái
        if (statusKeys.length > 0 && !statusKeys.includes(t.status)) return false;

        // Lọc theo thời gian
        if (customDate && customDate[0]) {
            const start = customDate[0].startDate;
            const end = customDate[0].endDate;
            const importDate = t.importDate ? new Date(t.importDate) : null;
            if (importDate) {
                if (importDate < new Date(start.setHours(0, 0, 0, 0)) || importDate > new Date(end.setHours(23, 59, 59, 999))) {
                    return false;
                }
            }
        }

        // Lọc theo search
        if (
            filter.search &&
            !(
                (t.name && t.name.toLowerCase().includes(filter.search.toLowerCase())) ||
                (t.supplierName && t.supplierName.toLowerCase().includes(filter.search.toLowerCase()))
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
        try {
            const transaction = await importTransactionService.getWithDetails(row.id);
            setSelectedTransaction(transaction); // Lưu toàn bộ object, bao gồm status
            setSelectedDetails(transaction.details);
            setOpenDetailDialog(true);
        } catch (error) {
            console.error("Lỗi khi tải chi tiết phiếu nhập:", error);
        }
    };

    // Hàm xử lý huỷ phiếu
    const handleCancelTransaction = async () => {
        if (!selectedTransaction?.id) return;
        setCancelError(null);
        try {
            await importTransactionService.updateStatus(selectedTransaction.id);
            setOpenDetailDialog(false);
            loadTransactions();
        } catch (err) {
            setCancelError('Không thể huỷ phiếu. Vui lòng thử lại!');
        }
    };

    // Hàm xử lý mở phiếu
    const handleOpenTransaction = async () => {
        if (!selectedTransaction?.id) return;
        setOpenError(null);
        try {
            await importTransactionService.openTransaction(selectedTransaction.id);
            setOpenDetailDialog(false);
            loadTransactions();
        } catch (err) {
            setOpenError('Không thể mở phiếu. Vui lòng thử lại!');
        }
    };


    const columns = [
        {field: 'id', headerName: 'ID', flex: 0.5},
        {field: 'name', headerName: 'Tên phiếu nhập', flex: 1},
        {
            field: 'importDate',
            headerName: 'Thời gian',
            flex: 1,
            renderCell: (params) => {
                if (params.value) {
                    return new Date(params.value).toLocaleString('vi-VN');
                }
                return '';
            }
        },
        {field: 'supplierName', headerName: 'Nhà cung cấp', flex: 1},
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
            field: 'status',
            headerName: 'Trạng thái',
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    'WAITING_FOR_APPROVE': {label: 'Chờ xử lý', color: '#f59e0b'},       // Vàng
                    'COMPLETE': {label: 'Đã hoàn thành', color: '#10b981'}, // Xanh lá
                    'CANCEL': {label: 'Đã hủy', color: '#ef4444'},   // Đỏ
                    'DRAFT': {label: 'Nháp', color: '#6b7280'}   // Đỏ
                };
                const status = statusMap[params.value] || {label: params.value, color: '#6b7280'};

                return (
                    <span
                        style={{
                            backgroundColor: status.color,
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                {status.label}
            </span>
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
                        event.stopPropagation(); // ngăn click lan ra ngoài
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
                <h2 className="text-xl font-semibold">Phiếu nhập hàng</h2>
                <div className="flex gap-2">
                    <Link to="/import/new">
                        <Button variant="contained" startIcon={<FaPlus/>} className="!bg-green-600 hover:!bg-green-700">
                            Nhập hàng
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
                            <FormControlLabel control={<Checkbox checked={selectedMode === "custom"} onChange={() => {
                                setSelectedMode("custom");
                                setAnchorEl(null);
                                setShowDatePicker(true);
                            }}/>} label={<div className="flex items-center justify-between w-full">
                                <span>{customLabel}</span><Button size="small" onClick={() => {
                                setSelectedMode("custom");
                                setAnchorEl(null);
                                setShowDatePicker(!showDatePicker);
                            }}>📅</Button></div>}/>
                        </div>
                        <Popover open={openPopover} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
                                 anchorOrigin={{vertical: "bottom", horizontal: "left"}}
                                 transformOrigin={{vertical: "top", horizontal: "left"}}>
                            <div className="p-4 grid grid-cols-2 gap-2">
                                {Object.entries(labelMap).map(([key, label]) => (
                                    <Button key={key} size="small" variant="outlined"
                                            onClick={() => handlePresetChange(key)}>{label}</Button>
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
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({
                                            ...prev,
                                            status: {...prev.status, draft: !prev.status.draft}
                                        }))}
                                        style={{cursor: 'pointer'}}
                                    >
                                        Nháp
                                    </span>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.waiting}
                                        onChange={() => setFilter(prev => ({
                                            ...prev,
                                            status: {...prev.status, waiting: !prev.status.waiting}
                                        }))}
                                    />
                                }
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({
                                            ...prev,
                                            status: {...prev.status, waiting: !prev.status.waiting}
                                        }))}
                                        style={{cursor: 'pointer'}}
                                    >
                                        Chờ xử lý
                                    </span>
                                }
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
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({
                                            ...prev,
                                            status: {...prev.status, complete: !prev.status.complete}
                                        }))}
                                        style={{cursor: 'pointer'}}
                                    >
                                        Đã hoàn thành
                                    </span>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filter.status.cancel}
                                        onChange={() => setFilter(prev => ({
                                            ...prev,
                                            status: {...prev.status, cancel: !prev.status.cancel}
                                        }))}
                                    />
                                }
                                label={
                                    <span
                                        onClick={() => setFilter(prev => ({
                                            ...prev,
                                            status: {...prev.status, cancel: !prev.status.cancel}
                                        }))}
                                        style={{cursor: 'pointer'}}
                                    >
                                        Đã huỷ
                                    </span>
                                }
                            />
                        </FormControl>
                    </div>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}><span
                            className="font-semibold">Người tạo</span></AccordionSummary>
                        <AccordionDetails><TextField fullWidth size="small" placeholder="Chọn người tạo"
                                                     value={filter.creator}
                                                     onChange={(e) => setFilter({...filter, creator: e.target.value})}/></AccordionDetails>
                    </Accordion>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}><span
                            className="font-semibold">Người nhập</span></AccordionSummary>
                        <AccordionDetails><TextField fullWidth size="small" placeholder="Chọn người nhập"
                                                     value={filter.importer} onChange={(e) => setFilter({
                            ...filter,
                            importer: e.target.value
                        })}/></AccordionDetails>
                    </Accordion>

                    {showDatePicker && selectedMode === "custom" && (
                        <ClickAwayListener onClickAway={() => setShowDatePicker(false)}>
                            <div
                                className="absolute z-50 top-0 left-full ml-4 bg-white p-4 rounded shadow-lg border w-max">
                                <DateRange editableDateInputs={true}
                                           onChange={(item) => handleCustomChange(item.selection)}
                                           moveRangeOnFirstSelection={false} ranges={customDate}
                                           direction="horizontal"/>
                                <div className="mt-2 text-right"><Button variant="contained" size="small"
                                                                         onClick={() => setShowDatePicker(false)}>Áp
                                    dụng</Button></div>
                            </div>
                        </ClickAwayListener>
                    )}
                </div>

                <div className="w-full lg:w-4/5">
                    <div className="mb-4 w-1/2">
                        <TextField label="Tìm kiếm tên phiếu, nhà cung cấp..." size="small" fullWidth
                                   value={filter.search}
                                   onChange={(e) => setFilter({...filter, search: e.target.value})}/>
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

            {/* Chi tiết phiếu nhập */}
            <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Chi tiết phiếu nhập: {selectedTransaction?.name}</DialogTitle>
                <DialogContent>
                    {selectedDetails.length > 0 ? (
                        <>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Sản phẩm</TableCell>
                                        <TableCell>SL nhập</TableCell>
                                        <TableCell>SL còn</TableCell>
                                        <TableCell>Giá nhập</TableCell>
                                        <TableCell>Giá bán</TableCell>
                                        <TableCell>HSD</TableCell>
                                        <TableCell>Khu vực</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedDetails.map((detail, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{detail.productName}</TableCell>
                                            <TableCell>{detail.importQuantity}</TableCell>
                                            <TableCell>{detail.remainQuantity}</TableCell>
                                            <TableCell>{detail.unitImportPrice?.toLocaleString("vi-VN")}₫</TableCell>
                                            <TableCell>{detail.unitSalePrice?.toLocaleString("vi-VN")}₫</TableCell>
                                            <TableCell>{new Date(detail.expireDate).toLocaleDateString("vi-VN")}</TableCell>
                                            <TableCell>{detail.zones_id}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {/* Tổng kết ngoài bảng */}
                            <div style={{width: '100%', marginTop: 16, maxWidth: 250, marginLeft: 'auto'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                                    <span style={{fontWeight: 700}}>Tổng số lượng:</span>
                                    <span style={{
                                        fontWeight: 700,
                                        color: '#1976d2'
                                    }}>{selectedDetails.reduce((sum, d) => sum + (d.importQuantity || 0), 0)}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                                    <span style={{fontWeight: 700}}>Tổng số mặt hàng:</span>
                                    <span style={{fontWeight: 700, color: '#1976d2'}}>{selectedDetails.length}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                                    <span style={{fontWeight: 700}}>Tổng tiền hàng:</span>
                                    <span style={{
                                        fontWeight: 700,
                                        color: '#1976d2'
                                    }}>{selectedDetails.reduce((sum, d) => sum + ((d.unitImportPrice || 0) * (d.importQuantity || 0)), 0).toLocaleString('vi-VN')}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                                    <span style={{fontWeight: 700}}>Tổng cộng:</span>
                                    <span style={{
                                        fontWeight: 700,
                                        color: '#1976d2'
                                    }}>{selectedDetails.reduce((sum, d) => sum + ((d.unitImportPrice || 0) * (d.importQuantity || 0)), 0).toLocaleString('vi-VN')}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={{fontWeight: 700}}>Tiền đã trả NCC:</span>
                                    <span style={{
                                        fontWeight: 700,
                                        color: '#1976d2'
                                    }}>{selectedDetails.reduce((sum, d) => sum + ((d.unitImportPrice || 0) * (d.importQuantity || 0)), 0).toLocaleString('vi-VN')}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p>Không có dữ liệu chi tiết.</p>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedTransaction?.status === 'DRAFT' && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<ReplyIcon/>}
                            onClick={handleOpenTransaction}
                        >
                            Mở phiếu
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        style={{background: '#6b7280', color: '#fff'}}
                        startIcon={<PrintIcon/>}
                        onClick={() => alert('In tem mã')}
                    >
                        In tem mã
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<CloseIcon/>}
                        onClick={handleCancelTransaction}
                    >
                        Huỷ bỏ
                    </Button>
                </DialogActions>
                {cancelError && (
                    <Alert severity="error" className="mt-2">{cancelError}</Alert>
                )}
                {openError && (
                    <Alert severity="error" className="mt-2">{openError}</Alert>
                )}
            </Dialog>

        </div>
    );
};

export default ImportTransactionPage;
