import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import ZoneFormDialog from "../../components/zone/ZoneFormDialog";
import ZoneTable from "../../components/zone/ZoneTable";
import { getZones, createZone, updateZone, deleteZone } from "../../services/zoneService";
import { getAllStores } from "../../services/storeService";
import { userService } from "../../services/userService";

const Zone = () => {
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

    const [user, setUser] = useState(null);
    const [stores, setStores] = useState([]);


    // Frontend pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(12);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getZones();
                setZones(data);
            } catch (err) {
                setError("Failed to fetch zones");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    useEffect(() => {
        const fetchUserAndStores = async () => {
            try {
                const userData = await userService.getCurrentUser();
                setUser(userData);
                if (userData.roles?.includes("OWNER")) {
                    const storeList = await getAllStores();
                    setStores(storeList);
                }
            } catch (err) {
                setError("Failed to fetch user or stores");
            }
        };
        fetchUserAndStores();
    }, []);

    const filteredZones = useMemo(() =>
        zones.filter(z =>
            z.zoneDescription.toLowerCase().includes(searchText.toLowerCase())
        ), [searchText, zones]);

    const handleOpenCreate = () => {
        const initialForm = { 
            id: null, 
            zoneName: "", 
            zoneDescription: "", 
            storeId: user?.roles?.includes("STAFF") ? user.storeId : null 
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
            setZones(prev => prev.filter(z => z.id !== zoneToDelete.id));
        } catch {
            setError("Failed to delete zone");
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

        if (!form.zoneName.trim()) {
            setZoneNameError("Zone name is required");
            return;
        }
        if (form.zoneName.length > 100) {
            setZoneNameError("Zone name cannot > 100 characters");
            return;
        }
        // Kiểm tra zoneDescription có vượt quá 1000 ký tự không
        if (form.zoneDescription && form.zoneDescription.length > 1000) {
            setZoneDescriptionError("Zone description cannot be > 1000 characters");
            return;
        }
        const isDuplicate = zones.some(z =>
            z.zoneName === form.zoneName && z.id !== form.id
        );
        if (isDuplicate) {
            setZoneNameError("Zone name is existed");
            return;
        }

        // Gán storeId cho STAFF trước khi submit
        let submitForm = { ...form };
        if (user?.roles?.includes("STAFF")) {
            submitForm.storeId = user.storeId;
        }

        try {
            if (editMode) {
                const updated = await updateZone(form.id, submitForm);
                setZones(prev => prev.map(z => (z.id === form.id ? updated : z)));
            } else {
                const created = await createZone(submitForm);
                setZones(prev => [...prev, created]);
            }
            setOpenDialog(false);
            setZoneNameError("");
            setZoneDescriptionError("");
        } catch {
            setError(`Failed to ${editMode ? "update" : "create"} zone`);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-5 bg-white shadow-md rounded-md">
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
                user={user}
                stores={stores}
            />
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    Bạn có chắc chắn muốn xóa khu vực này không?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Xóa</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Zone;



