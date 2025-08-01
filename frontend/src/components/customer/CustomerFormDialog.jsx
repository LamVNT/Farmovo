import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Checkbox } from "@mui/material";
import { customerService } from "../../services/customerService";

const CustomerFormDialog = ({ open, onClose, mode, customer }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", totalDebt: 0, isSupplier: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && customer) {
      setForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        totalDebt: customer.totalDebt || 0,
        isSupplier: customer.isSupplier || false,
      });
    } else {
      setForm({ name: "", email: "", phone: "", totalDebt: 0, isSupplier: false });
    }
  }, [mode, customer, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "add") {
        await customerService.createCustomer(form);
      } else if (mode === "edit" && customer) {
        await customerService.updateCustomer(customer.id, form);
      }
      onClose(true);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle>{mode === "add" ? "Thêm khách hàng" : "Sửa khách hàng"}</DialogTitle>
      <DialogContent>
        <TextField
          label="Tên khách hàng"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Số điện thoại"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Nợ ban đầu"
          name="totalDebt"
          type="number"
          value={form.totalDebt}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputProps={{ readOnly: true }}
          disabled
        />
        <FormControlLabel
          control={
            <Checkbox
              name="isSupplier"
              checked={form.isSupplier}
              onChange={handleChange}
            />
          }
          label="Là nhà cung cấp"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>Hủy</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {mode === "add" ? "Thêm" : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerFormDialog; 