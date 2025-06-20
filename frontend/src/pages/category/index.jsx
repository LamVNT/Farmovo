import React, { useState, useMemo } from "react";
import { Button, TextField } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import CategoryFormDialog from "../../components/category/CategoryFormDialog.jsx";
import CategoryTable from "../../components/category/CategoryTable.jsx";

const initialCategories = [
    { id: 1, name: "Laptop", description: "Portable computers" },
    { id: 2, name: "Phone", description: "Smart mobile devices" },
    { id: 3, name: "Accessories", description: "Mouse, keyboards, etc." },
];

const Category = () => {
    const [categories, setCategories] = useState(initialCategories);
    const [searchText, setSearchText] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, name: "", description: "" });

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

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            setCategories(prev => prev.filter(cat => cat.id !== id));
        }
    };

    const handleSubmit = () => {
        if (!form.name.trim()) return;

        if (editMode) {
            setCategories(prev => prev.map(cat => (cat.id === form.id ? form : cat)));
        } else {
            const newId = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1;
            setCategories(prev => [...prev, { ...form, id: newId }]);
        }

        setOpenDialog(false);
    };

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
