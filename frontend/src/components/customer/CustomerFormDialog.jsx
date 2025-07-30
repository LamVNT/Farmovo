import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import { customerService } from "../../services/customerService";
import axios from "axios";

const CustomerFormDialog = ({ open, onClose, mode, customer }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", totalDebt: 0, role: "" });
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/authorities/admin/roleList`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setRoles(response.data.map(role => role.role));
      } catch (error) {
        console.error('Không thể lấy danh sách role:', error);
      } finally {
        setRolesLoading(false);
      }
    };

    if (open) {
      fetchRoles();
    }
  }, [open]);

  useEffect(() => {
    if (mode === "edit" && customer) {
      setForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        totalDebt: customer.totalDebt || 0,
        role: customer.role || "",
      });
    } else {
      setForm({ name: "", email: "", phone: "", totalDebt: 0, role: "" });
    }
  }, [mode, customer, open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "add") {
        await customerService.createCustomer({ ...form, totalDept: form.totalDebt });
      } else if (mode === "edit" && customer) {
        await customerService.updateCustomer(customer.id, { ...form, totalDept: form.totalDebt });
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
        <FormControl fullWidth margin="normal">
          <InputLabel>Vai trò</InputLabel>
          <Select
            name="role"
            value={form.role}
            onChange={handleChange}
            label="Vai trò"
            disabled={rolesLoading}
          >
            {rolesLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} />
                <span style={{ marginLeft: 8 }}>Đang tải...</span>
              </MenuItem>
            ) : (
              roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
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