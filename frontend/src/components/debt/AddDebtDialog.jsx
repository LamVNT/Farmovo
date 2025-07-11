import React, {useEffect, useState} from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import {addDebtNote} from "../../services/debtService";
import {getAllStores, uploadEvidence} from "../../services/storeService";

const AddDebtDialog = ({open, onClose, customerId, onAdd}) => {
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
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const storeData = await getAllStores();
                setStores(storeData || []);
            } catch (error) {
                console.error("Failed to fetch stores:", error);
                setError("Không thể tải danh sách cửa hàng");
            }
        };
        fetchStores();
    }, []);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
        setError("");
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && !selectedFile.type.startsWith("image/")) {
            setError("Vui lòng chọn file ảnh (jpg, png, v.v.)");
            setFile(null);
        } else {
            setFile(selectedFile);
            setError("");
        }
    };

    const handleSubmit = async () => {
        if (!formData.debtAmount || !formData.debtType) {
            setError("Số tiền nợ và loại nợ là bắt buộc");
            return;
        }
        try {
            let debtEvidences = formData.debtEvidences;
            if (file) {
                debtEvidences = await uploadEvidence(file);
            }
            const debtAmount = parseFloat(formData.debtAmount) || 0;
            const data = {
                customerId: formData.customerId,
                debtAmount: formData.debtType === "-" ? -Math.abs(debtAmount) : Math.abs(debtAmount),
                debtDate: formData.debtDate,
                debtType: formData.debtType,
                debtDescription: formData.debtDescription || "",
                debtEvidences: debtEvidences || "",
                fromSource: formData.fromSource || null,
                sourceId: formData.sourceId ? parseInt(formData.sourceId) : null,
                storeId: formData.storeId ? parseInt(formData.storeId) : null,
            };
            const newDebtNote = await addDebtNote(data);
            onAdd(newDebtNote);
            setFormData({
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
            setFile(null);
            setError("");
            onClose();
        } catch (error) {
            console.error("Failed to add debt note:", error);
            setError("Không thể thêm giao dịch nợ: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Thêm giao dịch nợ mới</DialogTitle>
            <DialogContent>
                {error && (
                    <Typography color="error" sx={{mb: 2}}>
                        {error}
                    </Typography>
                )}
                <TextField
                    margin="dense"
                    name="debtAmount"
                    label="Số tiền nợ"
                    type="number"
                    fullWidth
                    value={formData.debtAmount}
                    onChange={handleChange}
                    required
                    InputProps={{inputProps: {min: 0}}}
                />
                <TextField
                    margin="dense"
                    name="debtDate"
                    label="Ngày giao dịch"
                    type="datetime-local"
                    fullWidth
                    value={formData.debtDate}
                    onChange={handleChange}
                    InputLabelProps={{shrink: true}}
                />
                <FormControl fullWidth margin="dense">
                    <InputLabel>Loại nợ</InputLabel>
                    <Select
                        name="debtType"
                        value={formData.debtType}
                        onChange={handleChange}
                        label="Loại nợ"
                        required
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
                    <InputLabel shrink>Bằng chứng (tùy chọn)</InputLabel>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{marginTop: "16px"}}
                    />
                </FormControl>
                <FormControl fullWidth margin="dense">
                    <InputLabel>ID cửa hàng</InputLabel>
                    <Select
                        name="storeId"
                        value={formData.storeId}
                        onChange={handleChange}
                        label="ID cửa hàng"
                    >
                        <MenuItem value="">Chọn cửa hàng</MenuItem>
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