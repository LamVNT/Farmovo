import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack } from "@mui/material";
import { formatCurrency } from "../../utils/formatters";

const CustomerDetailDialog = ({ open, onClose, customer }) => {
  if (!customer) return null;
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Chi tiết khách hàng</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography><b>Tên:</b> {customer.name}</Typography>
          <Typography><b>Email:</b> {customer.email}</Typography>
          <Typography><b>Số điện thoại:</b> {customer.phone}</Typography>
          <Typography><b>Nợ:</b> {formatCurrency(customer.totalDebt)}</Typography>
          <Typography><b>Nhà cung cấp:</b> {customer.isSupplier ? "Có" : "Không"}</Typography>
          <Typography><b>Địa chỉ:</b> {customer.address || "-"}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailDialog; 