import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Box,
    Button,
} from "@mui/material";
import { getAllStores } from "../../services/storeService";

// S3 bucket info
const S3_BUCKET_URL = "https://my-debt-images.s3.eu-north-1.amazonaws.com";

const DebtDetailDialog = ({ open, onClose, debtNote }) => {
    const [storeName, setStoreName] = useState("");
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const storeData = await getAllStores();
                if (debtNote && debtNote.storeId) {
                    const store = storeData.find((s) => s.id === debtNote.storeId);
                    setStoreName(store ? store.name : "");
                } else {
                    setStoreName("");
                }
            } catch (error) {
                setStoreName("");
            }
        };
        if (open && debtNote && debtNote.storeId) fetchStores();
    }, [open, debtNote]);

    if (!debtNote) return null;

    // Determine preview for evidence if it's an image
    let previewUrl = debtNote.debtEvidences || null;
    if (debtNote.debtEvidences) {
        if (
            debtNote.debtEvidences.startsWith("http://") ||
            debtNote.debtEvidences.startsWith("https://")
        ) {
            previewUrl = debtNote.debtEvidences;
        } else if (
            debtNote.debtEvidences.endsWith(".jpg") ||
            debtNote.debtEvidences.endsWith(".jpeg") ||
            debtNote.debtEvidences.endsWith(".png") ||
            debtNote.debtEvidences.endsWith(".webp")
        ) {
            previewUrl = `${S3_BUCKET_URL}/${debtNote.debtEvidences}`;
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Chi tiết giao dịch nợ</DialogTitle>
            <DialogContent>
                {/* Số tiền nợ và loại nợ trên cùng, nằm cạnh nhau */}
                <Box display="flex" gap={2} mb={2}>
                    <Box flex={1}>
                        <Typography variant="subtitle2">Số tiền nợ</Typography>
                        <TextField
                            margin="dense"
                            name="debtAmount"
                            type="number"
                            fullWidth
                            value={debtNote.debtAmount}
                            disabled
                            InputLabelProps={{ shrink: true }}
                            label=""
                        />
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle2">Loại nợ</Typography>
                        <TextField
                            margin="dense"
                            name="debtType"
                            fullWidth
                            value={debtNote.debtType === "+" ? "Cửa hàng nợ" : "Khách hàng nợ"}
                            disabled
                            label=""
                        />
                    </Box>
                </Box>
                {/* Ngày giao dịch và Tên cửa hàng, cạnh nhau */}
                <Box display="flex" gap={2} mb={2}>
                    <Box flex={1}>
                        <Typography variant="subtitle2">Ngày giao dịch</Typography>
                        <TextField
                            margin="dense"
                            name="debtDate"
                            type="datetime-local"
                            fullWidth
                            value={debtNote.debtDate ? new Date(debtNote.debtDate).toISOString().slice(0, 16) : ""}
                            disabled
                            InputLabelProps={{ shrink: true }}
                            label=""
                        />
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle2">Tên cửa hàng</Typography>
                        <TextField
                            margin="dense"
                            name="storeName"
                            fullWidth
                            value={storeName}
                            disabled
                            label=""
                        />
                    </Box>
                </Box>
                {/* Mô tả */}
                <Box mb={2}>
                    <Typography variant="subtitle2">Mô tả</Typography>
                    <TextField
                        margin="dense"
                        name="debtDescription"
                        fullWidth
                        value={debtNote.debtDescription}
                        disabled
                        label=""
                        multiline
                        minRows={2}
                    />
                </Box>
                {/* Ảnh bằng chứng */}
                <Box mb={2}>
                    <Typography variant="subtitle2">Bằng chứng</Typography>
                    <Box>
                        {debtNote.debtEvidences && (
                            <img
                                src={debtNote.debtEvidences}
                                alt="Preview"
                                style={{ maxWidth: "100%", maxHeight: 160, marginTop: 8, borderRadius: 8 }}
                            />
                        )}
                        {debtNote.debtEvidences && !debtNote.debtEvidences.startsWith("http") && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {debtNote.debtEvidences}
                            </Typography>
                        )}
                    </Box>
                </Box>
                {/* Nguồn và ID nguồn, cạnh nhau */}
                <Box display="flex" gap={2} mb={2}>
                    <Box flex={1}>
                        <Typography variant="subtitle2">Nguồn</Typography>
                        <TextField
                            margin="dense"
                            name="fromSource"
                            fullWidth
                            value={debtNote.fromSource || ""}
                            disabled
                            label=""
                        />
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle2">ID nguồn</Typography>
                        <TextField
                            margin="dense"
                            name="sourceId"
                            type="number"
                            fullWidth
                            value={debtNote.sourceId || ""}
                            disabled
                            label=""
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtDetailDialog;