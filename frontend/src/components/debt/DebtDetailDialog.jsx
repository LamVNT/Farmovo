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
import { useNavigate } from "react-router-dom";
import { getAllStores } from "../../services/storeService";

// S3 bucket info
const S3_BUCKET_URL = "https://my-debt-images.s3.eu-north-1.amazonaws.com";

const DebtDetailDialog = ({ open, onClose, debtNote }) => {
    const navigate = useNavigate();
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

    const handleSourceIdClick = () => {
        if (!debtNote?.sourceId || !debtNote?.fromSource) {
            console.log('Missing sourceId or fromSource:', { sourceId: debtNote?.sourceId, fromSource: debtNote?.fromSource });
            return;
        }

        const sourceId = debtNote.sourceId;
        const fromSource = debtNote.fromSource;

        console.log('Navigating to transaction:', { sourceId, fromSource });

        // Chuyển hướng dựa trên loại nguồn
        if (fromSource === 'SALE') {
            // Chuyển sang trang chi tiết sale transaction
            console.log('Navigating to sale transaction:', sourceId);
            navigate(`/sale/${sourceId}`);
        } else if (fromSource === 'PURCHASE') {
            // Chuyển sang trang chi tiết import transaction
            console.log('Navigating to import transaction:', sourceId);
            navigate(`/import/${sourceId}`);
        } else {
            console.log('Unknown source type:', fromSource);
            return;
        }
        
        // Đóng dialog hiện tại
        onClose();
    };

    if (!debtNote) return null;

    // Determine preview for evidence if it's an image
    let previewUrl = debtNote.debtEvidences || null;
    if (debtNote.debtEvidences) {
        if (
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
    // Log để debug
    console.log('debtNote.debtEvidences:', debtNote.debtEvidences);
    console.log('previewUrl:', previewUrl);

    // Kiểm tra xem có thể click vào sourceId không
    const canClickSourceId = debtNote.sourceId && debtNote.fromSource && 
        (debtNote.fromSource === 'SALE' || debtNote.fromSource === 'PURCHASE');

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
                {/* Bằng chứng, Nguồn, ID nguồn trên cùng một hàng */}
                <Box display="flex" gap={2} mb={2}>
                    <Box flex={2} display="flex" flexDirection="column" alignItems="flex-start">
                        <Typography variant="subtitle2">Bằng chứng</Typography>
                        <Box>
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    style={{ maxWidth: "100%", maxHeight: 120, marginTop: 8, borderRadius: 8 }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            )}
                            {/* Nếu không có bằng chứng */}
                            {!debtNote.debtEvidences && (
                                <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                                    Không có bằng chứng
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <Box flex={1} display="flex" flexDirection="column">
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
                    <Box flex={1} display="flex" flexDirection="column">
                        <Typography variant="subtitle2">ID nguồn</Typography>
                        {canClickSourceId ? (
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleSourceIdClick}
                                sx={{ 
                                    mt: 1, 
                                    textTransform: 'none',
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    borderColor: '#1976d2',
                                    '&:hover': {
                                        backgroundColor: '#e3f2fd',
                                        borderColor: '#1565c0'
                                    }
                                }}
                                fullWidth
                                title={`Xem chi tiết ${debtNote.fromSource === 'SALE' ? 'phiếu bán hàng' : 'phiếu nhập hàng'} #${debtNote.sourceId}`}
                            >
                                <Box display="flex" alignItems="center" gap={1}>
                                    <span>{debtNote.sourceId}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                        ({debtNote.fromSource === 'SALE' ? 'Bán hàng' : 'Nhập hàng'})
                                    </span>
                                </Box>
                            </Button>
                        ) : (
                            <TextField
                                margin="dense"
                                name="sourceId"
                                type="number"
                                fullWidth
                                value={debtNote.sourceId || ""}
                                disabled
                                label=""
                            />
                        )}
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