import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
} from "@mui/material";
import { addDebtNote } from "../../services/debtService";
import { getAllStores, uploadEvidence } from "../../services/storeService";

const AddDebtDialog = ({ open, onClose, customerId, onAdd }) => {
    const [formData, setFormData] = useState({
        customerId,
        debtAmount: "",
        debtDate: new Date().toISOString().slice(0, 16),
        debtType: "",
        debtDescription: "",
        debtEvidences: "",
        fromSource: "",
        sourceId: "",
        storeId: "",
    });
    const [stores, setStores] = useState([]);
    const [file, setFile] = useState(null);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const storeData = await getAllStores();
                setStores(storeData || []);
            } catch (error) {
                console.error("Failed to fetch stores:", error);
                alert("Không thể tải danh sách cửa hàng");
            }
        };
        fetchStores();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async () => {
        try {
            let debtEvidences = formData.debtEvidences;
            if (file) {
                debtEvidences = await uploadEvidence(file);
            }
            const data = {
                ...formData,
                debtAmount: parseFloat(formData.debtAmount) || 0,
                sourceId: formData.sourceId ? parseInt(formData.sourceId) : null,
                storeId: formData.storeId ? parseInt(formData.storeId) : null,
                debtEvidences,
            };
            const newDebtNote = await addDebtNote(data);
            onAdd(newDebtNote);
            onClose();
        } catch (error) {
            console.error("Failed to add debt note:", error);
            alert("Không thể thêm giao dịch nợ: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Thêm giao dịch nợ mới</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="debtAmount"
                    label="Số tiền nợ"
                    type="number"
                    fullWidth
                    value={formData.debtAmount}
                    onChange={handleChange}
                    required
                />
                <TextField
                    margin="dense"
                    name="debtDate"
                    label="Ngày giao dịch"
                    type="datetime-local"
                    fullWidth
                    value={formData.debtDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth margin="dense">
                    <InputLabel>Loại nợ</InputLabel>
                    <Select
                        name="debtType"
                        value={formData.debtType}
                        onChange={handleChange}
                        label="Loại nợ"
                    >
                        <MenuItem value="+">Cửa hàng nợ</MenuItem>
                        <MenuItem value="-">Khách hàng nợ</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    margin="dense"
                    name="debtDescription"
                    label="Mô tả"
                    fullWidth
                    value={formData.debtDescription}
                    onChange={handleChange}
                />
                <FormControl fullWidth margin="dense">
                    <InputLabel shrink>Bằng chứng</InputLabel>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ marginTop: "16px" }}
                    />
                </FormControl>
                <TextField
                    margin="dense"
                    name="fromSource"
                    label="Nguồn (tùy chọn)"
                    fullWidth
                    value={formData.fromSource}
                    onChange={handleChange}
                />
                <TextField
                    margin="dense"
                    name="sourceId"
                    label="ID nguồn (tùy chọn)"
                    type="number"
                    fullWidth
                    value={formData.sourceId}
                    onChange={handleChange}
                />
                <FormControl fullWidth margin="dense">
                    <InputLabel>ID cửa hàng</InputLabel>
                    <Select
                        name="storeId"
                        value={formData.storeId}
                        onChange={handleChange}
                        label="ID cửa hàng"
                    >
                        {stores.map((store) => (
                            <MenuItem key={store.id} value={store.id}>
                                {store.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button onClick={handleSubmit} color="primary">
                    Thêm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddDebtDialog;