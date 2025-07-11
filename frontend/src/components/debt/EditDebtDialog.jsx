import React, {useState, useEffect} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
} from "@mui/material";
import {updateDebtNote} from "../../services/debtService";
import {getAllStores, uploadEvidence} from "../../services/storeService";

const EditDebtDialog = ({open, onClose, debtNote, customerId, onUpdate}) => {
    const [formData, setFormData] = useState({
        customerId,
        debtAmount: "",
        debtDate: "",
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

        if (debtNote) {
            setFormData({
                customerId,
                debtAmount: debtNote.debtAmount || "",
                debtDate: debtNote.debtDate ? new Date(debtNote.debtDate).toISOString().slice(0, 16) : "",
                debtType: debtNote.debtType || "",
                debtDescription: debtNote.debtDescription || "",
                debtEvidences: debtNote.debtEvidences || "",
                fromSource: debtNote.fromSource || "",
                sourceId: debtNote.sourceId || "",
                storeId: debtNote.storeId || "",
            });
        }
    }, [debtNote, customerId]);

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
        if (!formData.debtType) {
            setError("Loại nợ là bắt buộc");
            return;
        }
        try {
            let debtEvidences = formData.debtEvidences;
            if (file) {
                debtEvidences = await uploadEvidence(file);
            }
            const data = {
                customerId: formData.customerId,
                debtAmount: parseFloat(formData.debtAmount) || 0, // Không thay đổi vì bị vô hiệu hóa
                debtDate: formData.debtDate,
                debtType: formData.debtType,
                debtDescription: formData.debtDescription || "",
                debtEvidences: debtEvidences || "",
                fromSource: formData.fromSource || null,
                sourceId: formData.sourceId ? parseInt(formData.sourceId) : null,
                storeId: formData.storeId ? parseInt(formData.storeId) : null,
            };
            const updatedDebtNote = await updateDebtNote(debtNote.id, data);
            onUpdate(updatedDebtNote);
            setFile(null);
            setError("");
            onClose();
        } catch (error) {
            console.error("Failed to update debt note:", error);
            setError("Không thể cập nhật giao dịch nợ: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Chỉnh sửa giao dịch nợ</DialogTitle>
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
                    disabled
                    InputLabelProps={{shrink: true}}
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
                    {formData.debtEvidences && (
                        <Typography variant="body2" sx={{mt: 1}}>
                            File hiện tại: {formData.debtEvidences}
                        </Typography>
                    )}
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
                    Cập nhật
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditDebtDialog;