import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  Paper,
  IconButton
} from '@mui/material';
import { Close, OpenInNew, History, Info, ArrowForward } from '@mui/icons-material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ChangeStatusLogDetailDialog = ({ open, log, sourceLogs, sourceLogsLoading, onClose, onViewSource }) => {
  if (!log) return null;

  const getStatusColor = (status) => {
    const statusColors = {
      'DRAFT': '#6b7280',
      'WAITING_FOR_APPROVE': '#f59e0b',
      'COMPLETE': '#10b981',
      'CANCEL': '#ef4444',
      'PENDING': '#f59e0b',
      'APPROVED': '#10b981',
      'REJECTED': '#ef4444',
      'COMPLETED': '#10b981',
      'CANCELLED': '#ef4444',
      'IN_PROGRESS': '#3b82f6'
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
    return format(new Date(dateTime), 'dd/MM/yyyy HH:mm:ss', { locale: vi });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      {/* Header gọn gàng */}
      <DialogTitle sx={{ pb: 1, pt: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <History sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="h6" fontWeight={600}>
              Chi tiết lịch sử thay đổi
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: '#6b7280' }}
          >
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
          ID: #{log.id} • {formatDateTime(log.createdAt)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, pb: 1 }}>
        {/* Thông tin tổng hợp */}
            <Paper 
              elevation={0} 
              sx={{ 
            p: 2.5, 
                border: '1px solid #e5e7eb',
            borderRadius: 2,
            backgroundColor: '#fafbfc',
            mb: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Info sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="h6" fontWeight={600}>
              Thông tin chi tiết
            </Typography>
          </Box>
          
          <Grid container spacing={30}>
            {/* Cột trái - Thông tin cơ bản */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="textSecondary" gutterBottom>
                  Thông tin cơ bản
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">Loại đối tượng:</Typography>
                  <Chip
                    label={getModelTypeLabel(log.modelName)}
                    size="small"
                    sx={{
                      backgroundColor: '#667eea',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">ID đối tượng:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {log.modelID}
                  </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">Thời gian tạo:</Typography>
                  <Typography variant="body2">
                    {formatDateTime(log.createdAt)}
                  </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">Người thực hiện:</Typography>
                  <Typography variant="body2">
                    {log.createdBy || 'Hệ thống'}
                  </Typography>
                  </Box>
                </Box>
              </Box>
          </Grid>

            {/* Cột phải - Thông tin nguồn */}
          <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="textSecondary" gutterBottom>
                  Thông tin nguồn
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">Mã nguồn:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {log.sourceName || '-'}
                  </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">Loại nguồn:</Typography>
                  <Typography variant="body2">
                    {log.sourceType ? getModelTypeLabel(log.sourceType) : '-'}
                  </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="textSecondary" gutterBottom>
                  Thay đổi trạng thái
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Chip
                    label={getStatusLabel(log.previousStatus) || 'N/A'}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(log.previousStatus) + '15',
                      color: getStatusColor(log.previousStatus),
                      border: `1px solid ${getStatusColor(log.previousStatus)}`,
                      fontWeight: 500
                    }}
                  />
                  <ArrowForward sx={{ color: '#667eea', fontSize: 18 }} />
                  <Chip
                    label={getStatusLabel(log.nextStatus) || 'N/A'}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(log.nextStatus),
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                  </Box>
                </Box>
              </Box>
              </Grid>
          </Grid>

          {/* Mô tả thay đổi */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="textSecondary" gutterBottom>
                Mô tả thay đổi
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4,
                p: 1.5,
                  backgroundColor: '#f9fafb',
                  borderRadius: 1,
                border: '1px solid #e5e7eb',
                minHeight: 60
                }}
              >
                {log.description || 'Không có mô tả'}
            </Typography>
          </Box>
        </Paper>

        {/* Lịch sử đầy đủ của mã nguồn */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            border: '1px solid #e5e7eb',
            backgroundColor: '#fafbfc'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <History sx={{ color: '#667eea', fontSize: 18 }} />
            <Typography variant="h6" fontWeight={600}>
              Lịch sử đầy đủ của mã nguồn: {log.sourceName || `ID: ${log.modelID}`}
            </Typography>
          </Box>
          
          {sourceLogsLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <Typography variant="body2" color="textSecondary">
                Đang tải lịch sử...
              </Typography>
            </Box>
          ) : sourceLogs.length > 0 ? (
            <Box>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Tổng cộng {sourceLogs.length} bản ghi thay đổi
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {sourceLogs.map((sourceLog, index) => (
                  <Paper
                    key={sourceLog.id}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                        borderColor: '#d1d5db'
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={500} color="textSecondary">
                          #{index + 1}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {formatDateTime(sourceLog.createdAt)}
                        </Typography>
                      </Box>
                      {sourceLog.id === log.id && (
                        <Chip
                          label="Bản ghi hiện tại"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Chip
                        label={getStatusLabel(sourceLog.previousStatus) || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(sourceLog.previousStatus) + '15',
                          color: getStatusColor(sourceLog.previousStatus),
                          border: `1px solid ${getStatusColor(sourceLog.previousStatus)}`,
                          fontWeight: 500
                        }}
                      />
                      <ArrowForward sx={{ color: '#667eea', fontSize: 16 }} />
                      <Chip
                        label={getStatusLabel(sourceLog.nextStatus) || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(sourceLog.nextStatus),
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    
                    {sourceLog.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                        {sourceLog.description}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" py={3}>
              <Typography variant="body2" color="textSecondary">
                Không có bản ghi thay đổi nào khác
              </Typography>
            </Box>
          )}
            </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 1.5, borderTop: '1px solid #e5e7eb' }}>
        {log.sourceUrl ? (
          <Button
            variant="outlined"
            startIcon={<OpenInNew />}
            onClick={() => onViewSource(log)}
            size="small"
            sx={{ 
              mr: 'auto',
              borderColor: '#0ea5e9',
              color: '#0ea5e9',
              '&:hover': {
                borderColor: '#0284c7',
                backgroundColor: '#f0f9ff'
              }
            }}
          >
            Xem nguồn
          </Button>
        ) : (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ mr: 'auto', fontStyle: 'italic' }}
          >
            Không có đường dẫn đến nguồn
          </Typography>
        )}
        <Button onClick={onClose} variant="outlined" size="small">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeStatusLogDetailDialog; 