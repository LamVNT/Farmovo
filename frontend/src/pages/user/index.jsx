import { useState, useEffect, useMemo } from 'react';
import { TextField, Button } from '@mui/material';
import { FaPlus } from 'react-icons/fa6';
import UserTable from '../../components/user/UserTable';
import UserFormDialog from '../../components/user/UserFormDialog';
import userService from '../../services/userService';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        id: null,
        fullName: '',
        username: '',
        password: '',
        status: true,
        storeId: 1,
        createBy: 1,
        createAt: '',
        updateAt: '',
        storeName: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await userService.getAllUsers();
                setUsers(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(
            (user) =>
                user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                user.username.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [searchText, users]);

    const handleOpenCreate = () => {
        setForm({
            id: null,
            fullName: '',
            username: '',
            password: '',
            status: true,
            storeId: 1,
            createBy: 1,
            createAt: '',
            updateAt: '',
            storeName: '',
        });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (user) => {
        setForm({
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            password: '',
            status: user.status,
            storeId: 1,
            createBy: 1,
            createAt: user.createAt || '',
            updateAt: user.updateAt || '',
            storeName: user.storeName || '',
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            try {
                await userService.deleteUser(id);
                setUsers((prev) => prev.filter((u) => u.id !== id));
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleSubmit = async () => {
        if (!form.fullName.trim() || !form.username.trim() || (!editMode && !form.password.trim())) {
            setError('Vui lòng điền đầy đủ các trường bắt buộc');
            return;
        }

        try {
            if (editMode) {
                const updatedUser = await userService.updateUser(form.id, {
                    fullName: form.fullName,
                    username: form.username,
                    password: form.password || undefined,
                    status: form.status,
                    storeId: form.storeId,
                    createBy: form.createBy,
                });
                setUsers((prev) => prev.map((u) => (u.id === form.id ? updatedUser : u)));
            } else {
                const newUser = await userService.createUser({
                    fullName: form.fullName,
                    username: form.username,
                    password: form.password,
                    status: form.status,
                    storeId: form.storeId,
                    createBy: form.createBy,
                });
                setUsers((prev) => [...prev, newUser]);
            }
            setOpenDialog(false);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const updatedUser = await userService.toggleUserStatus(id);
            setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const updatedUser = await userService.updateUserStatus(id, status);
            setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="p-5 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Quản lý người dùng</h2>
                <div className="flex gap-3">
                    <TextField
                        size="small"
                        label="Tìm kiếm"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus />}>
                        Thêm
                    </Button>
                </div>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <UserTable
                    users={filteredUsers}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onUpdateStatus={handleUpdateStatus}
                />
            )}

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
