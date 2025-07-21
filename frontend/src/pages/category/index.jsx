import React, {useState, useEffect, useMemo} from "react";
import {Button, TextField} from "@mui/material";
import {FaPlus} from "react-icons/fa6";
import CategoryFormDialog from "../../components/category/CategoryFormDialog";
import CategoryTable from "../../components/category/CategoryTable";
import {getCategories, createCategory, updateCategory, deleteCategory} from "../../services/categoryService";
import TablePagination from '@mui/material/TablePagination';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({id: null, name: "", description: ""});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({isOpen: false, title: "", content: "", onConfirm: null});
    const [snackbar, setSnackbar] = useState({isOpen: false, message: "", severity: "success"});

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch (err) {
                setError("Failed to fetch categories");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filteredCategories = useMemo(() =>
        categories.filter(cat =>
            cat.name.toLowerCase().includes(searchText.toLowerCase())
        ), [searchText, categories]);

    const handleOpenCreate = () => {
        setForm({id: null, name: "", description: ""});
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (category) => {
        setForm(category);
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: "Xác nhận xóa danh mục",
            content: "Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.",
            onConfirm: async () => {
                setConfirmDialog(prev => ({...prev, isOpen: false}));
                try {
                    await deleteCategory(id);
                    setCategories(prev => prev.filter(cat => cat.id !== id));
                    setSnackbar({isOpen: true, message: "Xóa danh mục thành công!", severity: "success"});
                } catch {
                    setSnackbar({isOpen: true, message: "Xóa danh mục thất bại!", severity: "error"});
                }
            }
        });
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) return;
        try {
            if (editMode) {
                const updated = await updateCategory(form.id, form);
                setCategories(prev => prev.map(cat => (cat.id === form.id ? updated : cat)));
            } else {
                const created = await createCategory(form);
                setCategories(prev => [...prev, created]);
            }
            setOpenDialog(false);
            setSnackbar({isOpen: true, message: `Danh mục ${editMode ? "cập nhật" : "tạo mới"} thành công!`, severity: "success"});
        } catch {
            setSnackbar({isOpen: true, message: `Danh mục ${editMode ? "cập nhật" : "tạo mới"} thất bại!`, severity: "error"});
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-5 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Category Management</h2>
                <div className="flex gap-3">
                    <TextField
                        size="small"
                        label="Search Category"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus/>}>
                        Add
                    </Button>
                </div>
            </div>

            <CategoryTable
                rows={filteredCategories}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            <CategoryFormDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                editMode={editMode}
            />

            <ConfirmDialog
                open={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                content={confirmDialog.content}
            />

            <SnackbarAlert
                open={snackbar.isOpen}
                onClose={() => setSnackbar(prev => ({...prev, isOpen: false}))}
                message={snackbar.message}
                severity={snackbar.severity}
            />
        </div>
    );
};

export default Category;
