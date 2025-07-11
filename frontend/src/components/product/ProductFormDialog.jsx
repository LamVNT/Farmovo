import {Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from '@mui/material';
import {useEffect, useState} from 'react';
import axios from 'axios';

const ProductFormDialog = ({open, onClose, onSubmit, form, setForm, editMode}) => {
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, storeRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/categories`, {withCredentials: true}),
                    axios.get(`${import.meta.env.VITE_API_URL}/admin/storeList`, {
                        withCredentials: true,
                        headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
                    }),
                ]);
                setCategories(catRes.data);
                setStores(storeRes.data.map(s => ({id: s.id, name: s.name})));
            } catch (e) {
                console.error('Lỗi tải dữ liệu:', e);
            }
        };

        if (open) fetchData();
    }, [open]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{editMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
            <DialogContent>
                {editMode && (
                    <TextField label="ID" fullWidth disabled margin="dense" value={form.id || 'N/A'}/>
                )}
                <TextField label="Tên sản phẩm" name="productName" fullWidth margin="dense"
                           value={form.productName || ''} onChange={handleChange} required/>
                <TextField label="Mô tả" name="productDescription" fullWidth margin="dense"
                           value={form.productDescription || ''} onChange={handleChange} multiline/>
                <TextField label="Số lượng" name="productQuantity" type="number" fullWidth margin="dense"
                           value={form.productQuantity || 0} onChange={handleChange}/>
                <Autocomplete
                    options={categories}
                    getOptionLabel={(opt) => opt.name}
                    value={categories.find(c => c.id === form.categoryId) || null}
                    onChange={(e, val) => setForm(prev => ({...prev, categoryId: val?.id || null}))}
                    renderInput={(params) => <TextField {...params} label="Danh mục" margin="dense" fullWidth/>}
                />
                <Autocomplete
                    options={stores}
                    getOptionLabel={(opt) => opt.name}
                    value={stores.find(s => s.id === form.storeId) || null}
                    onChange={(e, val) => setForm(prev => ({...prev, storeId: val?.id || null}))}
                    renderInput={(params) => <TextField {...params} label="Cửa hàng" margin="dense" fullWidth/>}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="contained" onClick={onSubmit}>
                    {editMode ? 'Cập nhật' : 'Thêm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductFormDialog;
