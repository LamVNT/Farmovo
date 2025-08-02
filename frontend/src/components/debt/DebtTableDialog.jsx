import React, { useState } from "react";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    TablePagination,
    TextField,
    InputAdornment,
    IconButton
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import AddDebtDialog from "./AddDebtDialog";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatCurrency } from "../../utils/formatters";

const DebtTableDialog = ({ open, onClose, debtNotes, onEdit, customer, totalDebt, onAddDebt, addDialogOpen, onAddDialogClose, onAddDebtNote, debtNotesPage, debtNotesRowsPerPage, debtNotesTotalPages, debtNotesTotalItems, onDebtNotesPageChange, onDebtNotesRowsPerPageChange, fromDate, toDate, onDateFilterChange }) => {
    const [search, setSearch] = useState("");
    const [localFromDate, setLocalFromDate] = useState(fromDate);
    const [localToDate, setLocalToDate] = useState(toDate);
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };
    const filteredNotes = debtNotes
        ? debtNotes.filter(note => {
            const desc = note.debtDescription?.toLowerCase() || "";
            const type = note.debtType || "";
            return (
                desc.includes(search.toLowerCase()) ||
                type.includes(search.toLowerCase())
            );
        })
        : [];
    const formatTotalDebt = (totalDebt) => {
        if (totalDebt == null || totalDebt === 0) return formatCurrency(0);
        if (totalDebt < 0) {
            return (
                <span style={{ color: 'red', fontWeight: 'bold' }}>- {formatCurrency(Math.abs(totalDebt))} <span style={{ fontWeight: 'normal', fontSize: 12 }}>(Khách đang nợ)</span></span>
            );
        }
        return (
            <span style={{ color: 'green', fontWeight: 'bold' }}>+ {formatCurrency(totalDebt)} <span style={{ fontWeight: 'normal', fontSize: 12 }}>(Cửa hàng nợ)</span></span>
        );
    };

    const formatDebtType = (debtType) => {
        if (debtType === "+") return "Cửa Hàng Nợ";
        if (debtType === "-") return "Khách Hàng Nợ";
        return debtType || "N/A";
    };

    const formatFromSource = (fromSource) => {
        if (fromSource === "SALE") return "Đơn Bán";
        if (fromSource === "IMPORT" || fromSource === "PURCHASE") return "Đơn Nhập";
        if (fromSource === "MANUAL") return "Đơn tự nhập";
        return fromSource || "N/A";
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
            <DialogTitle>Danh sách giao dịch nợ</DialogTitle>
            <DialogContent>
                {/* Thông tin khách hàng, tổng nợ và nút thêm giao dịch nợ */}
                {customer && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <strong>Khách hàng:</strong> {customer.name || "N/A"}<br />
                                <strong>Tổng nợ:</strong> {formatTotalDebt(totalDebt)}
                            </div>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={onAddDebt}
                                sx={{ mb: 2 }}
                            >
                                Thêm phiếu thanh toán
                            </Button>
                        </div>
                        <AddDebtDialog
                            open={addDialogOpen}
                            onClose={onAddDialogClose}
                            customerId={customer.id}
                            onAdd={onAddDebtNote}
                        />
                    </>
                )}
                {/* Search bar ngoài bảng */}
                <TextField
                    placeholder="Tìm kiếm mô tả hoặc loại nợ..."
                    value={search}
                    onChange={handleSearchChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Date range filter */}
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                        <DatePicker
                            label="Từ ngày"
                            value={localFromDate}
                            onChange={(newVal) => setLocalFromDate(newVal)}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                        <DatePicker
                            label="Đến ngày"
                            value={localToDate}
                            onChange={(newVal) => setLocalToDate(newVal)}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                        <Button variant="outlined" onClick={() => onDateFilterChange(localFromDate, localToDate)}>Lọc</Button>
                        <Button variant="text" onClick={() => { setLocalFromDate(null); setLocalToDate(null); onDateFilterChange(null, null); }}>Tất cả</Button>
                    </div>
                </LocalizationProvider>
                {/* Bảng giao dịch nợ */}
                <div style={{ width: '100%' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                {/* <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell> */}
                                <TableCell sx={{ fontWeight: 'bold', padding: '4px 8px', fontSize: 13 }}>Ngày giao dịch</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', padding: '4px 8px', fontSize: 13 }}>Loại nợ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', padding: '4px 8px', fontSize: 13 }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', padding: '4px 8px', fontSize: 13 }}>Nguồn</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', padding: '4px 8px', fontSize: 13 }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredNotes && filteredNotes.length > 0 ? (
                                filteredNotes.map((note) => (
                                    <TableRow key={note.id || Math.random()}>
                                        {/* <TableCell>{note.id || "N/A"}</TableCell> */}
                                        <TableCell sx={{ padding: '4px 8px', fontSize: 13 }}>
                                            {note.debtDate
                                                ? new Date(note.debtDate).toLocaleString("vi-VN", {
                                                    dateStyle: "short",
                                                    timeStyle: "short",
                                                })
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px', fontSize: 13 }}>{formatDebtType(note.debtType)}</TableCell>
                                        <TableCell sx={{ padding: '4px 8px', fontSize: 13 }}>{note.debtDescription || "N/A"}</TableCell>
                                        <TableCell sx={{ padding: '4px 8px', fontSize: 13 }}>{formatFromSource(note.fromSource)}</TableCell>
                                        <TableCell sx={{ padding: '4px 8px', fontSize: 13 }}>
                                            <IconButton color="primary" onClick={() => onEdit(note)} disabled={!note.id}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6}>Không có giao dịch nợ</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
            <TablePagination
                component="div"
                count={debtNotesTotalItems}
                page={debtNotesPage}
                onPageChange={onDebtNotesPageChange}
                rowsPerPage={debtNotesRowsPerPage}
                onRowsPerPageChange={onDebtNotesRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Số dòng mỗi trang"
                // Đặt mặc định là 5 nếu rowsPerPage chưa được truyền vào
                {...(debtNotesRowsPerPage == null ? { rowsPerPage: 5 } : {})}
            />
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtTableDialog;