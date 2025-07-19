import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const StoreTable = ({ rows, onEdit, onDelete }) => {
    const columns = [
        { field: "name", headerName: "Tên cửa hàng", flex: 1, headerAlign: 'center', align: 'left' },
        { field: "address", headerName: "Địa chỉ", flex: 2, headerAlign: 'center', align: 'left' },
        {
            field: "actions",
            headerName: "Hành động",
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            renderCell: (params) => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, width: '100%' }}>
                    <IconButton title="Chỉnh sửa" onClick={() => onEdit(params.row)} size="small" sx={{ color: '#1976d2' }}>
                        <EditIcon />
                    </IconButton>
                    <IconButton title="Xóa" onClick={() => onDelete(params.id)} size="small" sx={{ color: '#d32f2f' }}>
                        <DeleteIcon />
                    </IconButton>
                </div>
            ),
        },
    ];

    return (
        <div style={{ height: 480, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                disableRowSelectionOnClick
                sx={{
                    borderRadius: 3,
                    boxShadow: 3,
                    fontFamily: 'Roboto, Arial, sans-serif',
                    background: '#fff',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#e3e6f0',
                        fontWeight: 'bold',
                        fontSize: 16,
                        color: '#222',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                    },
                }}
            />
        </div>
    );
};

export default StoreTable; 