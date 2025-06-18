import React, { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
    Button, IconButton, TextField, Dialog, DialogActions,
    DialogContent, DialogTitle
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { FaPlus } from "react-icons/fa6";

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

    const filteredCategories = useMemo(() => {
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [searchText, categories]);

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
            const newId = Math.max(...categories.map(c => c.id)) + 1;
            setCategories(prev => [...prev, { ...form, id: newId }]);
        }

        setOpenDialog(false);
    };

    const categoryColumns = [
        { field: "name", headerName: "Category Name", flex: 1 },
        { field: "description", headerName: "Description", flex: 2 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(params.id)}>
                        <DeleteIcon color="error" />
                    </IconButton>
                </>
            ),
        },
    ];

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

            <div style={{ height: 400 }}>
                <DataGrid
                    rows={filteredCategories}
                    columns={categoryColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    checkboxSelection
                    disableSelectionOnClick
                    sx={{
                        borderRadius: 2,
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'bold',
                        },
                    }}
                />
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{editMode ? "Edit Category" : "Create Category"}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Category Name"
                        fullWidth
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editMode ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Category;
