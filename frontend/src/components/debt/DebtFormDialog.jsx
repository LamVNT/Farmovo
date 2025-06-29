import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Autocomplete,
} from '@mui/material';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/stores`;
const CUSTOMER_API_URL = `${import.meta.env.VITE_API_URL}/customers`;

const DebtFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    const [customers, setCustomers] = useState([]);
    const [stores, setStores] = useState([]);
    const [debtTypes] = useState(['+', '-']);
    const [sources] = useState(['CUSTOMER', 'SUPPLIER']);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(`${CUSTOMER_API_URL}/admin/customerList`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setCustomers(response.data.map(customer => ({ id: customer.id, name: customer.fullName })));
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
        }));
    };

    const handleStoreChange = (event, value) => {
        setForm((prev) => ({
            ...prev,
            storeId: value ? value.id : null,
            storeName: value ? value.name : '',
        }));
    };

    const handleDebtTypeChange = (event, value) => {
        setForm((prev) => ({
            ...prev,
            debtType: value || '+',
        }));
    };

    const handleSourceChange = (event, value) => {
        setForm((prev) => ({
            ...prev,
            fromSource: value || 'CUSTOMER',
        }));
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
                    value={customers.find((customer) => customer.id === form.customerId) || null}
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
                <Autocomplete
                    options={debtTypes}
                    getOptionLabel={(option) => option}
                    value={form.debtType || '+'}
                    onChange={handleDebtTypeChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            label="Loại công nợ *"
                            fullWidth
                            required
                        />
                    )}
                />
                <Autocomplete
                    options={sources}
                    getOptionLabel={(option) => option}
                    value={form.fromSource || 'CUSTOMER'}
                    onChange={handleSourceChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            label="Nguồn *"
                            fullWidth
                            required
                        />
                    )}
                />
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