import React, { useState, useRef } from "react";
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
import { addDebtNote } from "../../services/debtService";
import { uploadEvidence } from "../../services/storeService";

const AddDebtDialog = ({ open, onClose, customerId, onAdd }) => {
    const [formData, setFormData] = useState({
        customerId,
        debtAmount: "0",
        debtDate: "",
        debtType: "-",
        debtDescription: "",
        debtEvidences: "",
    });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

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

    const handleAddImageClick = () => {
        fileInputRef.current.click();
    };

    const parseDebtDate = (dateStr) => {
        if (!dateStr) return new Date().toISOString();
        const [datePart, timePart] = dateStr.split(" ");
        const [dd, mm, yyyy] = datePart.split("/");
        const formattedDate = `${yyyy}-${mm}-${dd}T${timePart || "00:00"}:00`;
        const parsedDate = new Date(formattedDate);
        return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
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
                debtDate: parseDebtDate(formData.debtDate),
                debtType: formData.debtType,
                debtDescription: formData.debtDescription || "",
                debtEvidences: debtEvidences || "",
            };
            const newDebtNote = await addDebtNote(data);
            onAdd(newDebtNote);
            setFormData({
                customerId,
                debtAmount: "0",
                debtDate: "",
                debtType: "-",
                debtDescription: "",
                debtEvidences: "",
            });
            setFile(null);
            setPreviewUrl(null);
            setError("");
            onClose();
        } catch (error) {
            console.error("Failed to add debt note:", error);
            setError("Không thể thêm giao dịch nợ: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Chi tiết nợ</DialogTitle>
            <DialogContent>
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Ghi chú</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="debtDescription"
                        fullWidth
                        multiline
                        rows={2}
                        value={formData.debtDescription}
                        onChange={handleChange}
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Loại nợ *</Typography>
                    </Box>
                    <FormControl fullWidth margin="dense" sx={{ ml: 2 }}>
                        <Select
                            name="debtType"
                            value={formData.debtType}
                            onChange={handleChange}
                            required
                            label=""
                        >
                            <MenuItem value="-">Khách hàng nợ</MenuItem>
                            <MenuItem value="+">Cửa hàng nợ</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Số tiền *</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="debtAmount"
                        type="number"
                        fullWidth
                        value={formData.debtAmount}
                        onChange={handleChange}
                        required
                        InputProps={{ inputProps: { min: 0 } }}
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Ngày lập phiếu</Typography>
                    </Box>
                    <TextField
                        margin="dense"
                        name="debtDate"
                        type="text"
                        fullWidth
                        placeholder="DD/MM/YYYY HH:mm"
                        value={formData.debtDate}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddImageClick}
                    sx={{ mt: 2 }}
                >
                    + THÊM ẢNH
                </Button>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ maxWidth: "100%", maxHeight: 200, marginTop: 8, borderRadius: 8 }}
                    />
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center" }}>
                <Button onClick={handleSubmit} color="success" variant="contained">
                    + THÊM
                </Button>
            </DialogActions>
            <DialogActions sx={{ justifyContent: "flex-end" }}>
                <Button onClick={() => { onClose(); setPreviewUrl(null); }} color="inherit">
                    CLOSE
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddDebtDialog;