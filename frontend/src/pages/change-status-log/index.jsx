import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Alert,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Visibility,
  OpenInNew,
  MoreHoriz,
  ExpandMore,
  Search,
  FilterList,
  Clear
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DateRange } from "react-date-range";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {
  format, subDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear
} from "date-fns";
import { vi } from 'date-fns/locale';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import useChangeStatusLog from '../../hooks/useChangeStatusLog';
import ChangeStatusLogDetailDialog from '../../components/ChangeStatusLogDetailDialog';
import SnackbarAlert from '../../components/SnackbarAlert';

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

const ChangeStatusLogPage = () => {
  const navigate = useNavigate();
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Filter states
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
      pending: false,
      approved: false,
      rejected: false,
      completed: false,
      cancelled: false
    },
    modelType: '',
    search: ''
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // UI states
  const [showFilter, setShowFilter] = useState(true);
  const [showFilterBtn, setShowFilterBtn] = useState(false);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionRow, setActionRow] = useState(null);
  const mainAreaRef = useRef(null);

  const {
    logs,
    loading,
    error,
    pagination,
    handlePageChange,
    handleFilterChange,
    handleSizeChange
  } = useChangeStatusLog();

  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleViewSource = (log) => {
    if (log.sourceUrl) {
      // Map backend URL to frontend route
      let frontendUrl = '';
      
      if (log.sourceUrl.startsWith('/import-transaction/')) {
        // Backend: /import-transaction/1 -> Frontend: /import/1?view=detail
        const id = log.sourceUrl.split('/').pop();
        frontendUrl = `/import/${id}?view=detail`;
      } else if (log.sourceUrl.startsWith('/sale-transactions/')) {
        // Backend: /sale-transactions/1 -> Frontend: /sale/1?view=detail
        const id = log.sourceUrl.split('/').pop();
        frontendUrl = `/sale/${id}?view=detail`;
      } else if (log.sourceUrl.startsWith('/stocktakes/')) {
        // Backend: /stocktakes/1 -> Frontend: /stocktake/1?view=detail
        const id = log.sourceUrl.split('/').pop();
        frontendUrl = `/stocktake/${id}?view=detail`;
      } else {
        // Fallback: try to use the URL as is
        frontendUrl = log.sourceUrl;
      }
      
      console.log('Navigating to:', frontendUrl);
      navigate(frontendUrl);
    } else {
      setSnackbar({
        open: true,
        message: 'Không có đường dẫn đến nguồn',
        severity: 'warning'
      });
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedLog(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter handlers
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

  const getStatusKeys = () => {
    const keys = [];
    if (filter.status.draft) keys.push('DRAFT');
    if (filter.status.waiting) keys.push('WAITING_FOR_APPROVE');
    if (filter.status.complete) keys.push('COMPLETE');
    if (filter.status.cancel) keys.push('CANCEL');
    if (filter.status.pending) keys.push('PENDING');
    if (filter.status.approved) keys.push('APPROVED');
    if (filter.status.rejected) keys.push('REJECTED');
    if (filter.status.completed) keys.push('COMPLETED');
    if (filter.status.cancelled) keys.push('CANCELLED');
    return keys;
  };

  // Action menu handlers
  const handleActionClick = (event, row) => {
    setActionAnchorEl(event.currentTarget);
    setActionRow(row);
  };

  const handleActionClose = () => {
    setActionAnchorEl(null);
    setActionRow(null);
  };

  const handleViewDetailMenu = () => {
    handleViewDetail(actionRow);
    handleActionClose();
  };

  const handleViewSourceMenu = () => {
    handleViewSource(actionRow);
    handleActionClose();
  };

  // Status color mapping
  const getStatusColor = (status) => {
    const statusColors = {
      'DRAFT': '#6b7280',           // Xám
      'WAITING_FOR_APPROVE': '#f59e0b', // Vàng
      'COMPLETE': '#10b981',        // Xanh lá
      'CANCEL': '#ef4444',          // Đỏ
      'PENDING': '#f59e0b',         // Vàng
      'APPROVED': '#10b981',        // Xanh lá
      'REJECTED': '#ef4444',        // Đỏ
      'COMPLETED': '#10b981',       // Xanh lá
      'CANCELLED': '#ef4444',       // Đỏ
      'IN_PROGRESS': '#3b82f6'      // Xanh dương
    };
    return statusColors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'DRAFT': 'Nháp',
      'WAITING_FOR_APPROVE': 'Chờ xử lý',
      'COMPLETE': 'Hoàn thành',
      'CANCEL': 'Đã hủy',
      'PENDING': 'Chờ xử lý',
      'APPROVED': 'Đã duyệt',
      'REJECTED': 'Từ chối',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'IN_PROGRESS': 'Đang xử lý'
    };
    return statusLabels[status] || status;
  };

  const getModelTypeLabel = (modelName) => {
    const modelLabels = {
      'SALE_TRANSACTION': 'Bán hàng',
      'IMPORT_TRANSACTION': 'Nhập hàng',
      'STOCKTAKE': 'Kiểm kê',
      'DEBT_NOTE': 'Ghi nợ',
      'CUSTOMER': 'Khách hàng',
      'PRODUCT': 'Sản phẩm'
    };
    return modelLabels[modelName] || modelName;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    return format(new Date(dateTime), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  // Table styles
  const tableStyles = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: 1100,
    background: '#fff',
    fontFamily: 'Roboto, Arial, sans-serif',
    fontSize: 15,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  };

  const thStyles = {
    background: '#dbeafe',
    fontWeight: 700,
    padding: '16px 12px',
    borderBottom: '1px solid #dbeafe',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    color: '#222',
    fontSize: 14,
    height: 48,
    fontFamily: 'Roboto, Arial, sans-serif',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  };

  const tdStyles = {
    padding: '16px 12px',
    borderBottom: '1px solid #f3f4f6',
    background: '#fff',
    whiteSpace: 'nowrap',
    fontSize: 14,
    color: '#374151',
    height: 48,
    fontFamily: 'Roboto, Arial, sans-serif',
    transition: 'all 0.2s ease',
  };

  const zebra = idx => ({ 
    background: idx % 2 === 0 ? '#fafbfc' : '#fff',
    '&:hover': {
      background: '#f0f9ff',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }
  });

  // Effect để xử lý filter và pagination
  useEffect(() => {
    const filterRequest = {
      modelName: filter.modelType || '',
      description: filter.search || '',
      fromDate: customDate && customDate[0] ? customDate[0].startDate.toISOString() : null,
      toDate: customDate && customDate[0] ? customDate[0].endDate.toISOString() : null
    };

    // Thêm status filter nếu có
    const statusKeys = getStatusKeys();
    if (statusKeys.length > 0) {
      filterRequest.previousStatus = statusKeys.join(',');
      filterRequest.nextStatus = statusKeys.join(',');
    }

    // Reset page về 0 khi filter thay đổi
    setPage(0);
    handleFilterChange(filterRequest);
  }, [filter, customDate]);

  useEffect(() => {
    if (page >= 0) {
      handlePageChange(page);
    }
  }, [page]);

  useEffect(() => {
    if (pageSize > 0) {
      setPage(0); // Reset về trang đầu khi thay đổi pageSize
      handleSizeChange(pageSize);
    }
  }, [pageSize]);

  // Khởi tạo dữ liệu ban đầu
  useEffect(() => {
    const initialFilterRequest = {
      modelName: '',
      description: '',
      fromDate: null,
      toDate: null
    };
    handleFilterChange(initialFilterRequest);
  }, []);

  // Filter sidebar styles
  const filterSidebarStyle = {
    minWidth: 240,
    maxWidth: 320,
    transition: 'all 0.2s',
    position: 'relative',
  };

  const filterHideBtnStyle = {
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
    transition: 'opacity 0.2s, background 0.2s, border 0.2s, transform 0.2s',
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
                 {/* Header */}
         <Box sx={{ mb: 3 }}>
           <Typography variant="h4" component="h1" gutterBottom>
             Lịch sử thay đổi trạng thái
           </Typography>
           <Typography variant="body1" color="textSecondary">
             Theo dõi và quản lý lịch sử thay đổi trạng thái của các đối tượng trong hệ thống
           </Typography>
         </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <div
          className="flex flex-col lg:flex-row gap-4 mb-5"
          ref={mainAreaRef}
          style={{ position: 'relative' }}
          onMouseEnter={() => setShowFilterBtn(true)}
          onMouseLeave={() => setShowFilterBtn(false)}
        >
          {/* Nút hiện filter khi đang ẩn */}
          {!showFilter && showFilterBtn && (
            <button
              style={{
                position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
                background: '#fff', border: '2px solid #3b82f6', borderRadius: '50%', padding: 0, width: 36, height: 36,
                cursor: 'pointer', boxShadow: '0 2px 8px #b6d4fe, 2px 0 8px #e5e7eb', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb',
                opacity: 1, transition: 'opacity 0.2s, background 0.2s, border 0.2s, transform 0.2s',
              }}
              onClick={() => setShowFilter(true)}
              title='Hiện bộ lọc'
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>
            </button>
          )}

          {/* Filter sidebar */}
          <div
            className={showFilter ? "w-full lg:w-1/5 relative group" : "relative group"}
            style={{
              ...filterSidebarStyle,
              width: showFilter ? undefined : 0,
              minWidth: showFilter ? 240 : 0,
              maxWidth: showFilter ? 320 : 0,
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(.4,2,.6,1)',
              paddingRight: showFilter ? undefined : 0,
            }}
          >
            {showFilter && (
              <>
                <button
                  style={{ ...filterHideBtnStyle, opacity: 0 }}
                  className="filter-hide-btn"
                  onClick={() => setShowFilter(false)}
                  title='Ẩn bộ lọc'
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
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

                                 {/* Time filter */}
                 <div className="bg-white p-4 rounded-lg shadow-lg mb-4 border border-gray-100">
                   <FormLabel className="mb-3 font-semibold text-gray-700">Lọc theo thời gian</FormLabel>
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
                </div>

                                 {/* Status filter */}
                 <div className="bg-white p-4 rounded-lg shadow-lg mb-4 border border-gray-100">
                   <FormLabel className="font-semibold mb-3 block text-gray-700">Trạng thái</FormLabel>
                  <FormControl component="fieldset" className="flex flex-col gap-2">
                                         <FormControlLabel
                       control={
                         <Checkbox
                           checked={filter.status.draft}
                           onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, draft: !prev.status.draft } }))}
                         />
                       }
                       label="Nháp"
                     />
                     <FormControlLabel
                       control={
                         <Checkbox
                           checked={filter.status.waiting}
                           onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, waiting: !prev.status.waiting } }))}
                         />
                       }
                       label="Chờ xử lý"
                     />
                     <FormControlLabel
                       control={
                         <Checkbox
                           checked={filter.status.complete}
                           onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, complete: !prev.status.complete } }))}
                         />
                       }
                       label="Hoàn thành"
                     />
                     <FormControlLabel
                       control={
                         <Checkbox
                           checked={filter.status.cancel}
                           onChange={() => setFilter(prev => ({ ...prev, status: { ...prev.status, cancel: !prev.status.cancel } }))}
                         />
                       }
                       label="Đã hủy"
                     />
                  </FormControl>
                </div>

                                 {/* Model type filter */}
                 <Accordion className="bg-white rounded-lg shadow-lg mb-4 w-full border border-gray-100">
                   <AccordionSummary expandIcon={<ExpandMore />}>
                     <span className="font-semibold text-gray-700">Loại đối tượng</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControl fullWidth size="small">
                      <Select
                        value={filter.modelType}
                        onChange={(e) => setFilter({ ...filter, modelType: e.target.value })}
                        displayEmpty
                      >
                        <MenuItem value="">Tất cả</MenuItem>
                        <MenuItem value="SALE_TRANSACTION">Bán hàng</MenuItem>
                        <MenuItem value="IMPORT_TRANSACTION">Nhập hàng</MenuItem>
                        <MenuItem value="STOCKTAKE">Kiểm kê</MenuItem>
                        <MenuItem value="DEBT_NOTE">Ghi nợ</MenuItem>
                        <MenuItem value="CUSTOMER">Khách hàng</MenuItem>
                        <MenuItem value="PRODUCT">Sản phẩm</MenuItem>
                      </Select>
                    </FormControl>
                  </AccordionDetails>
                </Accordion>

                {/* Preset date popover */}
                <Menu 
                  open={openPopover} 
                  anchorEl={anchorEl} 
                  onClose={() => setAnchorEl(null)} 
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }} 
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                >
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {Object.entries(labelMap).map(([key, label]) => (
                      <Button key={key} size="small" variant="outlined" onClick={() => handlePresetChange(key)}>
                        {label}
                      </Button>
                    ))}
                  </div>
                </Menu>

                {/* Custom date picker */}
                {showDatePicker && selectedMode === "custom" && (
                  <ClickAwayListener onClickAway={() => setShowDatePicker(false)}>
                    <div className="absolute z-50 top-0 left-full ml-4 bg-white p-4 rounded shadow-lg border w-max">
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
              </>
            )}
          </div>

          {/* Main content area */}
          <div className={showFilter ? "w-full lg:w-4/5" : "w-full"} style={{ transition: 'all 0.4s cubic-bezier(.4,2,.6,1)' }}>
                         <div className="mb-4 w-1/2">
               <TextField 
                 label="Tìm kiếm mô tả..." 
                 size="small" 
                 fullWidth 
                 value={filter.search} 
                 onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                 sx={{
                   '& .MuiOutlinedInput-root': {
                     borderRadius: 2,
                     '&:hover fieldset': {
                       borderColor: '#667eea',
                     },
                     '&.Mui-focused fieldset': {
                       borderColor: '#667eea',
                     },
                   },
                 }}
               />
             </div>
            
                         <div style={{ 
               height: 500, 
               overflowY: 'auto', 
               overflowX: 'auto', 
               borderRadius: 12, 
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
               border: '1px solid #e5e7eb'
             }}>
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <CircularProgress />
                </div>
              ) : (
                <table style={tableStyles}>
                  <colgroup>
                    <col style={{ width: 60 }} /> {/* STT */}
                    <col style={{ width: 120 }} /> {/* Loại */}
                    <col style={{ width: 120 }} /> {/* Mã nguồn */}
                    <col style={{ width: 120 }} /> {/* Trạng thái cũ */}
                    <col style={{ width: 120 }} /> {/* Trạng thái mới */}
                    <col style={{ width: 200 }} /> {/* Mô tả */}
                    <col style={{ width: 150 }} /> {/* Thời gian */}
                    <col style={{ width: 80 }} /> {/* Hành động */}
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={thStyles}>STT</th>
                      <th style={thStyles}>Loại</th>
                      <th style={thStyles}>Mã nguồn</th>
                      <th style={thStyles}>Trạng thái cũ</th>
                      <th style={thStyles}>Trạng thái mới</th>
                      <th style={thStyles}>Mô tả</th>
                      <th style={thStyles}>Thời gian</th>
                      <th style={thStyles}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', ...tdStyles }}>
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : logs.map((log, idx) => (
                                             <tr key={log.id} style={zebra(idx)}>
                         <td style={tdStyles}>{page * pageSize + idx + 1}</td>
                                                 <td style={tdStyles}>
                           <Chip
                             label={getModelTypeLabel(log.modelName)}
                             size="small"
                             style={{
                               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                               color: 'white',
                               fontWeight: 600,
                               fontSize: '0.75rem',
                               height: 24,
                               borderRadius: '12px',
                               boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                             }}
                           />
                         </td>
                        <td style={tdStyles}>
                          <Typography variant="body2" fontWeight="medium">
                            {log.sourceName || `ID: ${log.modelID}`}
                          </Typography>
                        </td>
                                                 <td style={tdStyles}>
                           <Chip
                             label={getStatusLabel(log.previousStatus) || 'N/A'}
                             size="small"
                             style={{
                               backgroundColor: getStatusColor(log.previousStatus) + '15',
                               color: getStatusColor(log.previousStatus),
                               border: `2px solid ${getStatusColor(log.previousStatus)}`,
                               fontWeight: 600,
                               fontSize: '0.75rem',
                               height: 24,
                               borderRadius: '12px'
                             }}
                           />
                         </td>
                         <td style={tdStyles}>
                           <Chip
                             label={getStatusLabel(log.nextStatus) || 'N/A'}
                             size="small"
                             style={{
                               background: `linear-gradient(135deg, ${getStatusColor(log.nextStatus)} 0%, ${getStatusColor(log.nextStatus)}dd 100%)`,
                               color: '#fff',
                               fontWeight: 600,
                               fontSize: '0.75rem',
                               height: 24,
                               borderRadius: '12px',
                               boxShadow: `0 2px 8px ${getStatusColor(log.nextStatus)}40`
                             }}
                           />
                         </td>
                        <td style={tdStyles}>
                          <Typography variant="body2" noWrap>
                            {log.description || 'Không có mô tả'}
                          </Typography>
                        </td>
                        <td style={tdStyles}>
                          <Typography variant="body2">
                            {formatDateTime(log.createdAt)}
                          </Typography>
                        </td>
                        <td style={tdStyles}>
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleActionClick(e, log)}
                          >
                            <MoreHoriz fontSize="small" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

                         {/* Pagination controls */}
             <div style={{
               display: 'flex', alignItems: 'center', padding: 12, 
               background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
               borderRadius: 16, marginTop: 16, fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14, 
               boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
               border: '1px solid #e2e8f0', width: 'fit-content', minWidth: 420
             }}>
              <span style={{ marginRight: 6, fontFamily: 'Roboto, Arial, sans-serif' }}>Hiển thị</span>
              <FormControl size="small" style={{ minWidth: 80, marginRight: 6, fontFamily: 'Roboto, Arial, sans-serif' }}>
                                 <Select
                   value={pageSize}
                   onChange={(e) => setPageSize(Number(e.target.value))}
                                     sx={{
                     borderRadius: 2,
                     fontFamily: 'Roboto, Arial, sans-serif',
                     fontSize: 14,
                     height: 36,
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                     border: '1px solid #e2e8f0',
                     padding: '4px 8px',
                     '&:hover': {
                       borderColor: '#667eea',
                     },
                     '&.Mui-focused': {
                       borderColor: '#667eea',
                     },
                   }}
                  MenuProps={{ PaperProps: { style: { fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14 } } }}
                >
                  {[15, 25, 50, 100].map(opt => (
                    <MenuItem key={opt} value={opt} style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14 }}>
                      {opt} dòng
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
                             <Button 
                 size="small" 
                 variant="outlined" 
                 sx={{ 
                   minWidth: 32, 
                   borderRadius: 2, 
                   margin: '0 2px', 
                   padding: 0,
                   borderColor: '#e2e8f0',
                   color: '#64748b',
                   '&:hover': {
                     borderColor: '#667eea',
                     backgroundColor: '#f8fafc',
                   },
                   '&:disabled': {
                     borderColor: '#e2e8f0',
                     color: '#cbd5e1',
                   }
                 }}
                 disabled={page === 0} 
                 onClick={() => setPage(0)}
               >
                 {'|<'}
               </Button>
               <Button 
                 size="small" 
                 variant="outlined" 
                 sx={{ 
                   minWidth: 32, 
                   borderRadius: 2, 
                   margin: '0 2px', 
                   padding: 0,
                   borderColor: '#e2e8f0',
                   color: '#64748b',
                   '&:hover': {
                     borderColor: '#667eea',
                     backgroundColor: '#f8fafc',
                   },
                   '&:disabled': {
                     borderColor: '#e2e8f0',
                     color: '#cbd5e1',
                   }
                 }}
                 disabled={page === 0} 
                 onClick={() => setPage(page - 1)}
               >
                 {'<'}
               </Button>
               <input
                 type="number"
                 min={1}
                 max={pagination.totalPages}
                 value={page + 1}
                 onChange={(e) => {
                   let val = Number(e.target.value) - 1;
                   if (val < 0) val = 0;
                   if (val >= pagination.totalPages) val = pagination.totalPages - 1;
                   setPage(val);
                 }}
                                 style={{
                   width: 32, textAlign: 'center', margin: '0 4px', height: 28, border: '1px solid #e0e0e0',
                   borderRadius: 8, fontSize: 14, fontFamily: 'Roboto, Arial, sans-serif', 
                   boxShadow: '0 1px 2px #e5e7eb', outline: 'none'
                 }}
              />
                             <Button 
                 size="small" 
                 variant="outlined" 
                 sx={{ 
                   minWidth: 32, 
                   borderRadius: 2, 
                   margin: '0 2px', 
                   padding: 0,
                   borderColor: '#e2e8f0',
                   color: '#64748b',
                   '&:hover': {
                     borderColor: '#667eea',
                     backgroundColor: '#f8fafc',
                   },
                   '&:disabled': {
                     borderColor: '#e2e8f0',
                     color: '#cbd5e1',
                   }
                 }}
                 disabled={page + 1 >= pagination.totalPages} 
                 onClick={() => setPage(page + 1)}
               >
                 {'>'}
               </Button>
               <Button 
                 size="small" 
                 variant="outlined" 
                 sx={{ 
                   minWidth: 32, 
                   borderRadius: 2, 
                   margin: '0 2px', 
                   padding: 0,
                   borderColor: '#e2e8f0',
                   color: '#64748b',
                   '&:hover': {
                     borderColor: '#667eea',
                     backgroundColor: '#f8fafc',
                   },
                   '&:disabled': {
                     borderColor: '#e2e8f0',
                     color: '#cbd5e1',
                   }
                 }}
                 disabled={page + 1 >= pagination.totalPages} 
                 onClick={() => setPage(pagination.totalPages - 1)}
               >
                 {'>|'}
               </Button>
                             <span style={{ marginLeft: 8, fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14 }}>
                 {`${page * pageSize + 1} - ${Math.min((page + 1) * pageSize, pagination.totalElements)} trong ${pagination.totalElements} bản ghi`}
               </span>
            </div>
          </div>
        </div>

        {/* Detail Dialog */}
        <ChangeStatusLogDetailDialog
          open={detailDialogOpen}
          log={selectedLog}
          onClose={handleCloseDetailDialog}
          onViewSource={handleViewSource}
        />

        {/* Action Menu */}
        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={handleActionClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleViewDetailMenu}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Xem chi tiết</ListItemText>
          </MenuItem>
          {actionRow?.sourceUrl && (
            <MenuItem onClick={handleViewSourceMenu}>
              <ListItemIcon>
                <OpenInNew fontSize="small" />
              </ListItemIcon>
              <ListItemText>Xem nguồn</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Snackbar */}
        <SnackbarAlert
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        />
      </Box>
    </Container>
  );
};

export default ChangeStatusLogPage; 