import React, {useEffect, useState} from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Radio,
    RadioGroup
} from "@mui/material";

export default function ZoneCheckboxDialog({open, onClose, zones, selectedZones, onChange}) {
    // selectedZones giờ là 1 phần tử hoặc rỗng
    const [selected, setSelected] = useState(selectedZones[0] ? String(selectedZones[0]) : "");

    const handleChange = (event) => {
        setSelected(event.target.value);
    };

    const handleConfirm = () => {
        // Ép về số để đồng bộ với backend
        onChange(selected ? [Number(selected)] : []);
        onClose();
    };

    useEffect(() => {
        setSelected(selectedZones[0] ? String(selectedZones[0]) : "");
    }, [selectedZones, open]);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Chọn khu vực</DialogTitle>
            <DialogContent>
                <RadioGroup value={selected} onChange={handleChange}>
                    {zones.map(zone => (
                        <FormControlLabel
                            key={zone.id}
                            value={String(zone.id)}
                            control={<Radio/>}
                            label={zone.zoneName}
                        />
                    ))}
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button onClick={handleConfirm} variant="contained">Xác nhận</Button>
            </DialogActions>
        </Dialog>
    );
} 