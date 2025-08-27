import React, { useState, useRef, useEffect } from "react";
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
    Autocomplete,
    InputAdornment,
} from "@mui/material";
import { addDebtNote } from "../../services/debtService";
import { uploadEvidence, getAllStores, getStoreById } from "../../services/storeService";
import { useAuth } from "../../contexts/AuthorizationContext";

const AddDebtDialog = ({ open, onClose, customerId, onAdd }) => {
    const [formData, setFormData] = useState({
        customerId,
        debtAmount: "0",
        debtDate: "",
        debtType: "-",
        debtDescription: "",
        debtEvidences: "",
        storeId: "",
    });
    const [stores, setStores] = useState([]);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);
    const { isStaff, user } = useAuth();

    const formatNumberWithDots = (value) => {
        if (value === null || value === undefined) return "";
        const digitsOnly = String(value).replace(/\D/g, "");
        if (!digitsOnly) return "";
        return Number(digitsOnly).toLocaleString('vi-VN');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'debtAmount') {
            const formatted = formatNumberWithDots(value);
            setFormData({ ...formData, debtAmount: formatted });
        } else {
            setFormData({ ...formData, [name]: value });
        }
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

    const formatCurrentDateTime = () => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const HH = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${HH}:${min}`;
    };

    // Fetch stores when dialog opens, limit to staff's store
    useEffect(() => {
        const fetchStores = async () => {
            try {
                if (isStaff && isStaff() && (user?.storeId || user?.store?.id)) {
                    const staffStoreId = user?.storeId || user?.store?.id;
                    const store = await getStoreById(staffStoreId);
                    const oneStore = store ? [store] : [];
                    setStores(oneStore);
                    setFormData((prev) => ({ ...prev, storeId: store?.id || staffStoreId || "" }));
                } else {
                    const storeData = await getAllStores();
                    setStores(storeData || []);
                }
            } catch (error) {
                console.error("Failed to fetch stores:", error);
                setError("Không thể tải danh sách cửa hàng");
            }
        };

        if (open) {
            fetchStores();
        }
    }, [open, isStaff, user?.storeId]);

    // Prefill current date-time when dialog opens
    useEffect(() => {
        if (open) {
            setFormData((prev) => ({ ...prev, debtDate: formatCurrentDateTime() }));
        }
    }, [open]);

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
            const rawAmount = (formData.debtAmount || "").replace(/\D/g, "");
            const debtAmount = Number(rawAmount) || 0;
            const data = {
                customerId: formData.customerId,
                debtAmount: formData.debtType === "-" ? -Math.abs(debtAmount) : Math.abs(debtAmount),
                debtDate: parseDebtDate(formData.debtDate),
                debtType: formData.debtType,
                debtDescription: formData.debtDescription || "",
                debtEvidences: debtEvidences || "",
                storeId: formData.storeId || null,
                fromSource: "MANUAL", // Đánh dấu là đơn tự nhập
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
                storeId: "",
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
            <DialogTitle>Thêm phiếu thanh toán</DialogTitle>
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
                            <MenuItem value="-">Khách Hàng Nợ</MenuItem>
                            <MenuItem value="+">Cửa Hàng Nợ</MenuItem>
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
                        type="text"
                        inputMode="numeric"
                        fullWidth
                        value={formData.debtAmount}
                        onChange={handleChange}
                        required
                        placeholder="VD: 1.000.000"
                        label=""
                        sx={{ ml: 2 }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">VND</InputAdornment>,
                            inputProps: { inputMode: 'numeric' }
                        }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}>
                        <Typography>Ngày tạo nợ</Typography>
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
                <Box display="flex" alignItems="flex-start" mb={2}>
                    <Box minWidth={120} sx={{ mt: 1 }}>
                        <Typography>Cửa hàng</Typography>
                    </Box>
                    <Autocomplete
                        options={stores}
                        getOptionLabel={(option) => option.storeName || ""}
                        value={stores.find(store => store.id === formData.storeId) || null}
                        onChange={(event, newValue) => {
                            setFormData({
                                ...formData,
                                storeId: newValue ? newValue.id : ""
                            });
                            setError("");
                        }}
                        disabled={isStaff && isStaff()}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                margin="dense"
                                placeholder="Tìm kiếm tên cửa hàng..."
                                fullWidth
                                sx={{ 
                                    ml: 2,
                                    minWidth: '400px',
                                    '& .MuiInputBase-input': {
                                        fontSize: '14px',
                                        padding: '8px 12px'
                                    }
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} sx={{ py: 1 }}>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {option.storeName}
                                    </Typography>
                                    {option.storeAddress && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {option.storeAddress}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        noOptionsText="Không tìm thấy cửa hàng"
                        clearOnBlur={false}
                        selectOnFocus
                        clearOnEscape
                        sx={{
                            minWidth: '400px',
                            '& .MuiAutocomplete-popupIndicator': {
                                marginRight: 1
                            }
                        }}
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
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddDebtDialog;