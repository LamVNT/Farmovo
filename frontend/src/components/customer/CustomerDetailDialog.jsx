import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Divider,
  Chip,
  Avatar
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon
} from "@mui/icons-material";
import { formatCurrency } from "../../utils/formatters";

const CustomerDetailDialog = ({ open, onClose, customer }) => {
  if (!customer) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <PersonIcon />
        Chi tiết khách hàng
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Thông tin cơ bản
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tên khách hàng</Typography>
                  <Typography variant="h6" fontWeight={500}>{customer.name}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.light', width: 40, height: 40 }}>
                  <EmailIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{customer.email || "Chưa có"}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', width: 40, height: 40 }}>
                  <PhoneIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Số điện thoại</Typography>
                  <Typography variant="body1">{customer.phone || "Chưa có"}</Typography>
                </Box>
              </Box>

              {customer.address && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.light', width: 40, height: 40 }}>
                    <LocationIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Địa chỉ</Typography>
                    <Typography variant="body1">{customer.address}</Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Business Information */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Thông tin kinh doanh
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.light', width: 40, height: 40 }}>
                  <BusinessIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">Vai trò</Typography>
                  <Chip
                    label={customer.isSupplier ? "Nhà cung cấp" : "Khách hàng"}
                    color={customer.isSupplier ? "secondary" : "primary"}
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.light', width: 40, height: 40 }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tổng nợ hiện tại</Typography>
                  <Typography
                    variant="h6"
                    color={customer.totalDebt > 0 ? 'error.main' : 'success.main'}
                    fontWeight={600}
                  >
                    {formatCurrency(customer.totalDebt)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: 100,
            borderRadius: 2
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailDialog; 