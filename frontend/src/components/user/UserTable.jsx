import React, { useState, useMemo } from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, IconButton, TablePagination, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const ROWS_PER_PAGE_OPTIONS = [5, 10];

const UserTable = ({ users, onEdit, onDelete, onToggleStatus, page = 1, pageCount = 1, onPageChange, rowsPerPage = 10, onRowsPerPageChange, totalCount }) => {
    // If parent provides handlers, use controlled pagination; otherwise fallback to internal state
    const [internalPage, setInternalPage] = useState(0);
    const [internalRowsPerPage, setInternalRowsPerPage] = useState(5);

    const effectivePage = onPageChange ? page : internalPage;
    const effectiveRowsPerPage = onRowsPerPageChange ? rowsPerPage : internalRowsPerPage;

    const pagedUsers = useMemo(() => {
        if (onPageChange) {
            // Backend already paged, just return users array
            return users;
        }
        const start = effectivePage * effectiveRowsPerPage;
        return users.slice(start, start + effectiveRowsPerPage);
    }, [users, effectivePage, effectiveRowsPerPage, onPageChange]);

    const handleChangePage = (event, newPage) => {
        if (onPageChange) onPageChange(newPage);
        else setInternalPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const newSize = parseInt(event.target.value, 10);
        if (onRowsPerPageChange) onRowsPerPageChange(event);
        else {
            setInternalRowsPerPage(newSize);
            setInternalPage(0);
        }
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        {/* <TableCell>ID</TableCell> */}
                        <TableCell>Họ tên</TableCell>
                        <TableCell>Tên đăng nhập</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Cửa hàng</TableCell>
                        <TableCell>Hành động</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pagedUsers.map((row) => (
                        <TableRow key={row.id}>
                            {/* <TableCell>{row.id}</TableCell> */}
                            <TableCell>{row.fullName}</TableCell>
                            <TableCell>{row.username}</TableCell>
                            <TableCell>{row.email || 'N/A'}</TableCell>
                            <TableCell>{row.status ? 'Hoạt động' : 'Không hoạt động'}</TableCell>
                            <TableCell>{row.storeName || 'N/A'}</TableCell>
                            <TableCell>
                                <IconButton onClick={() => onEdit(row)}>
                                    <EditIcon color="primary" />
                                </IconButton>
                                <IconButton onClick={() => onDelete(row.id)}>
                                    <DeleteIcon color="error" />
                                </IconButton>
                                <IconButton onClick={() => onToggleStatus(row.id)}>
                                    <SwapHorizIcon color="warning" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={totalCount || users.length}
                page={effectivePage}
                onPageChange={handleChangePage}
                rowsPerPage={effectiveRowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                labelRowsPerPage="Số dòng mỗi trang"
            />
        </div>
    );
};

export default UserTable;