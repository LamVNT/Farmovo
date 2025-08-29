import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Alert,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  Select,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Visibility,
  OpenInNew,
  MoreHoriz,
  Search,
  Clear
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import useChangeStatusLog from '../../hooks/useChangeStatusLog';
import ChangeStatusLogDetailDialog from '../../components/ChangeStatusLogDetailDialog';
import SnackbarAlert from '../../components/SnackbarAlert';
import changeStatusLogService from '../../services/changeStatusLogService';






const ChangeStatusLogPage = () => {
  const navigate = useNavigate();
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });



  const [filter, setFilter] = useState({
    search: ''
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // UI states
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionRow, setActionRow] = useState(null);
  const mainAreaRef = useRef(null);

  const {
    logs,
    loading,
    error,
    pagination,
    getLatestLogsForEachSource,
    getLatestLogsForEachSourceByModel
  } = useChangeStatusLog();

  // Luôn sử dụng chế độ mới nhất mỗi nguồn
  const displayMode = 'latest';
  
  // State để lưu trữ tất cả bản ghi thay đổi của một mã nguồn
  const [sourceLogs, setSourceLogs] = useState([]);
  const [sourceLogsLoading, setSourceLogsLoading] = useState(false);
  
  // State để kiểm soát việc gọi API
  const [isInitialized, setIsInitialized] = useState(false);
  


  const handleViewDetail = useCallback(async (log) => {
    console.log('handleViewDetail called with log:', log);
    setSelectedLog(log);
    setDetailDialogOpen(true);
    
    // Lấy tất cả bản ghi thay đổi của mã nguồn này
    setSourceLogsLoading(true);
    try {
      console.log('Calling getLogsByModel with:', { modelName: log.modelName, modelId: log.modelID });
      const response = await changeStatusLogService.getLogsByModel(log.modelName, log.modelID);
      console.log('getLogsByModel response:', response);
      setSourceLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching source logs:', error);
      setSourceLogs([]);
    } finally {
      setSourceLogsLoading(false);
    }
  }, []);

  const handleViewSource = useCallback((log) => {
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
  }, [navigate]);

  const handleCloseDetailDialog = useCallback(() => {
    setDetailDialogOpen(false);
    setSelectedLog(null);
    setSourceLogs([]);
    setSourceLogsLoading(false);
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar({ ...snackbar, open: false });
  }, [snackbar]);





  // Action menu handlers
  const handleActionClick = useCallback((event, row) => {
    setActionAnchorEl(event.currentTarget);
    setActionRow(row);
  }, []);

  const handleActionClose = useCallback(() => {
    setActionAnchorEl(null);
    setActionRow(null);
  }, []);

  const handleViewDetailMenu = useCallback(() => {
    handleViewDetail(actionRow);
    handleActionClose();
  }, [handleViewDetail, actionRow, handleActionClose]);

  const handleViewSourceMenu = useCallback(() => {
    handleViewSource(actionRow);
    handleActionClose();
  }, [handleViewSource, actionRow, handleActionClose]);

  // Status color mapping
  const getStatusColor = useMemo(() => (status) => {
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
  }, []);

  const getStatusLabel = useMemo(() => (status) => {
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
  }, []);

  const getModelTypeLabel = useMemo(() => (modelName) => {
    const modelLabels = {
      'SaleTransaction': 'Bán hàng',
      'ImportTransaction': 'Nhập hàng',
      'Stocktake': 'Kiểm kê',
      'DebtNote': 'Ghi nợ',
      'Customer': 'Khách hàng',
      'Product': 'Sản phẩm'
    };
    return modelLabels[modelName] || modelName;
  }, []);

  const formatDateTime = useMemo(() => (dateTime) => {
    if (!dateTime) return '-';
    return format(new Date(dateTime), 'dd/MM/yyyy HH:mm', { locale: vi });
  }, []);

  // Table styles
  const tableStyles = useMemo(() => ({
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: 1200,
    background: '#fff',
    fontFamily: 'Roboto, Arial, sans-serif',
    fontSize: 15,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  }), []);

  const thStyles = useMemo(() => ({
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
  }), []);

  const tdStyles = useMemo(() => ({
    padding: '16px 12px',
    borderBottom: '1px solid #f3f4f6',
    background: '#fff',
    whiteSpace: 'nowrap',
    fontSize: 14,
    color: '#374151',
    height: 48,
    fontFamily: 'Roboto, Arial, sans-serif',
    transition: 'all 0.2s ease',
  }), []);

  const zebra = useMemo(() => (idx) => ({ 
    background: idx % 2 === 0 ? '#fafbfc' : '#fff',
    '&:hover': {
      background: '#f0f9ff',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }
  }), []);

  // Pagination logic cho chế độ latest
  const paginatedLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    return logs.slice(startIndex, endIndex);
  }, [logs, page, pageSize]);

  const totalPages = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    return Math.ceil(logs.length / pageSize);
  }, [logs, pageSize]);

  const totalElements = useMemo(() => {
    return logs ? logs.length : 0;
  }, [logs]);



    // Effect để xử lý search filter và pagination
  useEffect(() => {
    if (!isInitialized) return;
    
    // Debounce để tránh gọi API quá nhiều
    const timeoutId = setTimeout(() => {
      console.log('Effect triggered - search:', filter.search, 'page:', page, 'pageSize:', pageSize);
      
      // Luôn sử dụng chế độ mới nhất mỗi nguồn
      if (logs.length === 0) {
        console.log('Calling getLatestLogsForEachSource (no logs available)');
        getLatestLogsForEachSource();
      } else {
        console.log('Logs already available, no need to call API');
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [filter.search, page, pageSize, isInitialized, getLatestLogsForEachSource, logs.length]);

  



  // Effect để xử lý pagination - chế độ latest vẫn cần pagination
  useEffect(() => {
    if (page >= 0 && isInitialized) {
      console.log('Page changed to:', page, '- latest mode with pagination');
      // Chế độ latest vẫn cần pagination để hiển thị đúng số dòng
    }
  }, [page, isInitialized]);

  useEffect(() => {
    if (pageSize > 0 && isInitialized) {
      setPage(0); // Reset về trang đầu khi thay đổi pageSize
      console.log('Page size changed to:', pageSize, '- latest mode with pagination');
      // Chế độ latest vẫn cần pagination để hiển thị đúng số dòng
    }
  }, [pageSize, isInitialized]);

  // Khởi tạo dữ liệu ban đầu khi component mount
  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing component...');
    // Mặc định load dữ liệu theo chế độ latest
    getLatestLogsForEachSource();
      setIsInitialized(true);
    }
  }, [isInitialized, getLatestLogsForEachSource]);

  







  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
                 {/* Header */}
         <Box sx={{ mb: 3 }}>
           <Typography variant="h4" component="h1" gutterBottom>
             Lịch sử thay đổi trạng thái
           </Typography>
           <Typography variant="body1" color="textSecondary">
             Theo dõi và quản lý lịch sử thay đổi trạng thái của các đối tượng trong hệ thống. 
             Mặc định hiển thị bản ghi mới nhất cho mỗi mã nguồn, có thể filter theo loại đối tượng, trạng thái và tìm kiếm.
           </Typography>
           
                       {/* Mô tả chế độ hiển thị */}
           <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
               <Chip
                 label="Chế độ mặc định - Chỉ hiển thị bản ghi mới nhất cho mỗi mã nguồn (có thể filter theo loại đối tượng, trạng thái và tìm kiếm)"
                 color="success"
                 size="small"
                 variant="outlined"
               />
           </Box>
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
        >



          {/* Main content area */}
          <div className="w-full" style={{ transition: 'all 0.4s cubic-bezier(.4,2,.6,1)' }}>
                         <div className="mb-4 w-full max-w-md">
                           <div className="flex items-center gap-2">
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
                               InputProps={{
                                 endAdornment: filter.search && (
                                   <IconButton
                                     size="small"
                                     onClick={() => setFilter({ ...filter, search: '' })}
                                     sx={{ color: '#9ca3af' }}
                                   >
                                     <Clear fontSize="small" />
                                   </IconButton>
                                 ),
                               }}
                             />
                             {filter.search && (
                               <Button
                                 size="small"
                                 variant="outlined"
                                 onClick={() => setFilter({ ...filter, search: '' })}
                                 sx={{
                                   borderColor: '#e5e7eb',
                                   color: '#6b7280',
                                   minWidth: 'auto',
                                   px: 2,
                                 }}
                               >
                                 Xóa
                               </Button>
                             )}
                           </div>
             </div>
            
                         <div style={{ 
               height: 500, 
               overflowY: 'auto', 
               overflowX: 'auto', 
               borderRadius: 12, 
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
               border: '1px solid #e5e7eb',
               width: '100%'
             }}>
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center">
                    <CircularProgress size={40} />
                    <div className="mt-2 text-gray-600">Đang tải dữ liệu...</div>
                  </div>
                </div>
              ) : (
                <table style={tableStyles}>
                  <colgroup>
                    <col style={{ width: 80 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 300 }} />
                    <col style={{ width: 160 }} />
                    <col style={{ width: 100 }} />
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
                    {paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', ...tdStyles }}>
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : paginatedLogs.map((log, idx) => (
                                             <tr key={log.id} style={zebra(idx)}>
                         <td style={tdStyles}>
                           {page * pageSize + idx + 1}
                         </td>
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

                                                  {/* Pagination controls - nhỏ gọn ở góc trái như import */}
             {totalElements > 0 && (
               <div style={{
                 display: 'flex', alignItems: 'center', padding: 10, 
                 background: '#f8fafc',
                 borderRadius: 8, marginTop: 16, fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14, 
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 border: '1px solid #e2e8f0', width: 'fit-content'
               }}>
                <span style={{ marginRight: 6, fontFamily: 'Roboto, Arial, sans-serif' }}>Hiển thị</span>
                 <FormControl size="small" style={{ minWidth: 70, marginRight: 12, fontFamily: 'Roboto, Arial, sans-serif' }}>
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
                     minWidth: 30, 
                     borderRadius: 2, 
                     margin: '0 1px', 
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
                     minWidth: 30, 
                     borderRadius: 2, 
                     margin: '0 1px', 
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
                 
                 {/* Current Page */}
                 <Button
                   size="small"
                   variant="outlined"
                   sx={{
                     minWidth: 36,
                     borderRadius: 2,
                     margin: '0 3px',
                     padding: '4px 6px',
                     borderColor: '#3b82f6',
                     color: '#3b82f6',
                     backgroundColor: '#fff',
                     fontWeight: 600,
                     '&:hover': {
                       borderColor: '#2563eb',
                       backgroundColor: '#f0f9ff',
                     }
                   }}
                 >
                   {page + 1}
                 </Button>
                               <Button 
                   size="small" 
                   variant="outlined" 
                   sx={{ 
                     minWidth: 30, 
                     borderRadius: 2, 
                     margin: '0 1px', 
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
                                       disabled={page + 1 >= totalPages} 
                    onClick={() => setPage(page + 1)}
                 >
                   {'>'}
                 </Button>
                 <Button 
                   size="small" 
                   variant="outlined" 
                   sx={{ 
                     minWidth: 30, 
                     borderRadius: 2, 
                     margin: '0 1px', 
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
                                       disabled={page + 1 >= totalPages} 
                    onClick={() => setPage(totalPages - 1)}
                 >
                   {'>|'}
                 </Button>
                 
                 {/* Total Records Info */}
                 <span style={{ 
                   marginLeft: 8, 
                   fontFamily: 'Roboto, Arial, sans-serif', 
                   color: '#64748b',
                   fontSize: 14
                 }}>
                                       {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} / {totalElements}
                 </span>
              </div>
             )}
          </div>
        </div>

        {/* Detail Dialog */}
        <ChangeStatusLogDetailDialog
          open={detailDialogOpen}
          log={selectedLog}
          sourceLogs={sourceLogs}
          sourceLogsLoading={sourceLogsLoading}
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