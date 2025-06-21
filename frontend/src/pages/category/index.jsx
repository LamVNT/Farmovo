// pages/Category/index.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Button, TextField } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import CategoryFormDialog from "../../components/category/CategoryFormDialog";
import CategoryTable from "../../components/category/CategoryTable";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../services/categoryService";

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, name: "", description: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        setForm({ id: null, name: "", description: "" });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (category) => {
        setForm(category);
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await deleteCategory(id);
                setCategories(prev => prev.filter(cat => cat.id !== id));
            } catch {
                setError("Failed to delete category");
            }
        }
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
        } catch {
            setError(`Failed to ${editMode ? "update" : "create"} category`);
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
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus />}>
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
        </div>
    );
};

export default Category;
