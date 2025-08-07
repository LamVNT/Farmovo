import {useState, useEffect, useMemo} from 'react';
import {TextField, Button, Select, MenuItem, FormControl, InputLabel} from '@mui/material';
import {FaPlus} from 'react-icons/fa6';
import UserTable from '../../components/user/UserTable';
import UserFormDialog from '../../components/user/UserFormDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import {userService} from '../../services/userService';
import useUsers from '../../hooks/useUsers';
import toast from 'react-hot-toast';

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
        createdBy: 1,
        createdAt: '',
        updatedAt: '',
        storeName: '',
        roles: [],
        email: '',
    });
    // error and loading already in hook
    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
    const [userToCreate, setUserToCreate] = useState(null);
    const [stores, setStores] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch current user info
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await userService.getCurrentUser();
                setCurrentUser(response);
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };
        fetchCurrentUser();
    }, []);

    // Fetch stores for confirmation dialog
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/storeList`, {
                    credentials: 'include',
                });
                const data = await response.json();
                setStores(data);
            } catch (error) {
                console.error('Error fetching stores:', error);
            }
        };
        fetchStores();
    }, []);

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
            createdBy: 1,
            createdAt: '',
            updatedAt: '',
            storeName: '',
            roles: [], // Reset roles khi tạo mới
            email: '',
        });
        setFormErrors({}); // Clear errors when opening create dialog
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = async (user) => {
        // Nếu là admin, lấy thông tin user với password
        if (currentUser && currentUser.roles && currentUser.roles.includes('ROLE_ADMIN')) {
            try {
                const userWithPassword = await userService.getUserByIdWithPassword(user.id);
                setForm({
                    id: userWithPassword.id,
                    fullName: userWithPassword.fullName,
                    username: userWithPassword.username,
                    password: userWithPassword.password || '',
                    status: userWithPassword.status,
                    storeId: userWithPassword.storeId || 1,
                    createdBy: userWithPassword.createdBy || 1,
                    createdAt: userWithPassword.createdAt || '',
                    updatedAt: userWithPassword.updatedAt || '',
                    storeName: userWithPassword.storeName || '',
                    roles: userWithPassword.roles || [],
                    email: userWithPassword.email || '',
                });
            } catch (error) {
                console.error('Error fetching user with password:', error);
                // Fallback to original user data
                setForm({
                    id: user.id,
                    fullName: user.fullName,
                    username: user.username,
                    password: '',
                    status: user.status,
                    storeId: user.storeId || 1,
                    createdBy: user.createdBy || 1,
                    createdAt: user.createdAt || '',
                    updatedAt: user.updatedAt || '',
                    storeName: user.storeName || '',
                    roles: user.roles || [],
                    email: user.email || '',
                });
            }
        } else {
            // Staff không thể xem password
            setForm({
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                password: '',
                status: user.status,
                storeId: user.storeId || 1,
                createdBy: user.createdBy || 1,
                createdAt: user.createdAt || '',
                updatedAt: user.updatedAt || '',
                storeName: user.storeName || '',
                roles: user.roles || [],
                email: user.email || '',
            });
        }
        setFormErrors({}); // Clear errors when opening edit dialog
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setFormErrors({}); // Clear errors when closing dialog
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
            toast.success('Xóa người dùng thành công!');
        } catch (err) {
            toast.error(`Lỗi xóa người dùng: ${err.message}`);
        } finally {
            setConfirmOpen(false);
            setUserToDelete(null);
        }
    };

    const handleSubmit = async () => {
        // Clear previous errors
        setFormErrors({});
        
        // Validation
        const errors = {};
        
        if (!form.fullName || form.fullName.trim() === '') {
            errors.fullName = 'Họ tên không được để trống';
        }
        // Chỉ validate username và password khi tạo mới
        if (!editMode) {
            if (!form.username || form.username.trim() === '') {
                errors.username = 'Tên đăng nhập không được để trống';
            }
            // Chỉ validate password cho admin hoặc khi tạo mới
            const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes('ROLE_ADMIN');
            if (isAdmin && (!form.password || form.password.trim() === '')) {
                errors.password = 'Mật khẩu không được để trống khi tạo mới';
            }
        }
        if (!form.storeId) {
            errors.storeId = 'Vui lòng chọn cửa hàng';
        }
        if (!form.roles || form.roles.length === 0) {
            errors.roles = 'Vui lòng chọn role';
        }
        
        // Email validation
        if (form.email && form.email.trim() !== '') {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(form.email.trim())) {
                errors.email = 'Email không đúng định dạng';
            }
        }
        
        // If there are validation errors, show them and return
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        console.log('Sending userData:', form);
        const userData = {
            fullName: form.fullName.trim(),
            status: form.status,
            storeId: form.storeId,
            roles: form.roles || [], // Gửi roles khi tạo mới hoặc cập nhật
            email: form.email ? form.email.trim() : null,
        };

        // Chỉ gửi username và password khi tạo mới
        if (!editMode) {
            userData.username = form.username.trim();
        }

        // Only include password if it's provided (for create mode)
        if (!editMode) {
            userData.password = form.password; // Required for new users
        }
        // Không cho phép thay đổi username và password khi edit

        if (editMode) {
            // For edit mode, proceed directly
            try {
                const updatedUser = await userService.updateUser(form.id, userData);
                            // Refresh danh sách sau khi cập nhật
            fetchUsers({
                page: page,
                size: rowsPerPage,
                username: searchText || undefined,
            });
            toast.success('Cập nhật người dùng thành công!');
            handleClose();
                    } catch (error) {
            console.error('Lỗi:', error.message);
            toast.error(`Lỗi: ${error.message}`);
        }
        } else {
            // For create mode, show confirmation dialog
            setUserToCreate(userData);
            setCreateConfirmOpen(true);
        }
    };

    const sendLoginInfoEmail = async (userData) => {
        if (!userData.email || userData.email.trim() === '') {
            return { success: true, message: 'Không có email để gửi' };
        }
        
        try {
            const storeName = stores.find(s => s.id === userData.storeId)?.storeName || 'N/A';
            const emailData = {
                email: userData.email.trim(),
                username: userData.username,
                password: userData.password,
                fullName: userData.fullName,
                storeName: storeName
            };
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/send-login-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(emailData),
            });
            
            if (response.ok) {
                console.log('Email thông tin đăng nhập đã được gửi thành công!');
                return { success: true, message: 'Email thông tin đăng nhập đã được gửi thành công!' };
            } else {
                const errorData = await response.text();
                console.error('Lỗi khi gửi email:', errorData);
                return { success: false, message: `Lỗi khi gửi email: ${errorData}` };
            }
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            return { success: false, message: `Lỗi kết nối khi gửi email: ${error.message}` };
        }
    };

    const handleConfirmCreate = async () => {
        if (!userToCreate) return;
        try {
            const newUser = await userService.createUser(userToCreate);
            
            // Gửi email thông tin đăng nhập nếu có email
            const emailResult = await sendLoginInfoEmail(userToCreate);
            
            // Refresh danh sách sau khi tạo mới và reset về trang đầu
            fetchUsers({
                page: 0, // Reset về trang đầu
                size: rowsPerPage,
                username: searchText || undefined,
            });
            
            // Hiển thị thông báo kết quả
            if (emailResult.success) {
                toast.success('Tạo người dùng thành công!');
            } else {
                toast.success('Tạo người dùng thành công!');
                toast.error(`Lưu ý: ${emailResult.message}`);
            }
            
            handleClose();
        } catch (error) {
            console.error('Lỗi:', error.message);
            toast.error(`Lỗi tạo người dùng: ${error.message}`);
        } finally {
            setCreateConfirmOpen(false);
            setUserToCreate(null);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const updatedUser = await userService.toggleUserStatus(id);
            // Refresh danh sách sau khi toggle status
            fetchUsers({
                page: page,
                size: rowsPerPage,
                username: searchText || undefined,
            });
            toast.success('Cập nhật trạng thái người dùng thành công!');
        } catch (err) {
            console.error('Lỗi toggle status:', err.message);
            toast.error(`Lỗi: ${err.message}`);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const updatedUser = await userService.updateUserStatus(id, status);
            // Refresh danh sách sau khi update status
            fetchUsers({
                page: page,
                size: rowsPerPage,
                username: searchText || undefined,
            });
            toast.success('Cập nhật trạng thái người dùng thành công!');
        } catch (err) {
            console.error('Lỗi update status:', err.message);
            toast.error(`Lỗi: ${err.message}`);
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
                errors={formErrors}
                currentUserRole={currentUser?.roles}
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
            <ConfirmDialog
                open={createConfirmOpen}
                onClose={() => setCreateConfirmOpen(false)}
                onConfirm={handleConfirmCreate}
                title="Xác nhận tạo người dùng"
                content={`Bạn có chắc chắn muốn tạo người dùng mới với thông tin sau?\n\n📋 Thông tin người dùng:\n• Họ tên: ${userToCreate?.fullName}\n• Tên đăng nhập: ${userToCreate?.username} (tự động tạo)\n• Email: ${userToCreate?.email || 'Không có'}\n• Cửa hàng: ${stores.find(s => s.id === userToCreate?.storeId)?.storeName || 'N/A'}\n• Vai trò: ${userToCreate?.roles?.join(', ')}\n• Trạng thái: ${userToCreate?.status ? 'Hoạt động' : 'Không hoạt động'}${userToCreate?.email ? '\n\n📧 Thông tin đăng nhập sẽ được gửi đến email: ' + userToCreate.email : '\n\n⚠️ Không có email để gửi thông tin đăng nhập'}`}
                confirmText="Tạo người dùng"
                cancelText="Hủy bỏ"
            />
        </div>
    );
};

export default UserManagement;