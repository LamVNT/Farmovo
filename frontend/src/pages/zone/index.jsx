import React, { useState, useEffect, useMemo } from "react";
import { Button, TextField } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import ZoneFormDialog from "../../components/zone/ZoneFormDialog";
import ZoneTable from "../../components/zone/ZoneTable";
import { getZones, createZone, updateZone, deleteZone } from "../../services/zoneService";

const Zone = () => {
    const [zones, setZones] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, zoneName: "", zoneDescription: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getZones();
                setZones(data);
                // eslint-disable-next-line no-unused-vars
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
        setForm({ id: null, zoneName: "", zoneDescription: "" });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (zone) => {
        setForm(zone);
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this zone?")) {
            try {
                await deleteZone(id);
                setZones(prev => prev.filter(z => z.id !== id));
            } catch {
                setError("Failed to delete zone");
            }
        }
    };

    const handleSubmit = async () => {
        if (!form.zoneName.trim()) return;

        try {
            if (editMode) {
                const updated = await updateZone(form.id, form);
                setZones(prev => prev.map(z => (z.id === form.id ? updated : z)));
            } else {
                const created = await createZone(form);
                setZones(prev => [...prev, created]);
            }
            setOpenDialog(false);
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
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus />}>
                        Add
                    </Button>
                </div>
            </div>

            <ZoneTable
                rows={filteredZones}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            <ZoneFormDialog
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

export default Zone;
