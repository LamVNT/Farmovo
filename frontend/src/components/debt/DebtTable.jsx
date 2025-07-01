import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const DebtTable = ({ debtNotes, onEdit, onDelete, viewMode }) => {
    const columns = [
        { field: 'id', headerName: 'ID', flex: 0.5 },
        { field: 'customerName', headerName: 'Tên', flex: 1.5 },
        { field: 'phone', headerName: 'SĐT', flex: 1 },
        { field: 'address', headerName: 'Địa chỉ', flex: 1.5 },
        {
            field: 'debtAmount',
            headerName: 'Số tiền',
            flex: 1,
            renderCell: (params) => `${params.value.toLocaleString('vi-VN')} VNĐ`,
        },
        {
            field: 'debtDate',
            headerName: viewMode === 'debtors' ? 'Ngày tạo' : 'Ngày công nợ',
            flex: 1.5,
            renderCell: (params) =>
                params.value ? new Date(params.value).toLocaleString('vi-VN') : 'N/A',
        },
        { field: 'debtType', headerName: 'Kiểu', flex: 1 },
        { field: 'fromSource', headerName: 'Nguồn', flex: 1 },
        {
            field: 'actions',
            headerName: 'Hành động',
            flex: 2,
            sortable: false,
            renderCell: (params) =>
                viewMode !== 'debtors' && (
                    <>
                        <IconButton onClick={() => onEdit(params.row)}>
                            <EditIcon color="primary" />
                        </IconButton>
                        <IconButton onClick={() => onDelete(params.id)}>
                            <DeleteIcon color="error" />
                        </IconButton>
                    </>
                ),
        },
    ];

    return (
        <div style={{ height: 400 }}>
            <DataGrid
                rows={debtNotes}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
                checkboxSelection
                disableSelectionOnClick
                sx={{
                    borderRadius: 2,
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                    },
                }}
            />
        </div>
    );
};

export default DebtTable;