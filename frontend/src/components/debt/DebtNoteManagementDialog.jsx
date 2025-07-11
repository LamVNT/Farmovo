import React, {useEffect, useState} from 'react';
import {
    Autocomplete,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/stores`;
const CUSTOMER_API_URL = `${import.meta.env.VITE_API_URL}/customers`;

const DebtNoteManagementDialog = ({open, onClose, onSubmit, form, setForm, editMode}) => {
    const [customers, setCustomers] = useState([]);
    const [stores, setStores] = useState([]);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(`${CUSTOMER_API_URL}/admin/customerList`, {
                    withCredentials: true,
                    headers: {Authorization: `Bearer ${localStorage.getItem('token')}`},
                });
                setCustomers(response.data.map((customer) => ({
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
                    headers: {Authorization: `Bearer ${localStorage.getItem('token')}`},
                });
                setStores(response.data.map((store) => ({id: store.id, name: store.name})));
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
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
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

    const handleSourceChange = (e) => {
        const value = e.target.value;
        setForm((prev) => {
            const newForm = {...prev, fromSource: value, sourceId: value === 'MANUAL' ? null : prev.sourceId};
            if (value === 'SALE') {
                newForm.debtDescription = prev.debtAmount >= 0 ? 'Phát sinh nợ khi bán hàng mà chưa trả đủ' : 'Trả lại tiền, còn nợ khách';
            } else if (value === 'PURCHASE') {
                newForm.debtDescription = prev.debtAmount <= 0 ? 'Bạn nợ nhà cung cấp' : 'Trả hàng lại, họ chưa hoàn tiền';
            } else if (value === 'MANUAL') {
                newForm.debtDescription = 'Nhập công nợ thủ công';
            }
            return newForm;
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{backgroundColor: '#f5f5f5', fontWeight: 'bold'}}>
                {editMode ? 'Chỉnh sửa phiếu nợ' : 'Thêm phiếu nợ'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{mt: 1}}>
                    {editMode && (
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                margin="dense"
                                label="ID"
                                value={form.id || 'N/A'}
                                disabled
                                variant="outlined"
                            />
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <Autocomplete
                            options={customers}
                            getOptionLabel={(option) => option.name || ''}
                            value={customers.find((c) => c.id === form.customerId) || null}
                            onChange={handleCustomerChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    margin="dense"
                                    label="Khách hàng *"
                                    required
                                    variant="outlined"
                                />
                            )}
                            disabled={editMode}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="SĐT"
                            name="phone"
                            value={form.phone || ''}
                            disabled
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Địa chỉ"
                            name="address"
                            value={form.address || ''}
                            disabled
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={stores}
                            getOptionLabel={(option) => option.name || ''}
                            value={stores.find((store) => store.id === form.storeId) || null}
                            onChange={handleStoreChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    margin="dense"
                                    label="Cửa hàng *"
                                    required
                                    variant="outlined"
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Số tiền công nợ"
                            name="debtAmount"
                            type="number"
                            value={form.debtAmount || ''}
                            onChange={handleChange}
                            required
                            variant="outlined"
                            placeholder="Nhập số tiền (âm hoặc dương)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Ngày công nợ"
                            name="debtDate"
                            type="datetime-local"
                            value={form.debtDate ? form.debtDate.slice(0, 16) : ''}
                            onChange={handleChange}
                            required
                            InputLabelProps={{shrink: true}}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense" variant="outlined">
                            <InputLabel>Nguồn *</InputLabel>
                            <Select
                                name="fromSource"
                                value={form.fromSource || 'MANUAL'}
                                onChange={handleSourceChange}
                                label="Nguồn *"
                                required
                            >
                                <MenuItem value="MANUAL">Nhập thủ công</MenuItem>
                                <MenuItem value="SALE">Hóa đơn bán</MenuItem>
                                <MenuItem value="PURCHASE">Hóa đơn mua</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Mô tả"
                            name="debtDescription"
                            value={form.debtDescription || ''}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Bằng chứng"
                            name="debtEvidences"
                            value={form.debtEvidences || ''}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="ID Nguồn"
                            name="sourceId"
                            type="number"
                            value={form.sourceId || ''}
                            onChange={handleChange}
                            disabled={form.fromSource === 'MANUAL'}
                            variant="outlined"
                        />
                    </Grid>
                    {editMode && (
                        <>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    margin="dense"
                                    label="Ngày tạo"
                                    value={form.createdAt ? new Date(form.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                    disabled
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    margin="dense"
                                    label="Ngày cập nhật"
                                    value={form.updatedAt ? new Date(form.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                                    disabled
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    margin="dense"
                                    label="Ngày xóa"
                                    value={form.deletedAt ? new Date(form.deletedAt).toLocaleString('vi-VN') : 'N/A'}
                                    disabled
                                    variant="outlined"
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions sx={{p: 2, backgroundColor: '#f5f5f5'}}>
                <Button onClick={onClose} variant="outlined" color="secondary">
                    Hủy
                </Button>
                <Button onClick={onSubmit} variant="contained" color="primary">
                    {editMode ? 'Cập nhật' : 'Thêm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtNoteManagementDialog;