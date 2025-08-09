import React, {useState, useEffect, useRef} from "react";
import {
    Alert,
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    FormLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Popover,
    MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableChartIcon from '@mui/icons-material/TableChart';
import {DateRange} from "react-date-range";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import balanceTransactionService from '../../services/balanceTransactionService';
import {formatCurrency} from "../../utils/formatters";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import {Menu, IconButton, ListItemIcon, ListItemText} from '@mui/material';

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

const getRange = (key) => {
    const today = new Date();
    switch (key) {
        case "today":
            return [{startDate: today, endDate: today, key: 'selection'}];
        case "yesterday": {
            const y = new Date(today);
            y.setDate(today.getDate() - 1);
            return [{startDate: y, endDate: y, key: 'selection'}];
        }
        case "this_week": {
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return [{startDate: start, endDate: end, key: 'selection'}];
        }
        case "last_week": {
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay() - 7);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return [{startDate: start, endDate: end, key: 'selection'}];
        }
        case "this_month": {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return [{startDate: start, endDate: end, key: 'selection'}];
        }
        case "last_month": {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            return [{startDate: start, endDate: end, key: 'selection'}];
        }
        case "this_quarter": {
            const quarter = Math.floor(today.getMonth() / 3);
            const start = new Date(today.getFullYear(), quarter * 3, 1);
            const end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
            return [{startDate: start, endDate: end, key: 'selection'}];
        }
        case "this_year": {
            const start = new Date(today.getFullYear(), 0, 1);
            const end = new Date(today.getFullYear(), 11, 31);
            return [{startDate: start, endDate: end, key: 'selection'}];
        }
        default:
            return [{startDate: today, endDate: today, key: 'selection'}];
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'COMPLETE':
            return {bg: '#e6f4ea', text: '#34a853', label: 'Đã hoàn thành'};
        case 'DRAFT':
            return {bg: '#f3f4f6', text: '#6b7280', label: 'Nháp'};
        case 'CANCEL':
            return {bg: '#fde8e8', text: '#ef4444', label: 'Đã huỷ'};
        default:
            return {bg: '#f3f4f6', text: '#6b7280', label: status};
    }
};

const BalanceTransactionPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [showFilter, setShowFilter] = useState(true);
    const [showFilterBtn, setShowFilterBtn] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [openPopover, setOpenPopover] = useState(false);
    const [selectedMode, setSelectedMode] = useState("preset");
    const [presetLabel, setPresetLabel] = useState("Tháng này");
    const [customLabel, setCustomLabel] = useState("Lựa chọn khác");
    const [customDate, setCustomDate] = useState(getRange("this_month"));
    const [filter, setFilter] = useState({
        status: {
            draft: false,
            complete: false,
            cancel: false,
        },
        customer: '',
        store: '',
    });
    const mainAreaRef = useRef(null);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [actionRow, setActionRow] = useState(null);

    useEffect(() => {
        loadTransactions();
    }, [page, pageSize, search, JSON.stringify(filter), JSON.stringify(customDate)]);

    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                size: pageSize,
                search,
                status: getStatusKeys().join(','),
                customer: filter.customer,
                store: filter.store,
                fromDate: customDate[0]?.startDate?.toISOString(),
                toDate: customDate[0]?.endDate?.toISOString(),
            };
            const data = await balanceTransactionService.listPaged(params);
            let transactions = Array.isArray(data) ? data : (data?.content || []);
            // Chỉ lấy phiếu Cân Bằng kho (note chứa 'Cân bằng kho' hoặc khách hàng là 'Khách lẻ')
            transactions = transactions.filter(row => {
                const note = (row.saleTransactionNote || '').toLowerCase();
                const customer = (row.customerName || '').toLowerCase();
                return note.includes('cân bằng kho') || customer === 'khách lẻ';
            });
            setTransactions(transactions);
            setTotal(data?.totalElements || transactions.length);
        } catch (err) {
            setError('Không thể tải danh sách phiếu cân bằng');
        } finally {
            setLoading(false);
        }
    };

    const getStatusKeys = () => {
        const keys = [];
        if (filter.status.draft) keys.push('DRAFT');
        if (filter.status.complete) keys.push('COMPLETE');
        if (filter.status.cancel) keys.push('CANCEL');
        return keys;
    };

    const handlePresetChange = (key) => {
        setCustomDate(getRange(key));
        setPresetLabel(labelMap[key]);
        setSelectedMode("preset");
        setOpenPopover(false);
        setAnchorEl(null);
    };

    const handleCustomChange = (range) => {
        const start = range.startDate;
        const end = range.endDate;
        setCustomLabel(`${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`);
        setCustomDate([range]);
        setSelectedMode("custom");
    };

    const handleExportAll = () => {
        // TODO: Thêm logic xuất file Excel/PDF nếu có
        setSuccess('Xuất file thành công!');
        setTimeout(() => setSuccess(null), 3000);
    };

    // Table styles
    const tableStyles = {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        minWidth: 900,
        background: '#fff',
        fontFamily: 'Roboto, Arial, sans-serif',
        fontSize: 15,
    };
    const thStyles = {
        background: '#dbeafe',
        fontWeight: 700,
        padding: '8px 10px',
        borderBottom: '1px solid #dbeafe',
        whiteSpace: 'nowrap',
        textAlign: 'left',
        color: '#222',
        fontSize: 15,
        height: 38,
        fontFamily: 'Roboto, Arial, sans-serif',
        position: 'sticky',
        top: 0,
        zIndex: 2,
    };
    const tdStyles = {
        padding: '8px 10px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        whiteSpace: 'nowrap',
        fontSize: 15,
        color: '#222',
        height: 38,
        fontFamily: 'Roboto, Arial, sans-serif',
    };
    const zebra = idx => ({background: idx % 2 === 0 ? '#f8fafc' : '#fff'});

    return (
        <div className="w-full relative">
            {error && (
                <Alert severity="error"
                       className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success"
                       className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
                    {success}
                </Alert>
            )}
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Phiếu Cân Bằng Kho</h2>
                <div className="flex gap-2">
                    <Button variant="outlined" startIcon={<TableChartIcon/>} onClick={handleExportAll}>
                        Xuất file
                    </Button>
                </div>
            </div>
            <div
                className="flex flex-col lg:flex-row gap-3 mb-4"
                ref={mainAreaRef}
                style={{position: 'relative'}}
                onMouseEnter={() => setShowFilterBtn(true)}
                onMouseLeave={() => setShowFilterBtn(false)}
            >
                {/* Nút hiện filter khi đang ẩn */}
                {!showFilter && showFilterBtn && (
                    <button
                        style={{
                            position: 'absolute',
                            left: -16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 20,
                            background: '#fff',
                            border: '2px solid #3b82f6',
                            borderRadius: '50%',
                            padding: 0,
                            width: 36,
                            height: 36,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px #b6d4fe, 2px 0 8px #e5e7eb',
                            fontSize: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563eb',
                            opacity: 1,
                            transition: 'opacity 0.2s, background 0.2s, border 0.2s, transform 0.2s',
                        }}
                        onClick={() => setShowFilter(true)}
                        title='Hiện bộ lọc'
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 6 15 12 9 18"></polyline>
                        </svg>
                    </button>
                )}
                {/* Sidebar filter */}
                <div
                    className={showFilter ? "w-full lg:w-1/5 relative group" : "relative group"}
                    style={{
                        minWidth: showFilter ? 240 : 0,
                        maxWidth: showFilter ? 320 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(.4,2,.6,1)',
                        paddingRight: showFilter ? undefined : 0,
                    }}
                >
                    {showFilter && (
                        <>
                            {/* Nút ẩn filter chỉ hiện khi hover filter sidebar */}
                            <button
                                style={{
                                    position: 'absolute',
                                    right: -16,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 9999,
                                    background: '#fff',
                                    border: '2px solid #3b82f6',
                                    borderRadius: '50%',
                                    padding: 0,
                                    width: 36,
                                    height: 36,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px #b6d4fe, 2px 0 8px #e5e7eb',
                                    fontSize: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#2563eb',
                                    opacity: 0,
                                    transition: 'opacity 0.2s, background 0.2s, border 0.2s, transform 0.2s'
                                }}
                                className="filter-hide-btn"
                                onClick={() => setShowFilter(false)}
                                title='Ẩn bộ lọc'
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <style>{`
                                .group:hover .filter-hide-btn { opacity: 1 !important; }
                                .filter-hide-btn:hover {
                                    background: #e0edff !important;
                                    border-color: #2563eb !important;
                                    color: #1d4ed8 !important;
                                    transform: scale(1.08);
                                    box-shadow: 0 4px 16px #b6d4fe;
                                }
                            `}</style>
                            <div className="bg-white p-4 rounded shadow mb-4">
                                <FormLabel className="mb-2 font-semibold">Lọc theo thời gian</FormLabel>
                                <div className="flex flex-col gap-2">
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={selectedMode === "preset"}
                                                onChange={() => {
                                                    setSelectedMode("preset");
                                                    setOpenPopover(true);
                                                    setAnchorEl(mainAreaRef.current);
                                                }}
                                            />
                                        }
                                        label={
                                            <div
                                                className="flex items-center justify-between w-full cursor-pointer"
                                                onClick={(e) => {
                                                    setSelectedMode("preset");
                                                    setOpenPopover(true);
                                                    setAnchorEl(e.currentTarget);
                                                }}
                                            >
                                                <span>{presetLabel}</span>
                                                <Button size="small">▼</Button>
                                            </div>
                                        }
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={selectedMode === "custom"} onChange={() => {
                                            setSelectedMode("custom");
                                            setAnchorEl(null);
                                        }}/>} label={<div className="flex items-center justify-between w-full">
                                        <span>{customLabel}</span><Button size="small" onClick={() => {
                                        setSelectedMode("custom");
                                        setAnchorEl(null);
                                    }}>📅</Button></div>}/>
                                </div>
                                <Popover open={openPopover} anchorEl={anchorEl} onClose={() => setOpenPopover(false)}
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
                                <div className="flex flex-col gap-2">
                                    <FormControlLabel
                                        control={<Checkbox checked={filter.status.draft}
                                                           onChange={() => setFilter(prev => ({
                                                               ...prev,
                                                               status: {...prev.status, draft: !prev.status.draft}
                                                           }))}/>}
                                        label={<span style={{cursor: 'pointer'}}>Nháp</span>}
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={filter.status.complete}
                                                           onChange={() => setFilter(prev => ({
                                                               ...prev,
                                                               status: {...prev.status, complete: !prev.status.complete}
                                                           }))}/>}
                                        label={<span style={{cursor: 'pointer'}}>Đã hoàn thành</span>}
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={filter.status.cancel}
                                                           onChange={() => setFilter(prev => ({
                                                               ...prev,
                                                               status: {...prev.status, cancel: !prev.status.cancel}
                                                           }))}/>}
                                        label={<span style={{cursor: 'pointer'}}>Đã huỷ</span>}
                                    />
                                </div>
                            </div>
                            <Accordion className="bg-white rounded shadow mb-4 w-full">
                                <AccordionSummary expandIcon={<ExpandMoreIcon/>}><span className="font-semibold">Khách hàng</span></AccordionSummary>
                                <AccordionDetails><TextField fullWidth size="small" placeholder="Tìm khách hàng"
                                                             value={filter.customer} onChange={(e) => setFilter({
                                    ...filter,
                                    customer: e.target.value
                                })}/></AccordionDetails>
                            </Accordion>
                            <Accordion className="bg-white rounded shadow mb-4 w-full">
                                <AccordionSummary expandIcon={<ExpandMoreIcon/>}><span className="font-semibold">Cửa hàng</span></AccordionSummary>
                                <AccordionDetails><TextField fullWidth size="small" placeholder="Tìm cửa hàng"
                                                             value={filter.store} onChange={(e) => setFilter({
                                    ...filter,
                                    store: e.target.value
                                })}/></AccordionDetails>
                            </Accordion>
                            {selectedMode === "custom" && (
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
                                        <Button variant="contained" size="small"
                                                onClick={() => setSelectedMode('preset')}>
                                            Áp dụng
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {/* Main content area */}
                <div className={showFilter ? "w-full lg:w-4/5" : "w-full"}
                     style={{transition: 'all 0.4s cubic-bezier(.4,2,.6,1)'}}>
                    <div className="mb-4 w-1/2">
                        <TextField
                            label="Tìm kiếm khách hàng, cửa hàng..."
                            size="small"
                            fullWidth
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                        />
                    </div>
                    <div style={{
                        height: 500,
                        overflowY: 'auto',
                        overflowX: 'auto',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px #eee',
                        padding: 8
                    }}>
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <span>Đang tải...</span>
                            </div>
                        ) : (
                            <table style={{...tableStyles, borderRadius: 12}}>
                                <colgroup>
                                    <col style={{width: 60}}/>
                                    <col style={{width: 160}}/>
                                    <col style={{width: 160}}/>
                                    <col style={{width: 150}}/>
                                    <col style={{width: 170}}/>
                                    <col style={{width: 130}}/>
                                    <col style={{width: 130}}/>
                                    <col style={{width: 120}}/>
                                    <col style={{width: 120}}/>
                                    {/* Hành động */}
                                </colgroup>
                                <thead>
                                <tr>
                                    <th style={{...thStyles, textAlign: 'center'}}>STT</th>
                                    <th style={thStyles}>Mã phiếu</th>
                                    <th style={thStyles}>Khách hàng</th>
                                    <th style={thStyles}>Cửa hàng</th>
                                    <th style={thStyles}>Thời gian</th>
                                    <th style={thStyles}>Tổng tiền</th>
                                    <th style={thStyles}>Đã thanh toán</th>
                                    <th style={thStyles}>Trạng thái</th>
                                    <th style={{...thStyles, textAlign: 'center'}}>Hành động</th>
                                </tr>
                                </thead>
                                <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{textAlign: 'center', ...tdStyles}}>Không có dữ liệu</td>
                                    </tr>
                                ) : transactions.map((row, idx) => (
                                    <tr key={row.id} style={zebra(idx)}>
                                        <td style={{...tdStyles, textAlign: 'center'}}>{page * pageSize + idx + 1}</td>
                                        <td style={tdStyles}>{row.name}</td>
                                        <td style={tdStyles}>{row.customerName}</td>
                                        <td style={tdStyles}>{row.storeName}</td>
                                        <td style={tdStyles}>{row.saleDate ? new Date(row.saleDate).toLocaleString('vi-VN') : ''}</td>
                                        <td style={{
                                            ...tdStyles,
                                            textAlign: 'right',
                                            paddingRight: 16
                                        }}>{formatCurrency(row.totalAmount || 0)}</td>
                                        <td style={{...tdStyles, textAlign: 'right', paddingRight: 16}}>
                                                <span style={{
                                                    color: row.paidAmount < row.totalAmount ? '#ef4444' : (row.paidAmount === row.totalAmount ? '#10b981' : '#f59e42'),
                                                    fontWeight: 600
                                                }}>
                                                    {formatCurrency(row.paidAmount || 0)}
                                                </span>
                                        </td>
                                        <td style={{...tdStyles, textAlign: 'center'}}>
                                                <span style={{
                                                    background: getStatusColor(row.status).bg,
                                                    color: getStatusColor(row.status).text,
                                                    borderRadius: 6,
                                                    padding: '2px 10px',
                                                    fontWeight: 500,
                                                    fontSize: 14,
                                                    display: 'inline-block',
                                                    minWidth: 90,
                                                    textAlign: 'center'
                                                }}>
                                                    {getStatusColor(row.status).label}
                                                </span>
                                        </td>
                                        <td style={{...tdStyles, textAlign: 'center'}}>
                                            <IconButton size="small" onClick={e => {
                                                setActionAnchorEl(e.currentTarget);
                                                setActionRow(row);
                                            }}>
                                                <MoreHorizIcon fontSize="small"/>
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Pagination controls dưới bảng */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: 6,
                        background: '#fafbfc',
                        borderRadius: 12,
                        marginTop: 12,
                        fontFamily: 'Roboto, Arial, sans-serif',
                        fontSize: 14,
                        boxShadow: '0 1px 4px #e5e7eb',
                        border: '1px solid #e5e7eb',
                        width: 'fit-content',
                        minWidth: 420
                    }}>
                        <span style={{marginRight: 6, fontFamily: 'Roboto, Arial, sans-serif'}}>Hiển thị</span>
                        <TextField
                            select
                            size="small"
                            value={pageSize}
                            onChange={e => {
                                setPageSize(Number(e.target.value));
                                setPage(0);
                            }}
                            style={{minWidth: 80, marginRight: 6, fontFamily: 'Roboto, Arial, sans-serif'}}
                        >
                            {[15, 25, 50, 100].map(opt => (
                                <MenuItem key={opt} value={opt} style={{
                                    fontFamily: 'Roboto, Arial, sans-serif',
                                    fontSize: 14
                                }}>{opt} dòng</MenuItem>
                            ))}
                        </TextField>
                        <Button size="small" variant="outlined"
                                style={{minWidth: 28, borderRadius: 8, margin: '0 2px', padding: 0}}
                                disabled={page === 0} onClick={() => setPage(0)}>{'|<'}</Button>
                        <Button size="small" variant="outlined"
                                style={{minWidth: 28, borderRadius: 8, margin: '0 2px', padding: 0}}
                                disabled={page === 0} onClick={() => setPage(page - 1)}>{'<'}</Button>
                        <input
                            type="number"
                            min={1}
                            max={Math.ceil(total / pageSize)}
                            value={page + 1}
                            onChange={e => {
                                let val = Number(e.target.value) - 1;
                                if (val < 0) val = 0;
                                if (val >= Math.ceil(total / pageSize)) val = Math.ceil(total / pageSize) - 1;
                                setPage(val);
                            }}
                            style={{
                                width: 32,
                                textAlign: 'center',
                                margin: '0 4px',
                                height: 28,
                                border: '1px solid #e0e0e0',
                                borderRadius: 8,
                                fontSize: 14,
                                fontFamily: 'Roboto, Arial, sans-serif',
                                boxShadow: '0 1px 2px #e5e7eb',
                                outline: 'none'
                            }}
                        />
                        <Button size="small" variant="outlined"
                                style={{minWidth: 28, borderRadius: 8, margin: '0 2px', padding: 0}}
                                disabled={page + 1 >= Math.ceil(total / pageSize)}
                                onClick={() => setPage(page + 1)}>{'>'}</Button>
                        <Button size="small" variant="outlined"
                                style={{minWidth: 28, borderRadius: 8, margin: '0 2px', padding: 0}}
                                disabled={page + 1 >= Math.ceil(total / pageSize)}
                                onClick={() => setPage(Math.ceil(total / pageSize) - 1)}>{'>|'}</Button>
                        <span style={{marginLeft: 8, fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14}}>
                            {`${page * pageSize + 1} - ${Math.min((page + 1) * pageSize, total)} trong ${total} phiếu cân bằng`}
                        </span>
                    </div>
                </div>
            </div>
            <Menu
                anchorEl={actionAnchorEl}
                open={Boolean(actionAnchorEl)}
                onClose={() => {
                    setActionAnchorEl(null);
                    setActionRow(null);
                }}
                PaperProps={{
                    elevation: 4,
                    sx: {
                        borderRadius: 2,
                        minWidth: 160,
                        p: 0.5,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    },
                }}
                MenuListProps={{
                    sx: {
                        p: 0,
                    },
                }}
            >
                <MenuItem onClick={() => {
                    alert('Xem chi tiết phiếu: ' + (actionRow?.name || ''));
                    setActionAnchorEl(null);
                }}>
                    <ListItemIcon><VisibilityIcon fontSize="small"/></ListItemIcon>
                    <ListItemText primary="Xem chi tiết"/>
                </MenuItem>
                <MenuItem onClick={() => {
                    alert('Xuất chi tiết phiếu: ' + (actionRow?.name || ''));
                    setActionAnchorEl(null);
                }}>
                    <ListItemIcon><TableChartIcon fontSize="small"/></ListItemIcon>
                    <ListItemText primary="Xuất chi tiết"/>
                </MenuItem>
                <MenuItem onClick={() => {
                    alert('Xuất PDF phiếu: ' + (actionRow?.name || ''));
                    setActionAnchorEl(null);
                }}>
                    <ListItemIcon><PrintIcon fontSize="small"/></ListItemIcon>
                    <ListItemText primary="Xuất PDF"/>
                </MenuItem>
                <MenuItem onClick={() => {
                    alert('Xóa phiếu: ' + (actionRow?.name || ''));
                    setActionAnchorEl(null);
                }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error"/></ListItemIcon>
                    <ListItemText primary="Xóa"/>
                </MenuItem>
            </Menu>
        </div>
    );
};

export default BalanceTransactionPage; 