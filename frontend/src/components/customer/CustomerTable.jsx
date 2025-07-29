import React from "react";
import { Table, TableHead, TableBody, TableRow, TableCell, IconButton, Stack, Pagination, TablePagination } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatCurrency } from "../../utils/formatters";

const ROWS_PER_PAGE_OPTIONS = [5, 10];

const CustomerTable = ({ customers, onEdit, onDelete, onDetail, page, pageCount, onPageChange, rowsPerPage, onRowsPerPageChange, totalCount }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Tên</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Số điện thoại</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Nợ</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Nhà cung cấp</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{formatCurrency(customer.totalDebt)}</TableCell>
              <TableCell>{customer.isSupplier ? "Có" : "Không"}</TableCell>
              <TableCell>
                <IconButton color="primary" onClick={() => onDetail(customer)}><VisibilityIcon /></IconButton>
                <IconButton color="warning" onClick={() => onEdit(customer)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => onDelete(customer)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={totalCount || customers.length}
        page={page - 1}
        onPageChange={(_, value) => onPageChange(value + 1)}
        rowsPerPage={rowsPerPage || customers.length}
        onRowsPerPageChange={onRowsPerPageChange || (() => {})}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        labelRowsPerPage="Số dòng mỗi trang"
      />
    </div>
  );
};

export default CustomerTable; 