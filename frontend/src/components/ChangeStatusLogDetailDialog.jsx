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

const ChangeStatusLogDetailDialog = ({ open, log, onClose, onViewSource }) => {
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
        <Grid container spacing={1}>
          {/* Thông tin cơ bản */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 1.5, 
                border: '1px solid #e5e7eb',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Info sx={{ color: '#667eea', fontSize: 16 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  Thông tin cơ bản
                </Typography>
              </Box>
              <Grid container spacing={1} sx={{ flex: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Loại đối tượng
                  </Typography>
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
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    ID đối tượng
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {log.modelID}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Thời gian tạo
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(log.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Người thực hiện
                  </Typography>
                  <Typography variant="body2">
                    {log.createdBy || 'Hệ thống'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Thông tin nguồn */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 1.5, 
                border: '1px solid #e5e7eb',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <OpenInNew sx={{ color: '#0ea5e9', fontSize: 16 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  Thông tin nguồn
                </Typography>
              </Box>
              <Grid container spacing={1} sx={{ flex: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Mã nguồn
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {log.sourceName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Loại nguồn
                  </Typography>
                  <Typography variant="body2">
                    {log.sourceType ? getModelTypeLabel(log.sourceType) : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ flex: 1 }} />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Thay đổi trạng thái */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 1.5, 
                border: '1px solid #e5e7eb',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ArrowForward sx={{ color: '#f59e0b', fontSize: 16 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  Thay đổi trạng thái
                </Typography>
              </Box>
              <Grid container spacing={1} alignItems="center" sx={{ flex: 1 }}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Trạng thái cũ
                  </Typography>
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
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <ArrowForward sx={{ color: '#667eea', fontSize: 18 }} />
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Trạng thái mới
                  </Typography>
                  <Chip
                    label={getStatusLabel(log.nextStatus) || 'N/A'}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(log.nextStatus),
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Mô tả */}
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 1.5, 
                border: '1px solid #e5e7eb',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Mô tả thay đổi
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4,
                  p: 1,
                  backgroundColor: '#f9fafb',
                  borderRadius: 1,
                  flex: 1,
                  overflow: 'auto'
                }}
              >
                {log.description || 'Không có mô tả'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
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