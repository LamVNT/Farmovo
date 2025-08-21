import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Paper,
    IconButton,
    Stack,
    TextField,
    Box,
    Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import ImageIcon from "@mui/icons-material/Image";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AddDebtDialog from "./AddDebtDialog";
import { formatCurrency } from "../../utils/formatters";

const DebtTableDialog = ({
    open,
    onClose,
    debtNotes = [],
    onEdit,
    customer,
    totalDebt,
    onAddDebt,
    addDialogOpen,
    onAddDialogClose,
    onAddDebtNote,
    debtNotesPage = 0,
    debtNotesRowsPerPage = 10,
    debtNotesTotalItems = 0,
    onDebtNotesPageChange,
    onDebtNotesRowsPerPageChange,
    fromDate,
    toDate,
    onDateFilterChange,
}) => {
        const navigate = useNavigate();
    // evidence dialog state
    const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const S3_BUCKET_URL = "https://my-debt-images.s3.eu-north-1.amazonaws.com";
    // Local state cho bộ lọc ngày
    const [localFromDate, setLocalFromDate] = useState(fromDate || null);
    const [localToDate, setLocalToDate] = useState(toDate || null);

    const handleFilterApply = () => {
        if (onDateFilterChange) {
            onDateFilterChange(localFromDate, localToDate);
        }
    };

    const handleShowAll = () => {
        setLocalFromDate(null);
        setLocalToDate(null);
        if (onDateFilterChange) {
            onDateFilterChange(null, null);
        }
    };


    const paginatedRows = debtNotes;

    const handleViewEvidence = (note) => {
        if (!note) return;
        let pUrl = null;
        if (note.debtEvidences) {
            if (note.debtEvidences.startsWith("https://")) {
                pUrl = note.debtEvidences;
            } else if (/\.(jpg|jpeg|png|webp)$/i.test(note.debtEvidences)) {
                pUrl = `${S3_BUCKET_URL}/${note.debtEvidences}`;
            }
        }
        if (pUrl) {
            setPreviewUrl(pUrl);
            setEvidenceDialogOpen(true);
        }
    };

    const handleNavigateTransaction = (note) => {
        if (!note?.sourceId || !note?.fromSource) return;
        if (note.fromSource === 'SALE') {
            navigate(`/sale/${note.sourceId}?view=detail`);
        } else if (note.fromSource === 'IMPORT' || note.fromSource === 'PURCHASE') {
            navigate(`/import/${note.sourceId}?view=detail`);
        }
    };

    const formatDebtType = (type) => {
        if (type === "+") return "Cửa hàng nợ";
        if (type === "-") return "Khách hàng nợ";
        return type;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                {`Danh sách phiếu nợ - ${customer?.name || "Khách hàng"}`}
            </DialogTitle>
            <DialogContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Từ ngày"
                            value={localFromDate}
                            onChange={(newValue) => setLocalFromDate(newValue)}
                            renderInput={(params) => <TextField size="small" {...params} />}
                        />
                        <DatePicker
                            label="Đến ngày"
                            value={localToDate}
                            onChange={(newValue) => setLocalToDate(newValue)}
                            renderInput={(params) => <TextField size="small" {...params} />}
                        />
                    </LocalizationProvider>
                    <Button variant="contained" onClick={handleFilterApply} sx={{ minWidth: 120 }}>
                        Lọc
                    </Button>
                    <Button variant="outlined" onClick={handleShowAll} sx={{ minWidth: 120 }}>
                        Tất cả
                    </Button>
                    <Box flexGrow={1} />
                    <Button variant="contained" color="success" onClick={onAddDebt}>
                        + Thêm phiếu
                    </Button>
                </Stack>

                {/* Tổng nợ */}
                <Typography variant="subtitle1" gutterBottom>
                    Tổng nợ: <span style={{ color: totalDebt < 0 ? 'red' : totalDebt > 0 ? 'green' : undefined, fontWeight: 600 }}>
                        {formatCurrency(totalDebt)}
                    </span>
                </Typography>

                {/* Bảng phiếu nợ */}
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                <TableCell sx={{ fontWeight: "bold" }}>STT</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Số tiền nợ</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Loại nợ</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Ngày giao dịch</TableCell>
                                                                <TableCell sx={{ fontWeight: "bold" }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedRows && paginatedRows.length > 0 ? (
                                paginatedRows.map((note, index) => (
                                    <TableRow key={note.id || index} hover>
                                        <TableCell>{debtNotesPage * debtNotesRowsPerPage + index + 1}</TableCell>
                                        <TableCell>
                                            {(() => {
                                                const amountColor = note.debtType === "-"
                                                    ? 'red'
                                                    : note.debtType === "+"
                                                        ? 'green'
                                                        : (note.debtAmount < 0 ? 'red' : note.debtAmount > 0 ? 'green' : undefined);
                                                return (
                                                    <span style={{ color: amountColor, fontWeight: 500 }}>
                                                        {formatCurrency(note.debtAmount)}
                                                    </span>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>{formatDebtType(note.debtType)}</TableCell>
                                        <TableCell>{
                                            note.debtDate ? new Date(note.debtDate).toLocaleString() : ""
                                        }</TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                {(() => {
                                                    const hasEvidence = !!note.debtEvidences;
                                                    return (
                                                        <IconButton
                                                            color="secondary"
                                                            size="small"
                                                            disabled={!hasEvidence}
                                                            title={hasEvidence ? 'Xem bằng chứng' : 'Không có bằng chứng'}
                                                            onClick={hasEvidence ? () => handleViewEvidence(note) : undefined}
                                                        >
                                                            <ImageIcon />
                                                        </IconButton>
                                                    );
                                                })()}
                                                {(() => {
                                                    const canClick = note.sourceId && note.fromSource && (note.fromSource === 'SALE' || note.fromSource === 'IMPORT' || note.fromSource === 'PURCHASE');
                                                    return (
                                                        <IconButton
                                                            color="primary"
                                                            size="small"
                                                            disabled={!canClick}
                                                            title={canClick ? `Đi đến ${note.fromSource === 'SALE' ? 'bán hàng' : 'nhập hàng'} #${note.sourceId}` : 'Không có nguồn'}
                                                            onClick={canClick ? () => handleNavigateTransaction(note) : undefined}
                                                        >
                                                            <OpenInNewIcon />
                                                        </IconButton>
                                                    );
                                                })()}
                                                <IconButton
                                                    color="primary"
                                                    size="small"
                                                    title="Chi tiết"
                                                    onClick={() => onEdit && onEdit(note)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Không có phiếu nợ
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Phân trang */}
                <TablePagination
                    component="div"
                    count={debtNotesTotalItems}
                    page={debtNotesPage}
                    onPageChange={onDebtNotesPageChange}
                    rowsPerPage={debtNotesRowsPerPage}
                    onRowsPerPageChange={onDebtNotesRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Đóng</Button>
            </DialogActions>

            {/* Dialog thêm phiếu nợ */}
            {addDialogOpen && (
                <AddDebtDialog
                    open={addDialogOpen}
                    onClose={onAddDialogClose}
                    customerId={customer?.id}
                    onAdd={onAddDebtNote}
                />
            )}
            
            {evidenceDialogOpen && (
                <Dialog open={evidenceDialogOpen} onClose={() => setEvidenceDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Bằng chứng</DialogTitle>
                    <DialogContent>
                        {previewUrl ? (
                            <img src={previewUrl} alt="Evidence" style={{ width: '100%', maxHeight: 400, borderRadius: 8 }} />
                        ) : (
                            <Typography>Không có bằng chứng</Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEvidenceDialogOpen(false)}>Đóng</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Dialog>
    );
};

export default DebtTableDialog;

