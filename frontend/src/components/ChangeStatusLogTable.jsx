import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  Tooltip,
  TablePagination
} from '@mui/material';
import { Visibility, OpenInNew } from '@mui/icons-material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ChangeStatusLogTable = ({ 
  logs, 
  loading, 
  pagination, 
  onPageChange, 
  onSizeChange,
  onViewDetail,
  onViewSource 
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'error',
      'COMPLETED': 'success',
      'CANCELLED': 'error',
      'IN_PROGRESS': 'info',
      'DRAFT': 'default'
    };
    return statusColors[status] || 'default';
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

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Mã nguồn</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái cũ</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái mới</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Thời gian</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow
                key={log.id}
                hover
                onMouseEnter={() => setHoveredRow(log.id)}
                onMouseLeave={() => setHoveredRow(null)}
                sx={{
                  '&:hover': {
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                <TableCell>{log.id}</TableCell>
                <TableCell>
                  <Chip
                    label={getModelTypeLabel(log.modelName)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {log.sourceName || `ID: ${log.modelID}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.previousStatus || 'N/A'}
                    size="small"
                    color={getStatusColor(log.previousStatus)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.nextStatus || 'N/A'}
                    size="small"
                    color={getStatusColor(log.nextStatus)}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={log.description || 'Không có mô tả'}>
                    <Typography variant="body2">
                      {truncateText(log.description, 40)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(log.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetail(log)}
                        sx={{ color: '#1976d2' }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {log.sourceUrl && (
                      <Tooltip title="Xem nguồn">
                        <IconButton
                          size="small"
                          onClick={() => onViewSource(log)}
                          sx={{ color: '#2e7d32' }}
                        >
                          <OpenInNew />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={pagination.totalElements}
        page={pagination.page}
        onPageChange={(event, newPage) => onPageChange(newPage)}
        rowsPerPage={pagination.size}
        onRowsPerPageChange={(event) => onSizeChange(parseInt(event.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Số dòng mỗi trang:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} trong tổng số ${count !== -1 ? count : `hơn ${to}`}`
        }
      />
    </Paper>
  );
};

export default ChangeStatusLogTable; 