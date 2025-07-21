import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ProductTable = ({ products, onEdit, onDelete }) => {
    // Debug: kiểm tra dữ liệu products
    console.log('ProductTable received products:', products);
    if (products && products.length > 0) {
        console.log('First product sample:', products[0]);
        console.log('Category names:', products.map(p => p.categoryName));
        console.log('Store names:', products.map(p => p.storeName));
    }
    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'productName', headerName: 'Tên sản phẩm', width: 200 },
        { field: 'productDescription', headerName: 'Mô tả', width: 250 },
        { field: 'productQuantity', headerName: 'Số lượng', width: 120 },
        {
            field: 'categoryName',
            headerName: 'Danh mục',
            width: 150,
            renderCell: (params) => {
                const value = params.row.categoryName;
                return <span>{value || 'N/A'}</span>;
            },
        },
        {
            field: 'storeName',
            headerName: 'Cửa hàng',
            width: 150,
            renderCell: (params) => {
                const value = params.row.storeName;
                return <span>{value || 'N/A'}</span>;
            },
        },
        {
            field: 'createdAt',
            headerName: 'Ngày tạo',
            width: 150,
            renderCell: (params) => {
                const value = params.row.createdAt;
                return value ? new Date(value).toLocaleDateString('vi-VN') : 'N/A';
            },
        },
        {
            field: 'updatedAt',
            headerName: 'Cập nhật lần cuối',
            width: 150,
            renderCell: (params) => {
                const value = params.row.updatedAt;
                return value ? new Date(value).toLocaleDateString('vi-VN') : 'N/A';
            },
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 150,
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
                rows={products}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                initialState={{
                    sorting: {
                        sortModel: [],
                    },
                }}
                sortingMode="server"
                disableColumnSorting={true}
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

export default ProductTable;
