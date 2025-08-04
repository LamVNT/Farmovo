import React, { useState, useEffect, useMemo } from "react";
import { Button, TextField, Switch, FormControlLabel } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import CategoryFormDialog from "../../components/category/CategoryFormDialog";
import CategoryTable from "../../components/category/CategoryTable";
import { debounce } from "lodash";
import TablePagination from '@mui/material/TablePagination';
import ConfirmDialog from "../../components/ConfirmDialog";
import SnackbarAlert from "../../components/SnackbarAlert";
import useCategory from "../../hooks/useCategory";
import CircularProgress from "@mui/material/CircularProgress";

const Category = () => {
    const {
        categories,
        allCategories,
        total,
        loading,
        error,
        page,
        setPage,
        size,
        setSize,
        searchText,
        setSearchText,
        handleCreate,
        handleUpdate,
        handleDelete,
        useSmartSearch,
        setUseSmartSearch
    } = useCategory();

    const [inputValue, setInputValue] = useState(searchText);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, name: "", description: "" });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", content: "", onConfirm: null });
    const [snackbar, setSnackbar] = useState({ isOpen: false, message: "", severity: "success" });

    // Đồng bộ inputValue với searchText chỉ khi searchText thay đổi từ bên ngoài
    useEffect(() => {
        setInputValue(searchText);
    }, [searchText]);

    // Debounce tìm kiếm
    const debouncedSetSearch = useMemo(() => debounce((value) => {
        setPage(0);
        setSearchText(value);
    }, 400), [setSearchText, setPage]);

    useEffect(() => {
        return () => {
            debouncedSetSearch.cancel();
        };
    }, [debouncedSetSearch]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        debouncedSetSearch(value);
    };

    // Logic filter FE nếu dùng smart search
    const filteredCategories = useMemo(() => {
        if (useSmartSearch && total <= 100) {
            return allCategories.filter(cat => (cat.name || "").toLowerCase().includes(inputValue.toLowerCase()));
        }
        return categories;
    }, [useSmartSearch, total, allCategories, categories, inputValue]);

    // Phân trang FE nếu dùng smart search
    const pagedCategories = useMemo(() => {
        if (useSmartSearch && total <= 100) {
            const start = page * size;
            return filteredCategories.slice(start, start + size);
        }
        return filteredCategories;
    }, [useSmartSearch, total, filteredCategories, page, size]);

    // Số lượng bản ghi cho TablePagination
    const paginationCount = useMemo(() => {
        if (useSmartSearch && total <= 100) {
            return filteredCategories.length;
        }
        return total;
    }, [useSmartSearch, total, filteredCategories]);

    const handleOpenCreate = () => {
        setForm({ id: null, name: "", description: "" });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (category) => {
        setForm(category);
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDeleteCategory = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: "Xác nhận xóa danh mục",
            content: "Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.",
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    await handleDelete(id);
                    setSnackbar({ isOpen: true, message: "Xóa danh mục thành công!", severity: "success" });
                } catch (err) {
                    setSnackbar({ isOpen: true, message: err.message || "Xóa danh mục thất bại!", severity: "error" });
                }
            }
        });
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            setSnackbar({ isOpen: true, message: "Tên danh mục không được để trống!", severity: "error" });
            return;
        }
        try {
            if (editMode) {
                await handleUpdate(form.id, form);
                setSnackbar({ isOpen: true, message: "Cập nhật danh mục thành công!", severity: "success" });
            } else {
                await handleCreate(form);
                setSnackbar({ isOpen: true, message: "Tạo mới danh mục thành công!", severity: "success" });
            }
            setOpenDialog(false);
        } catch (err) {
            let msg = err.message || `Danh mục ${editMode ? "cập nhật" : "tạo mới"} thất bại!`;
            if (msg.includes("Tên danh mục đã tồn tại")) {
                msg = "Tên danh mục đã tồn tại!";
            }
            setSnackbar({ isOpen: true, message: msg, severity: "error" });
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-5 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Category Management</h2>
                <div className="flex gap-3 items-center">
                    <TextField
                        size="small"
                        label="Search Category"
                        value={inputValue}
                        onChange={handleSearchChange}
                        InputProps={{
                            endAdornment: loading ? <CircularProgress size={18} /> : null
                        }}
                    />
                    <FormControlLabel
                        control={<Switch checked={useSmartSearch} onChange={e => setUseSmartSearch(e.target.checked)} />}
                        label="Tìm kiếm thông minh (FE)"
                    />
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus />}>
                        Add
                    </Button>
                </div>
            </div>

            <CategoryTable
                rows={pagedCategories}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteCategory}
            />
            <TablePagination
                component="div"
                count={paginationCount}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={size}
                onRowsPerPageChange={e => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 20, 50, 100]}
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
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                content={confirmDialog.content}
            />

            <SnackbarAlert
                open={snackbar.isOpen}
                onClose={() => setSnackbar(prev => ({ ...prev, isOpen: false }))}
                message={snackbar.message}
                severity={snackbar.severity}
            />
        </div>
    );
};

export default Category;
