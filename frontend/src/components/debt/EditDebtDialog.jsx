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
    FormControl,
    InputLabel,
    Typography,
    Box,
} from "@mui/material";
import { updateDebtNote } from "../../services/debtService";
import { getAllStores, uploadEvidence } from "../../services/storeService";

const EditDebtDialog = ({ open, onClose, debtNote, customerId, onUpdate }) => {
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
    const [previewUrl, setPreviewUrl] = useState(null);
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
            // Nếu có evidence cũ và là ảnh, hiển thị preview
            if (debtNote.debtEvidences && (debtNote.debtEvidences.endsWith('.jpg') || debtNote.debtEvidences.endsWith('.jpeg') || debtNote.debtEvidences.endsWith('.png') || debtNote.debtEvidences.endsWith('.webp'))) {
                setPreviewUrl(debtNote.debtEvidences.startsWith('http') ? debtNote.debtEvidences : `${import.meta.env.VITE_API_URL}/uploads/${debtNote.debtEvidences}`);
            } else {
                setPreviewUrl(null);
            }
        }
    }, [debtNote, customerId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && !selectedFile.type.startsWith("image/")) {
            setError("Vui lòng chọn file ảnh (jpg, png, v.v.)");
            setFile(null);
            setPreviewUrl(null);
        } else {
            setFile(selectedFile);
            setError("");
            if (selectedFile) {
                setPreviewUrl(URL.createObjectURL(selectedFile));
            } else {
                setPreviewUrl(null);
            }
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
            setPreviewUrl(null);
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
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Số tiền nợ</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="debtAmount"
                        type="number"
                        fullWidth
                        value={formData.debtAmount}
                        disabled
                        InputLabelProps={{ shrink: true }}
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Ngày giao dịch</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="debtDate"
                        type="datetime-local"
                        fullWidth
                        value={formData.debtDate}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Loại nợ</Typography>
                    </Box>
                    <FormControl fullWidth margin="dense" sx={{ ml: 2 }}>
                        <Select
                            name="debtType"
                            value={formData.debtType}
                            label=""
                            required
                            disabled
                        >
                            <MenuItem value="+">Cửa hàng nợ</MenuItem>
                            <MenuItem value="-">Khách hàng nợ</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Mô tả</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="debtDescription"
                        fullWidth
                        value={formData.debtDescription}
                        onChange={handleChange}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Bằng chứng (tùy chọn)</Typography>
                    </Box>
                    <Box sx={{ ml: 2, flex: 1 }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ marginTop: "16px" }}
                        />
                        {previewUrl && (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style={{ maxWidth: "100%", maxHeight: 200, marginTop: 8, borderRadius: 8 }}
                            />
                        )}
                        {formData.debtEvidences && !previewUrl && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                File hiện tại: {formData.debtEvidences}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Nguồn (tùy chọn)</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="fromSource"
                        fullWidth
                        value={formData.fromSource}
                        onChange={handleChange}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>ID nguồn (tùy chọn)</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="sourceId"
                        type="number"
                        fullWidth
                        value={formData.sourceId}
                        onChange={handleChange}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Tên cửa hàng</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="storeName"
                        fullWidth
                        value={stores.find((store) => store.id === formData.storeId)?.name || ''}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { onClose(); setPreviewUrl(null); }}>Hủy</Button>
                <Button onClick={handleSubmit} color="primary">
                    Cập nhật
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditDebtDialog;