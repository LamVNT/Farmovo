import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';


const UserTable = ({ users, onEdit, onDelete, onToggleStatus }) => {
    const userColumns = [
        { field: 'id', headerName: 'ID', flex: 0.5 },
        { field: 'fullName', headerName: 'Họ tên', flex: 1.5 },
        { field: 'username', headerName: 'Tên đăng nhập', flex: 1.5 },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 1,
            renderCell: (params) => (params.value ? 'Hoạt động' : 'Không hoạt động'),
        },
        {
            field: 'createAt',
            headerName: 'Ngày tạo',
            flex: 1.5,
            renderCell: (params) =>
                params.value ? new Date(params.value).toLocaleString('vi-VN') : 'N/A',
        },
        {
            field: 'updateAt',
            headerName: 'Ngày cập nhật',
            flex: 1.5,
            renderCell: (params) =>
                params.value ? new Date(params.value).toLocaleString('vi-VN') : 'N/A',
        },
        { field: 'storeName', headerName: 'Cửa hàng', flex: 1, renderCell: (params) => params.value || 'N/A' },
        {
            field: 'actions',
            headerName: 'Hành động',
            flex: 2,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton onClick={() => onEdit(params.row)}>
                        <EditIcon color="primary" />
                    </IconButton>
                    <IconButton onClick={() => onDelete(params.id)}>
                        <DeleteIcon color="error" />
                    </IconButton>
                    <IconButton onClick={() => onToggleStatus(params.id)}>
                        <SwapHorizIcon color="warning" />
                    </IconButton>
                    {/*<IconButton onClick={() => onUpdateStatus(params.id, true)}>*/}
                    {/*    <CheckCircleIcon color="success" />*/}
                    {/*</IconButton>*/}
                    {/*<IconButton onClick={() => onUpdateStatus(params.id, false)}>*/}
                    {/*    <CancelIcon color="disabled" />*/}
                    {/*</IconButton>*/}
                </>
            ),
        },
    ];

    return (
        <div style={{ height: 400 }}>
            <DataGrid
                rows={users}
                columns={userColumns}
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

export default UserTable;