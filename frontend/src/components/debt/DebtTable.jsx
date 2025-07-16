import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TablePagination,
    TextField,
    InputAdornment,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import AddDebtDialog from "./AddDebtDialog";

const DebtTable = ({ open, onClose, debtNotes, onEdit, customer, totalDebt, onAddDebt, addDialogOpen, onAddDialogClose, onAddDebtNote, addDebtDialogProps }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [search, setSearch] = useState("");

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0);
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
    const paginatedNotes = filteredNotes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                {/* Search bar */}
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
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Ngày giao dịch</TableCell>
                                <TableCell>Loại nợ</TableCell>
                                <TableCell>Mô tả</TableCell>
                                <TableCell>Nguồn</TableCell>
                                <TableCell>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedNotes && paginatedNotes.length > 0 ? (
                                paginatedNotes.map((note) => (
                                    <TableRow key={note.id || Math.random()}>
                                        <TableCell>{note.id || "N/A"}</TableCell>
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
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                onClick={() => onEdit(note)}
                                                disabled={!note.id}
                                            >
                                                Chi Tiết
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7}>Không có giao dịch nợ</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredNotes.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtTable;