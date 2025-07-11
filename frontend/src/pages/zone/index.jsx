import React, {useState, useEffect, useMemo} from "react";
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField} from "@mui/material";
import {FaPlus} from "react-icons/fa6";
import ZoneFormDialog from "../../components/zone/ZoneFormDialog";
import ZoneTable from "../../components/zone/ZoneTable";
import ZoneVisual from "../../components/zone/ZoneVisual";
import {getZones, createZone, updateZone, deleteZone} from "../../services/zoneService";

const Zone = () => {
    const [zones, setZones] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({id: null, zoneName: "", zoneDescription: ""});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredZoneId, setHoveredZoneId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [zoneToDelete, setZoneToDelete] = useState(null);
    const [zoneNameError, setZoneNameError] = useState("");

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

    const filteredZones = useMemo(() =>
        zones.filter(z =>
            z.zoneName.toLowerCase().includes(searchText.toLowerCase())
        ), [searchText, zones]);

    const handleOpenCreate = () => {
        setForm({id: null, zoneName: "", zoneDescription: ""});
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

    // const handleDelete = async (id) => {
    //     if (window.confirm("Are you sure you want to delete this zone?")) {
    //         try {
    //             await deleteZone(id);
    //             setZones(prev => prev.filter(z => z.id !== id));
    //         } catch {
    //             setError("Failed to delete zone");
    //         }
    //     }
    // };

    // const handleSubmit = async () => {
    //     if (!form.zoneName.trim()) return;
    //
    //     const pattern = /^Z_\[\d+;\d+\]$/;
    //     if (!pattern.test(form.zoneName)) {
    //         setError("Zone name must follow pattern Z_[row;column] (e.g: Z_[1;2])");
    //         return;
    //     }
    //
    //     try {
    //         if (editMode) {
    //             const updated = await updateZone(form.id, form);
    //             setZones(prev => prev.map(z => (z.id === form.id ? updated : z)));
    //         } else {
    //             const created = await createZone(form);
    //             setZones(prev => [...prev, created]);
    //         }
    //         setOpenDialog(false);
    //         setError(null);
    //     } catch {
    //         setError(`Failed to ${editMode ? "update" : "create"} zone`);
    //     }
    // };

    const handleSubmit = async () => {
        setZoneNameError(""); // Reset lỗi

        if (!form.zoneName.trim()) {
            setZoneNameError("Zone name is required");
            return;
        }

        const pattern = /^Z_\[\d+;\d+\]$/;
        if (!pattern.test(form.zoneName)) {
            setZoneNameError("Zone name must follow pattern Z_[row;column] (e.g: Z_[1;2])");
            return;
        }

        const isDuplicate = zones.some(z =>
            z.zoneName === form.zoneName && z.id !== form.id
        );
        if (isDuplicate) {
            setZoneNameError("Zone name is existed");
            return;
        }

        try {
            if (editMode) {
                const updated = await updateZone(form.id, form);
                setZones(prev => prev.map(z => (z.id === form.id ? updated : z)));
            } else {
                const created = await createZone(form);
                setZones(prev => [...prev, created]);
            }
            setOpenDialog(false);
            setZoneNameError("");
        } catch {
            setError(`Failed to ${editMode ? "update" : "create"} zone`);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-5 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Zone Management</h2>
                <div className="flex gap-3">
                    <TextField
                        size="small"
                        label="Search Zone"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus/>}>
                        Add
                    </Button>
                </div>
            </div>

            {/* Layout chia đôi */}
            <div className="flex gap-6">
                {/* Bảng Zone Table co giãn */}
                <div className="flex-grow min-w-[300px] max-w-[600px]">
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

                {/* Bảng Layout giữ nguyên kích thước, không bị bóp nhỏ */}
                {/*<div className="flex-shrink-0" style={{ minWidth: "650px" }}>*/}
                {/*    <h3 className="text-lg font-semibold mb-2 text-center">Warehouse Layout</h3>*/}
                {/*    <ZoneVisual zones={zones} hoveredZoneId={hoveredZoneId} />*/}
                {/*</div>*/}
                <div className="flex-grow h-[500px]">
                    <h3 className="text-lg font-semibold mb-2 text-center">Warehouse Layout</h3>
                    <ZoneVisual zones={zones} hoveredZoneId={hoveredZoneId}/>
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
            />
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this zone?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Zone;
