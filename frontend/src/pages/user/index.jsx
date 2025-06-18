import React, { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
    Button, IconButton, TextField, Dialog, DialogActions,
    DialogContent, DialogTitle
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { FaPlus } from "react-icons/fa6";

const initialUsers = [
    { id: 1, name: "Alice", email: "alice@example.com", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@example.com", role: "User" },
    { id: 3, name: "Charlie", email: "charlie@example.com", role: "Moderator" },
];

const UserManagement = () => {
    const [users, setUsers] = useState(initialUsers);
    const [searchText, setSearchText] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, name: "", email: "", role: "" });

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [searchText, users]);

    const handleOpenCreate = () => {
        setForm({ id: null, name: "", email: "", role: "" });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (user) => {
        setForm(user);
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    const handleSubmit = () => {
        if (!form.name.trim() || !form.email.trim()) return;

        if (editMode) {
            setUsers(prev => prev.map(u => (u.id === form.id ? form : u)));
        } else {
            const newId = Math.max(...users.map(u => u.id)) + 1;
            setUsers(prev => [...prev, { ...form, id: newId }]);
        }

        setOpenDialog(false);
    };

    const userColumns = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "email", headerName: "Email", flex: 1.5 },
        { field: "role", headerName: "Role", flex: 1 },
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
                <h2 className="text-xl font-semibold">User Management</h2>
                <div className="flex gap-3">
                    <TextField
                        size="small"
                        label="Search"
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
                    rows={filteredUsers}
                    columns={userColumns}
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

            {/* Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{editMode ? "Edit User" : "Create User"}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        fullWidth
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        fullWidth
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Role"
                        fullWidth
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
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

export default UserManagement;
