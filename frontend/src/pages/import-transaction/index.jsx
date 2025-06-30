import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
    TextField, Button, Checkbox, FormControlLabel,
    FormControl, FormLabel, Accordion, AccordionSummary,
    AccordionDetails, Popover
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FaPlus, FaFileExport } from "react-icons/fa";
import { DateRange } from "react-date-range";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {
    format, subDays, startOfWeek, endOfWeek,
    startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
    startOfYear, endOfYear
} from "date-fns";
import ClickAwayListener from '@mui/material/ClickAwayListener';

const getRange = (key) => {
    const today = new Date();
    switch (key) {
        case "today": return [{ startDate: today, endDate: today, key: 'selection' }];
        case "yesterday": {
            const y = subDays(today, 1);
            return [{ startDate: y, endDate: y, key: 'selection' }];
        }
        case "this_week": return [{ startDate: startOfWeek(today), endDate: endOfWeek(today), key: 'selection' }];
        case "last_week": {
            const lastWeekStart = startOfWeek(subDays(today, 7));
            const lastWeekEnd = endOfWeek(subDays(today, 7));
            return [{ startDate: lastWeekStart, endDate: lastWeekEnd, key: 'selection' }];
        }
        case "this_month": return [{ startDate: startOfMonth(today), endDate: endOfMonth(today), key: 'selection' }];
        case "last_month": {
            const lastMonth = subDays(startOfMonth(today), 1);
            return [{ startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth), key: 'selection' }];
        }
        case "this_quarter": return [{ startDate: startOfQuarter(today), endDate: endOfQuarter(today), key: 'selection' }];
        case "this_year": return [{ startDate: startOfYear(today), endDate: endOfYear(today), key: 'selection' }];
        default: return [{ startDate: today, endDate: today, key: 'selection' }];
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
            temporary: true,
            imported: true,
            cancelled: false,
        },
        creator: '',
        importer: '',
        search: ''
    });

    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const allTransactions = [
            { id: 1, code: "PN000049", time: "25/06/2025 23:14", supplier: "", amount: 2095886287, status: "Đã nhập hàng" },
            { id: 2, code: "PN000046", time: "25/06/2025 23:06", supplier: "Công ty Hoàng Gia", amount: 23213, status: "Đã nhập hàng" },
            { id: 3, code: "PN000048", time: "25/06/2025 22:47", supplier: "dasdsasdasdasdas", amount: 2093983016, status: "Đã nhập hàng" },
            { id: 4, code: "PN000047", time: "25/06/2025 22:30", supplier: "", amount: 1878632, status: "Đã nhập hàng" },
        ];
        const filtered = allTransactions.filter(t =>
            t.code.toLowerCase().includes(filter.search.toLowerCase()) ||
            t.supplier.toLowerCase().includes(filter.search.toLowerCase())
        );
        setTransactions(filtered);
    }, [filter]);

    const columns = [
        { field: 'code', headerName: 'Mã nhập hàng', flex: 1 },
        { field: 'time', headerName: 'Thời gian', flex: 1 },
        { field: 'supplier', headerName: 'Nhà cung cấp', flex: 1 },
        {
            field: 'amount', headerName: 'Cần trả NCC', flex: 1,
            renderCell: (params) => params.value.toLocaleString('vi-VN')
        },
        { field: 'status', headerName: 'Trạng thái', flex: 1 },
    ];

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

    return (
        <div className="w-full relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Phiếu nhập hàng</h2>
                <div className="flex gap-2">
                    <Button variant="contained" startIcon={<FaPlus />} className="!bg-green-600 hover:!bg-green-700">Nhập hàng</Button>
                    <Button variant="outlined" startIcon={<FaFileExport />}>Xuất file</Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-5">
                {/* Sidebar Filter */}
                <div className="w-full lg:w-1/5 relative">
                    <div className="bg-white p-4 rounded shadow mb-4">
                        <FormLabel className="mb-2 font-semibold">Lọc theo thời gian</FormLabel>
                        <div className="flex flex-col gap-2">
                            <FormControlLabel control={<Checkbox checked={selectedMode === "preset"} onChange={() => { setSelectedMode("preset"); setShowDatePicker(false); }} />} label={<div className="flex items-center justify-between w-full"><span>{presetLabel}</span><Button size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>▼</Button></div>} />
                            <FormControlLabel control={<Checkbox checked={selectedMode === "custom"} onChange={() => { setSelectedMode("custom"); setAnchorEl(null); setShowDatePicker(true); }} />} label={<div className="flex items-center justify-between w-full"><span>{customLabel}</span><Button size="small" onClick={() => { setSelectedMode("custom"); setAnchorEl(null); setShowDatePicker(!showDatePicker); }}>📅</Button></div>} />
                        </div>
                        <Popover open={openPopover} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
                            <div className="p-4 grid grid-cols-2 gap-2">
                                {Object.entries(labelMap).map(([key, label]) => (
                                    <Button key={key} size="small" variant="outlined" onClick={() => handlePresetChange(key)}>{label}</Button>
                                ))}
                            </div>
                        </Popover>
                    </div>

                    <div className="bg-white p-4 rounded shadow mb-4">
                        <FormLabel className="font-semibold mb-2 block">Trạng thái</FormLabel>
                        <FormControl component="fieldset" className="flex flex-col gap-2">
                            <FormControlLabel control={<Checkbox checked={filter.status.temporary} onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, temporary: !prev.status.temporary } }))} />} label="Phiếu tạm" />
                            <FormControlLabel control={<Checkbox checked={filter.status.imported} onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, imported: !prev.status.imported } }))} />} label="Đã nhập hàng" />
                            <FormControlLabel control={<Checkbox checked={filter.status.cancelled} onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, cancelled: !prev.status.cancelled } }))} />} label="Đã huỷ" />
                        </FormControl>
                    </div>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}><span className="font-semibold">Người tạo</span></AccordionSummary>
                        <AccordionDetails><TextField fullWidth size="small" placeholder="Chọn người tạo" value={filter.creator} onChange={(e) => setFilter({ ...filter, creator: e.target.value })} /></AccordionDetails>
                    </Accordion>

                    <Accordion className="bg-white rounded shadow mb-4 w-full">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}><span className="font-semibold">Người nhập</span></AccordionSummary>
                        <AccordionDetails><TextField fullWidth size="small" placeholder="Chọn người nhập" value={filter.importer} onChange={(e) => setFilter({ ...filter, importer: e.target.value })} /></AccordionDetails>
                    </Accordion>

                    {showDatePicker && selectedMode === "custom" && (
                        <ClickAwayListener onClickAway={() => setShowDatePicker(false)}>
                            <div className="absolute z-50 top-0 left-full ml-4 bg-white p-4 rounded shadow-lg border w-max">
                                <DateRange editableDateInputs={true} onChange={(item) => handleCustomChange(item.selection)} moveRangeOnFirstSelection={false} ranges={customDate} direction="horizontal" />
                                <div className="mt-2 text-right"><Button variant="contained" size="small" onClick={() => setShowDatePicker(false)}>Áp dụng</Button></div>
                            </div>
                        </ClickAwayListener>
                    )}
                </div>

                <div className="w-full lg:w-4/5">
                    <div className="mb-4 w-1/2">
                        <TextField label="Tìm kiếm mã phiếu, nhà cung cấp..." size="small" fullWidth value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
                    </div>
                    <div style={{ height: 500 }} className="bg-white rounded shadow">
                        <DataGrid rows={transactions} columns={columns} pageSize={10} rowsPerPageOptions={[10]} checkboxSelection disableSelectionOnClick />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportTransactionPage;
    