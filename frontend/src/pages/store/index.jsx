import React, { useState, useEffect, useMemo } from "react";
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import StoreFormDialog from "../../components/store/StoreFormDialog";
import StoreTable from "../../components/store/StoreTable";
import { getAllStores, createStore, updateStore, deleteStore } from "../../services/storeService";
import { userService } from "../../services/userService";
import { toast } from "react-hot-toast";

const Store = () => {
    const [stores, setStores] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, name: "", address: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [storeToDelete, setStoreToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getAllStores();
                setStores(data);
                // Lấy user hiện tại
                const user = await userService.getCurrentUser();
                setCurrentUser(user);
            } catch (err) {
                setError("Failed to fetch stores");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filteredStores = useMemo(() =>
        stores.filter(store =>
            (store.storeName || "").toLowerCase().includes(searchText.toLowerCase())
        ), [searchText, stores]);

    const handleOpenCreate = () => {
        setForm({ name: "", address: "", description: "" }); // Không có id khi tạo mới
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (store) => {
        setForm({
            id: store.id,
            name: store.storeName,
            address: store.storeAddress,
            description: store.storeDescription || ""
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDeleteRequest = (store) => {
        setStoreToDelete(store);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!storeToDelete) return;
        try {
            await deleteStore(storeToDelete.id);
            setStores(prev => prev.filter(store => store.id !== storeToDelete.id));
            toast.success("Xóa cửa hàng thành công!");
        } catch {
            setError("Xóa cửa hàng thất bại");
            toast.error("Xóa cửa hàng thất bại!");
        } finally {
            setConfirmOpen(false);
            setStoreToDelete(null);
        }
    };

    const handleSubmit = async (formData) => {
        if (!formData.name.trim() || !formData.address.trim()) {
            toast.error("Vui lòng nhập đầy đủ tên và địa chỉ cửa hàng!");
            return;
        }
        try {
            if (editMode) {
                const updated = await updateStore(formData.id, formData);
                setStores(prev => prev.map(store => (store.id === formData.id ? updated : store)));
                toast.success("Cập nhật cửa hàng thành công!");
            } else {
                // Thêm created_by khi tạo mới
                const created = await createStore({ ...formData, created_by: currentUser?.id });
                setStores(prev => [...prev, created]);
                toast.success("Thêm cửa hàng mới thành công!");
            }
            setOpenDialog(false);
        } catch (err) {
            // Kiểm tra lỗi duplicate key
            const msg = err?.response?.data?.message || "";
            if (msg.includes("duplicate key") || msg.includes("already exists")) {
                toast.error("Tên cửa hàng đã tồn tại, vui lòng chọn tên khác!");
            } else {
                toast.error("Thao tác thất bại!");
            }
            setError(msg || "Thao tác thất bại");
        }
    };

    if (loading) return <div>Loading...</div>;
    // Đã bỏ render lỗi ra màn hình, chỉ dùng toast

    return (
        <div className="p-3 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Quản lý cửa hàng</h2>
                <div className="flex gap-3">
                    <TextField
                        size="small"
                        label="Tìm kiếm cửa hàng"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus />}>
                        Thêm mới
                    </Button>
                </div>
            </div>
            <StoreTable
                rows={filteredStores.map((row, idx) => ({ 
                    id: row.id, 
                    stt: idx + 1,
                    name: row.storeName,
                    address: row.storeAddress,
                    description: row.storeDescription
                }))}
                onEdit={handleOpenEdit}
                onDelete={id => handleDeleteRequest(stores.find(s => s.id === id))}
            />
            <StoreFormDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                editMode={editMode}
            />
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle fontWeight={700} fontSize={22} textAlign="center">Xác nhận xóa cửa hàng</DialogTitle>
                <DialogContent sx={{ textAlign: 'center', fontSize: 18, py: 2 }}>
                    Bạn có chắc chắn muốn xóa cửa hàng <b>{storeToDelete?.storeName}</b> không?<br/>
                    Hành động này không thể hoàn tác!
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button onClick={() => setConfirmOpen(false)} variant="outlined" color="primary">Hủy</Button>
                    <Button onClick={handleDelete} variant="contained" color="error">Xóa</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Store; 