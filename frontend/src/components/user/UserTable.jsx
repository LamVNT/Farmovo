import React, { useState, useMemo } from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, IconButton, TablePagination, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const ROWS_PER_PAGE_OPTIONS = [5, 10];

const UserTable = ({ users, onEdit, onDelete, onToggleStatus }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const pagedUsers = useMemo(() => {
        const start = page * rowsPerPage;
        return users.slice(start, start + rowsPerPage);
    }, [users, page, rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        {/* <TableCell>ID</TableCell> */}
                        <TableCell>Họ tên</TableCell>
                        <TableCell>Tên đăng nhập</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                        <TableCell>Ngày cập nhật</TableCell>
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
                            <TableCell>{row.status ? 'Hoạt động' : 'Không hoạt động'}</TableCell>
                            <TableCell>{row.createAt ? new Date(row.createAt).toLocaleString('vi-VN') : 'N/A'}</TableCell>
                            <TableCell>{row.updateAt ? new Date(row.updateAt).toLocaleString('vi-VN') : 'N/A'}</TableCell>
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
                count={users.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                labelRowsPerPage="Số dòng mỗi trang"
            />
        </div>
    );
};

export default UserTable;