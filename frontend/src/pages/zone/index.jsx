import React, { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Snackbar, Alert } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import ZoneFormDialog from "../../components/zone/ZoneFormDialog";
import ZoneTable from "../../components/zone/ZoneTable";
import { getZones, createZone, updateZone, deleteZone } from "../../services/zoneService";
import { getAllStores } from "../../services/storeService";
import { userService } from "../../services/userService";

const Zone = () => {
    const zonesFetchedRef = useRef(false);
    const userStoresFetchedRef = useRef(false);

    const [zones, setZones] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, zoneName: "", zoneDescription: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredZoneId, setHoveredZoneId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [zoneToDelete, setZoneToDelete] = useState(null);
    const [zoneNameError, setZoneNameError] = useState("");
    const [zoneDescriptionError, setZoneDescriptionError] = useState("");
    const [storeIdError, setStoreIdError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });


    const [user, setUser] = useState(null);
    const [stores, setStores] = useState([]);


    // Frontend pagination
    const [page, setPage] = useState(0);
    // Thay đổi giá trị mặc định của rowsPerPage từ 12 thành 10
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        // Guard chống double-invoke trong React.StrictMode
        if (zonesFetchedRef.current) return;
        zonesFetchedRef.current = true;
        const fetch = async () => {
            try {
                const data = await getZones();

                const sortedZones = data.sort((a, b) => b.id - a.id);
                setZones(sortedZones);
            } catch (err) {
                console.error("Error fetching zones:", err);
                setError("Không thể tải danh sách khu vực");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    useEffect(() => {
        if (userStoresFetchedRef.current) return;
        userStoresFetchedRef.current = true;
        const fetchUserAndStores = async () => {
            try {
                const userData = await userService.getCurrentUser();

                setUser(userData);

                // ADMIN và OWNER đều có thể chọn cửa hàng
                // Kiểm tra cả trường hợp role là string và array
                const userRoles = Array.isArray(userData?.roles) ? userData.roles : [userData?.roles];


                if (userRoles.includes("OWNER") || userRoles.includes("ADMIN") || userRoles.includes("ROLE_OWNER") || userRoles.includes("ROLE_ADMIN")) {

                    const storeList = await getAllStores();

                    setStores(storeList);
                } else {

                    setStores([]);
                }
            } catch (err) {
                console.error("Error fetching user or stores:", err);
                setError("Không thể tải thông tin người dùng hoặc cửa hàng");
            }
        };
        fetchUserAndStores();
    }, []);

    const filteredZones = useMemo(() =>
        zones.filter(z =>
            z.zoneDescription.toLowerCase().includes(searchText.toLowerCase())
        ), [searchText, zones]);

    const handleOpenCreate = () => {
        // Kiểm tra cả trường hợp role là string và array
        const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
        const isAdminOrOwner = userRoles.includes('OWNER') || userRoles.includes('ADMIN') || userRoles.includes('ROLE_OWNER') || userRoles.includes('ROLE_ADMIN');

        const initialForm = {
            id: null,
            zoneName: "",
            zoneDescription: "",
            // STAFF thì cố định cửa hàng, ADMIN/OWNER thì để null để có thể chọn
            storeId: isAdminOrOwner ? null : user?.storeId
        };
        setForm(initialForm);
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (zone) => {
        setForm(zone);
        setEditMode(true);
        setOpenDialog(true);
    };
    const handleDelete = async () => {
        if (!zoneToDelete) return;
        try {
            await deleteZone(zoneToDelete.id);
            // Fetch lại toàn bộ danh sách zones và sắp xếp theo thứ tự mới nhất
            const refreshedZones = await getZones();
            const sortedZones = refreshedZones.sort((a, b) => b.id - a.id);
            setZones(sortedZones);
        } catch (err) {
            console.error("Error deleting zone:", err);
            setError("Không thể xóa khu vực");
        } finally {
            setConfirmOpen(false);
            setZoneToDelete(null);
        }
    };
    const handleDeleteRequest = (zone) => {
        setZoneToDelete(zone);
        setConfirmOpen(true);
    };

    const handleSubmit = async () => {
        setZoneNameError(""); // Reset lỗi
        setZoneDescriptionError(""); // Reset lỗi
        setStoreIdError(""); // Reset lỗi
        setSubmitting(true); // Bắt đầu loading



        if (!form.zoneName.trim()) {
            setZoneNameError("Tên khu vực là bắt buộc");
            setSubmitting(false);
            return;
        }
        if (form.zoneName.length > 100) {
            setZoneNameError("Tên khu vực không được vượt quá 100 ký tự");
            setSubmitting(false);
            return;
        }
        // Kiểm tra zoneDescription có vượt quá 1000 ký tự không
        if (form.zoneDescription && form.zoneDescription.length > 1000) {
            setZoneDescriptionError("Mô tả khu vực không được vượt quá 1000 ký tự");
            setSubmitting(false);
            return;
        }

        // Kiểm tra storeId cho ADMIN và OWNER
        const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
        const isAdminOrOwner = userRoles.includes('OWNER') || userRoles.includes('ADMIN') || userRoles.includes('ROLE_OWNER') || userRoles.includes('ROLE_ADMIN');



        if (isAdminOrOwner && !form.storeId) {
            setStoreIdError("Vui lòng chọn cửa hàng cho khu vực");
            setSubmitting(false);
            return;
        }

        // Chỉ kiểm tra trùng tên trong cùng một cửa hàng
        const targetStoreId = isAdminOrOwner ? form.storeId : user?.storeId;
        const norm = (s) => (s || '').trim().toLowerCase();
        const isDuplicate = zones.some(z =>
            norm(z.zoneName) === norm(form.zoneName) &&
            (z.storeId === targetStoreId || z.store?.id === targetStoreId) &&
            z.id !== form.id
        );
        if (isDuplicate) {
            setZoneNameError("Tên khu vực đã tồn tại");
            setSubmitting(false);
            return;
        }

        // Chuẩn bị dữ liệu để submit
        let submitForm = { ...form };
        if (!isAdminOrOwner) {
            submitForm.storeId = user?.storeId;
        }



        try {
            if (editMode) {
                await updateZone(form.id, submitForm);
                // Fetch lại toàn bộ danh sách zones và sắp xếp theo thứ tự mới nhất
                const refreshedZones = await getZones();
                const sortedZones = refreshedZones.sort((a, b) => b.id - a.id);
                setZones(sortedZones);
            } else {
                const created = await createZone(submitForm);
                // Thêm zone mới vào đầu danh sách thay vì cuối
                setZones(prev => [created, ...prev]);
            }
            setOpenDialog(false);
            setZoneNameError("");
            setZoneDescriptionError("");
            setStoreIdError("");
        } catch (err) {
            console.error("Error creating/updating zone:", err);
            // Hiển thị popup lỗi, giữ dialog mở
            setSnackbar({ open: true, message: `Không thể ${editMode ? "cập nhật" : "tạo"} khu vực`, severity: 'error' });
        } finally {
            setSubmitting(false); // Kết thúc loading
        }
    };

    if (loading) return <div>Đang tải...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-4 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Quản lý khu vực</h2>
                <div className="flex gap-3">
                    <TextField
                        size="small"
                        label="Tìm kiếm khu vực"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus />}>
                        Thêm
                    </Button>
                </div>
            </div>

            {/* Bảng Zone Table chiếm full chiều rộng */}
            <div className="flex">
                <div className="flex-grow min-w-[300px] max-w-full">
                    <ZoneTable
                        rows={filteredZones}
                        onEdit={handleOpenEdit}
                        onDelete={handleDeleteRequest}
                        hoveredZoneId={hoveredZoneId}
                        setHoveredZoneId={setHoveredZoneId}
                        page={page}
                        setPage={setPage}
                        rowsPerPage={rowsPerPage}
                        setRowsPerPage={setRowsPerPage}
                    />
                </div>
            </div>

            <ZoneFormDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                editMode={editMode}
                zoneNameError={zoneNameError}
                zoneDescriptionError={zoneDescriptionError}
                storeIdError={storeIdError}
                user={user}
                stores={stores}
                submitting={submitting}
            />
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    Bạn có chắc chắn muốn xóa khu vực này không?
                </DialogContent>
                <DialogActions>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

                    <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Xóa</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Zone;



