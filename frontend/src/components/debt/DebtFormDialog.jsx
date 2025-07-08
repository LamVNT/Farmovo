import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Autocomplete,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}`;
const CUSTOMER_API_URL = `${import.meta.env.VITE_API_URL}/customer`;

const DebtFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    const [customers, setCustomers] = useState([]);
    const [stores, setStores] = useState([]);
    const debtTypes = ['+', '-'];
    const sources = ['CUSTOMER', 'SUPPLIER'];

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(`${CUSTOMER_API_URL}/admin/customerList`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setCustomers(response.data.map(customer => ({
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address,
                })));
            } catch (error) {
                console.error('Không thể lấy danh sách khách hàng:', error);
            }
        };

        const fetchStores = async () => {
            try {
                const response = await axios.get(`${API_URL}/admin/storeList`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setStores(response.data.map(store => ({ id: store.id, name: store.name })));
            } catch (error) {
                console.error('Không thể lấy danh sách cửa hàng:', error);
            }
        };

        if (open) {
            fetchCustomers();
            fetchStores();
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCustomerChange = (event, value) => {
        setForm((prev) => ({
            ...prev,
            customerId: value ? value.id : null,
            customerName: value ? value.name : '',
            phone: value ? value.phone : '',
            address: value ? value.address : '',
        }));
    };

    const handleStoreChange = (event, value) => {
        setForm((prev) => ({
            ...prev,
            storeId: value ? value.id : null,
            storeName: value ? value.name : '',
        }));
    };

    const handleDebtTypeChange = (e) => {
        const value = e.target.value;
        setForm((prev) => {
            const newForm = { ...prev, debtType: value };
            if (prev.fromSource === 'CUSTOMER' && value === '-') {
                newForm.debtDescription = 'Trả lại tiền, còn nợ khách';
            } else if (prev.fromSource === 'CUSTOMER' && value === '+') {
                newForm.debtDescription = 'Khách mua thiếu, chưa trả';
            } else if (prev.fromSource === 'SUPPLIER' && value === '-') {
                newForm.debtDescription = 'Nhập hàng, chưa trả tiền';
            } else if (prev.fromSource === 'SUPPLIER' && value === '+') {
                newForm.debtDescription = 'Trả hàng lại, họ chưa hoàn tiền';
            }
            return newForm;
        });
    };

    const handleSourceChange = (e) => {
        const value = e.target.value;
        setForm((prev) => {
            const newForm = { ...prev, fromSource: value };
            if (value === 'CUSTOMER' && prev.debtType === '+') {
                newForm.debtDescription = 'Khách mua thiếu, chưa trả';
            } else if (value === 'CUSTOMER' && prev.debtType === '-') {
                newForm.debtDescription = 'Trả lại tiền, còn nợ khách';
            } else if (value === 'SUPPLIER' && prev.debtType === '-') {
                newForm.debtDescription = 'Nhập hàng, chưa trả tiền';
            } else if (value === 'SUPPLIER' && prev.debtType === '+') {
                newForm.debtDescription = 'Trả hàng lại, họ chưa hoàn tiền';
            }
            return newForm;
        });
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{editMode ? 'Chỉnh sửa công nợ' : 'Thêm công nợ'}</DialogTitle>
            <DialogContent>
                {editMode && (
                    <TextField
                        margin="dense"
                        label="ID"
                        fullWidth
                        value={form.id || 'N/A'}
                        disabled
                    />
                )}
                <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => option.name || ''}
                    value={customers.find((c) => c.id === form.customerId) || null}
                    onChange={handleCustomerChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            label="Khách hàng *"
                            fullWidth
                            required
                        />
                    )}
                />
                <TextField
                    margin="dense"
                    label="SĐT"
                    name="phone"
                    fullWidth
                    value={form.phone || ''}
                    disabled
                />
                <TextField
                    margin="dense"
                    label="Địa chỉ"
                    name="address"
                    fullWidth
                    value={form.address || ''}
                    disabled
                />
                <Autocomplete
                    options={stores}
                    getOptionLabel={(option) => option.name || ''}
                    value={stores.find((store) => store.id === form.storeId) || null}
                    onChange={handleStoreChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            label="Cửa hàng *"
                            fullWidth
                            required
                        />
                    )}
                />
                <TextField
                    autoFocus
                    margin="dense"
                    label="Số tiền công nợ"
                    name="debtAmount"
                    type="number"
                    fullWidth
                    value={form.debtAmount || ''}
                    onChange={handleChange}
                    required
                />
                <TextField
                    margin="dense"
                    label="Ngày công nợ"
                    name="debtDate"
                    type="datetime-local"
                    fullWidth
                    value={form.debtDate || ''}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth margin="dense">
                    <InputLabel>Kiểu công nợ *</InputLabel>
                    <Select
                        name="debtType"
                        value={form.debtType || '+'}
                        onChange={handleDebtTypeChange}
                        required
                    >
                        <MenuItem value="+">+</MenuItem>
                        <MenuItem value="-">-</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Nguồn *</InputLabel>
                    <Select
                        name="fromSource"
                        value={form.fromSource || 'CUSTOMER'}
                        onChange={handleSourceChange}
                        required
                    >
                        <MenuItem value="CUSTOMER">Khách hàng</MenuItem>
                        <MenuItem value="SUPPLIER">Nhà cung cấp</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    margin="dense"
                    label="Mô tả"
                    name="debtDescription"
                    fullWidth
                    value={form.debtDescription || ''}
                    onChange={handleChange}
                />
                <TextField
                    margin="dense"
                    label="Bằng chứng"
                    name="debtEvidences"
                    fullWidth
                    value={form.debtEvidences || ''}
                    onChange={handleChange}
                />
                <TextField
                    margin="dense"
                    label="Nguồn ID"
                    name="sourceId"
                    type="number"
                    fullWidth
                    value={form.sourceId || ''}
                    onChange={handleChange}
                />
                {editMode && (
                    <>
                        <TextField
                            margin="dense"
                            label="Ngày tạo"
                            fullWidth
                            value={form.createdAt ? new Date(form.createdAt).toLocaleString('vi-VN') : 'N/A'}
                            disabled
                        />
                        <TextField
                            margin="dense"
                            label="Ngày cập nhật"
                            fullWidth
                            value={form.updatedAt ? new Date(form.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                            disabled
                        />
                        <TextField
                            margin="dense"
                            label="Ngày xóa"
                            fullWidth
                            value={form.deletedAt ? new Date(form.deletedAt).toLocaleString('vi-VN') : 'N/A'}
                            disabled
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button onClick={onSubmit} variant="contained">
                    {editMode ? 'Cập nhật' : 'Thêm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtFormDialog;