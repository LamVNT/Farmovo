import React, { useState } from "react";
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

const DebtTable = ({ open, onClose, debtNotes, onEdit, customer, totalDebt, onAddDebt, addDialogOpen, onAddDialogClose, onAddDebtNote, addDebtDialogProps, debtNotesPage, debtNotesRowsPerPage, debtNotesTotalPages, debtNotesTotalItems, onDebtNotesPageChange, onDebtNotesRowsPerPageChange }) => {
    const [search, setSearch] = useState("");
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
        if (totalDebt == null || totalDebt === 0) return "0";
        if (totalDebt < 0) {
            return (
                <span style={{ color: 'red', fontWeight: 'bold' }}>- {Math.abs(totalDebt)}</span>
            );
        } else {
            return (
                <span style={{ color: 'green', fontWeight: 'bold' }}>+ {totalDebt}</span>
            );
        }
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
                                Thêm giao dịch nợ
                            </Button>
                        </div>
                        <AddDebtDialog
                            open={addDialogOpen}
                            onClose={onAddDialogClose}
                            customerId={customer.id}
                            onAdd={onAddDebtNote}
                            {...addDebtDialogProps}
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
                {/* Bảng giao dịch nợ */}
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                {/* <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell> */}
                                <TableCell sx={{ fontWeight: 'bold' }}>Ngày giao dịch</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Loại nợ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Nguồn</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredNotes && filteredNotes.length > 0 ? (
                                filteredNotes.map((note) => (
                                    <TableRow key={note.id || Math.random()}>
                                        {/* <TableCell>{note.id || "N/A"}</TableCell> */}
                                        <TableCell>
                                            {note.debtDate
                                                ? new Date(note.debtDate).toLocaleString("vi-VN", {
                                                    dateStyle: "short",
                                                    timeStyle: "short",
                                                })
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>{note.debtType || "N/A"}</TableCell>
                                        <TableCell>{note.debtDescription || "N/A"}</TableCell>
                                        <TableCell>{note.fromSource || "N/A"}</TableCell>
                                        <TableCell>
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
            />
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtTable;