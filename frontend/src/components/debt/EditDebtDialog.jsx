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
    let previewUrl = null;
    if (debtNote.debtEvidences && (debtNote.debtEvidences.endsWith('.jpg') || debtNote.debtEvidences.endsWith('.jpeg') || debtNote.debtEvidences.endsWith('.png') || debtNote.debtEvidences.endsWith('.webp'))) {
        previewUrl = debtNote.debtEvidences.startsWith('http') ? debtNote.debtEvidences : `${import.meta.env.VITE_API_URL}/uploads/${debtNote.debtEvidences}`;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Chi tiết giao dịch nợ</DialogTitle>
            <DialogContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}><Typography>Số tiền nợ</Typography></Box>
                    <TextField
                        margin="dense"
                        name="debtAmount"
                        type="number"
                        fullWidth
                        value={debtNote.debtAmount}
                        disabled
                        InputLabelProps={{ shrink: true }}
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}><Typography>Ngày giao dịch</Typography></Box>
                    <TextField
                        margin="dense"
                        name="debtDate"
                        type="datetime-local"
                        fullWidth
                        value={debtNote.debtDate ? new Date(debtNote.debtDate).toISOString().slice(0, 16) : ""}
                        disabled
                        InputLabelProps={{ shrink: true }}
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}><Typography>Loại nợ</Typography></Box>
                    <TextField
                        margin="dense"
                        name="debtType"
                        fullWidth
                        value={debtNote.debtType === "+" ? "Cửa hàng nợ" : "Khách hàng nợ"}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}><Typography>Mô tả</Typography></Box>
                    <TextField
                        margin="dense"
                        name="debtDescription"
                        fullWidth
                        value={debtNote.debtDescription}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}><Typography>Bằng chứng</Typography></Box>
                    <Box sx={{ ml: 2, flex: 1 }}>
                        {previewUrl && (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style={{ maxWidth: "100%", maxHeight: 200, marginTop: 8, borderRadius: 8 }}
                            />
                        )}
                        {debtNote.debtEvidences && !previewUrl && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {debtNote.debtEvidences}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}><Typography>Nguồn</Typography></Box>
                    <TextField
                        margin="dense"
                        name="fromSource"
                        fullWidth
                        value={debtNote.fromSource || ""}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}><Typography>ID nguồn</Typography></Box>
                    <TextField
                        margin="dense"
                        name="sourceId"
                        type="number"
                        fullWidth
                        value={debtNote.sourceId || ""}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box minWidth={120}><Typography>Tên cửa hàng</Typography></Box>
                    <TextField
                        margin="dense"
                        name="storeName"
                        fullWidth
                        value={storeName}
                        disabled
                        label=""
                        sx={{ ml: 2 }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtDetailDialog;