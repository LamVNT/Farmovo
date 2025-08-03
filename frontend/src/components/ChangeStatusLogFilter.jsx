import React, { useState } from 'react';
import {
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Collapse
} from '@mui/material';
import { FilterList, Clear, ExpandMore, ExpandLess } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

const ChangeStatusLogFilter = ({ filters, onFilterChange, onClearFilters }) => {
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const modelTypes = [
    { value: 'SALE_TRANSACTION', label: 'Bán hàng' },
    { value: 'IMPORT_TRANSACTION', label: 'Nhập hàng' },
    { value: 'STOCKTAKE', label: 'Kiểm kê' },
    { value: 'DEBT_NOTE', label: 'Ghi nợ' },
    { value: 'CUSTOMER', label: 'Khách hàng' },
    { value: 'PRODUCT', label: 'Sản phẩm' }
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'DRAFT', label: 'Nháp' }
  ];

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      modelName: '',
      modelId: null,
      previousStatus: '',
      nextStatus: '',
      description: '',
      fromDate: null,
      toDate: null
    };
    setLocalFilters(clearedFilters);
    onClearFilters(clearedFilters);
  };

  const handleResetToCurrent = () => {
    setLocalFilters(filters);
  };

  return (
    <Paper elevation={2} sx={{ mb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <FilterList color="primary" />
            <Typography variant="h6">Bộ lọc</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              {expanded ? 'Thu gọn' : 'Mở rộng'}
            </Button>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Loại đối tượng</InputLabel>
                  <Select
                    value={localFilters.modelName || ''}
                    onChange={(e) => handleFilterChange('modelName', e.target.value)}
                    label="Loại đối tượng"
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {modelTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="ID đối tượng"
                  type="number"
                  value={localFilters.modelId || ''}
                  onChange={(e) => handleFilterChange('modelId', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Nhập ID..."
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trạng thái cũ</InputLabel>
                  <Select
                    value={localFilters.previousStatus || ''}
                    onChange={(e) => handleFilterChange('previousStatus', e.target.value)}
                    label="Trạng thái cũ"
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trạng thái mới</InputLabel>
                  <Select
                    value={localFilters.nextStatus || ''}
                    onChange={(e) => handleFilterChange('nextStatus', e.target.value)}
                    label="Trạng thái mới"
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mô tả"
                  value={localFilters.description || ''}
                  onChange={(e) => handleFilterChange('description', e.target.value)}
                  placeholder="Tìm kiếm trong mô tả..."
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                  <DatePicker
                    label="Từ ngày"
                    value={localFilters.fromDate}
                    onChange={(date) => handleFilterChange('fromDate', date)}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                  <DatePicker
                    label="Đến ngày"
                    value={localFilters.toDate}
                    onChange={(date) => handleFilterChange('toDate', date)}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    startIcon={<FilterList />}
                    fullWidth
                  >
                    Áp dụng
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<Clear />}
                    fullWidth
                  >
                    Xóa
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

export default ChangeStatusLogFilter; 