import React, { useState, useMemo } from "react";
import { TextField, Button } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import UserTable from "../../components/user/UserTable";
import UserFormDialog from "../../components/user/UserFormDialog";

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

            <UserTable users={filteredUsers} onEdit={handleOpenEdit} onDelete={handleDelete} />

            <UserFormDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onSubmit={handleSubmit}
                form={form}
                setForm={setForm}
                editMode={editMode}
            />
        </div>
    );
};

export default UserManagement;
