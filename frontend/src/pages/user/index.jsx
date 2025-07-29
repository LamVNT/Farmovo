import {useState, useEffect, useMemo} from 'react';
import {TextField, Button, Select, MenuItem, FormControl, InputLabel} from '@mui/material';
import {FaPlus} from 'react-icons/fa6';
import UserTable from '../../components/user/UserTable';
import UserFormDialog from '../../components/user/UserFormDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import {userService} from '../../services/userService';
import useUsers from '../../hooks/useUsers';

const UserManagement = () => {
    const {
        users,
        page,
        size: rowsPerPage,
        totalPages,
        totalItems,
        setPage,
        setSize: setRowsPerPage,
        fetchUsers,
        loading,
        error,
    } = useUsers();

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
        roles: [],
        email: '',
    });
    // error and loading already in hook
    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Fetch users whenever searchText, page, rowsPerPage changes
    useEffect(() => {
        const params = {
            page: page,
            size: rowsPerPage,
            username: searchText || undefined,
        };
        fetchUsers(params);
    }, [searchText, page, rowsPerPage]);

    const filteredUsers = users; // backend already filtered

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
            roles: [], // Reset roles khi tạo mới
            email: '',
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
            storeId: user.storeId || 1, // Đảm bảo storeId từ dữ liệu
            createBy: user.createBy || 1,
            createAt: user.createAt || '',
            updateAt: user.updateAt || '',
            storeName: user.storeName || '',
            roles: user.roles || [], // Lấy roles từ dữ liệu
            email: user.email || '',
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        // Reset form nếu cần
        setForm((prev) => ({
            ...prev,
            password: '', // Reset password sau khi đóng
        }));
    };

    const handleDeleteClick = (id) => {
        setUserToDelete(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await userService.deleteUser(userToDelete);
            fetchUsers({ page, size: rowsPerPage, username: searchText || undefined });
            // setError(null); // This line was removed as per the edit hint
        } catch (err) {
            // setError(err.message); // This line was removed as per the edit hint
        } finally {
            setConfirmOpen(false);
            setUserToDelete(null);
        }
    };

    const handleSubmit = async () => {
        console.log('Sending userData:', form);
        const userData = {
            fullName: form.fullName || undefined,
            username: form.username || undefined,
            password: form.password || undefined, // Bắt buộc khi tạo mới
            status: form.status,
            storeId: form.storeId,
            roles: form.roles || [], // Gửi roles khi tạo mới hoặc cập nhật
            email: form.email || undefined,
        };
        try {
            if (editMode) {
                const updatedUser = await userService.updateUser(form.id, userData);
                // Giữ nguyên thứ tự: thay thế phần tử đang chỉnh sửa
                // setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))); // This line was removed as per the edit hint
            } else {
                const newUser = await userService.createUser(userData);
                // Thêm vào cuối danh sách (hoặc đầu, tuỳ yêu cầu UI). Giữ thứ tự cũ với phần đã có.
                // setUsers((prev) => [...prev, newUser]); // This line was removed as per the edit hint
            }
            handleClose();
            // setError(null); // This line was removed as per the edit hint
        } catch (error) {
            console.error('Lỗi:', error.message);
            // setError(error.message); // This line was removed as per the edit hint
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const updatedUser = await userService.toggleUserStatus(id);
            // setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u))); // This line was removed as per the edit hint
            // setError(null); // This line was removed as per the edit hint
        } catch (err) {
            // setError(err.message); // This line was removed as per the edit hint
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const updatedUser = await userService.updateUserStatus(id, status);
            // setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u))); // This line was removed as per the edit hint
            // setError(null); // This line was removed as per the edit hint
        } catch (err) {
            // setError(err.message); // This line was removed as per the edit hint
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
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus/>}>
                        Thêm
                    </Button>
                </div>
            </div>

            {error && <p style={{color: 'red'}}>{error}</p>}
            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <UserTable
                    users={filteredUsers}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteClick}
                    onToggleStatus={handleToggleStatus}
                    page={page}
                    pageCount={totalPages}
                    onPageChange={setPage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e)=>setRowsPerPage(parseInt(e.target.value,10))}
                    totalCount={totalItems}
                />
            )}

            <UserFormDialog
                open={openDialog}
                onClose={handleClose} // Sử dụng handleClose đã định nghĩa
                onSubmit={handleSubmit}
                form={form}
                setForm={setForm}
                editMode={editMode}
            />
            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Xác nhận xóa"
                content="Bạn có chắc chắn muốn xóa người dùng này?"
                confirmText="Xóa"
                cancelText="Hủy"
            />
        </div>
    );
};

export default UserManagement;