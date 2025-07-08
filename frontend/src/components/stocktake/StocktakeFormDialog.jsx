import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Box, IconButton, Typography
} from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const emptyRow = { productId: '', zones_id: [], real: '', note: '' };

export default function StocktakeFormDialog({ open, onClose, onSubmit, products, zones }) {
  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [grouped, setGrouped] = useState([]);

  const addRow = () => setRows([...rows, { ...emptyRow }]);
  const removeRow = idx => setRows(rows.filter((_, i) => i !== idx));
  const updateRow = (idx, field, value) => {
    const newRows = [...rows];
    newRows[idx][field] = value;
    setRows(newRows);
  };

  // Validate và tổng hợp dữ liệu
  const handleValidateAndGroup = () => {
    for (let row of rows) {
      if (!row.productId || row.zones_id.length === 0 || row.real === "") {
        setError("Vui lòng nhập đầy đủ thông tin cho tất cả các dòng!");
        return;
      }
      if (isNaN(row.real) || Number(row.real) < 0) {
        setError("Số lượng thực tế phải là số không âm!");
        return;
      }
    }
    setError("");
    // Tổng hợp dữ liệu
    const grouped = [];
    rows.forEach(row => {
      let found = grouped.find(g => g.productId === row.productId);
      if (!found) {
        grouped.push({ ...row, zones_id: [...row.zones_id], real: Number(row.real) });
      } else {
        found.zones_id = Array.from(new Set([...found.zones_id, ...row.zones_id]));
        found.real += Number(row.real);
        found.note = (found.note || "") + (row.note ? "; " + row.note : "");
      }
    });
    setGrouped(grouped);
    setConfirm(true);
  };

  const handleSubmit = () => {
    onSubmit(grouped);
    setConfirm(false);
    setRows([{ ...emptyRow }]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Tạo phiếu kiểm kê mới</DialogTitle>
      <DialogContent>
        {error && <Typography color="error">{error}</Typography>}
        {!confirm ? (
          <Box>
            {rows.map((row, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={2} mb={2}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Sản phẩm</InputLabel>
                  <Select
                    value={row.productId}
                    onChange={e => updateRow(idx, "productId", e.target.value)}
                    input={<OutlinedInput label="Sản phẩm" />}
                  >
                    <MenuItem value=""><em>Chọn sản phẩm</em></MenuItem>
                    {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Zone</InputLabel>
                  <Select
                    multiple
                    value={row.zones_id}
                    onChange={e => updateRow(idx, "zones_id", typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    input={<OutlinedInput label="Zone" />}
                    renderValue={selected => selected.map(zid => zones.find(z => z.id === zid)?.name || zid).join(', ')}
                  >
                    {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField
                  label="Thực tế"
                  type="number"
                  value={row.real}
                  onChange={e => updateRow(idx, "real", e.target.value)}
                  sx={{ width: 100 }}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="Ghi chú"
                  value={row.note}
                  onChange={e => updateRow(idx, "note", e.target.value)}
                  sx={{ width: 180 }}
                />
                <IconButton color="error" onClick={() => removeRow(idx)} disabled={rows.length === 1}>
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddCircleOutlineIcon />} onClick={addRow} sx={{ mb: 2 }}>Thêm dòng</Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6">Xác nhận bảng tổng hợp</Typography>
            <table style={{ width: '100%', marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Zone</th>
                  <th>Thực tế</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((row, idx) => (
                  <tr key={idx}>
                    <td>{products.find(p => p.id === row.productId)?.name || row.productId}</td>
                    <td>{row.zones_id.map(zid => zones.find(z => z.id === zid)?.name || zid).join(', ')}</td>
                    <td>{row.real}</td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!confirm ? (
          <>
            <Button onClick={onClose}>Hủy</Button>
            <Button variant="contained" onClick={handleValidateAndGroup}>Xác nhận</Button>
          </>
        ) : (
          <>
            <Button onClick={() => setConfirm(false)}>Quay lại</Button>
            <Button variant="contained" onClick={handleSubmit}>Gửi phiếu kiểm kê</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
} 