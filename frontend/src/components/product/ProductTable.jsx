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
        console.log('Product codes:', products.map(p => p.productCode));
        console.log('Category names:', products.map(p => p.categoryName));
        console.log('Store names:', products.map(p => p.storeName));
    }

    // Thêm STT vào products với index dựa trên vị trí thực tế
    const productsWithStt = products && products.length > 0 ? products.map((product, index) => ({
        ...product,
        stt: index + 1
    })) : [];
    
    console.log('Products with STT:', productsWithStt);


    const columns = [
        { 
            field: 'stt', 
            headerName: 'STT', 
            width: 80,
            renderCell: (params) => {
                // Sử dụng index từ products array gốc
                if (!products || !params.row) return <span style={{ fontWeight: 'bold', color: '#666' }}>-</span>;
                const index = products.findIndex(p => p.id === params.row.id);
                const stt = index >= 0 ? index + 1 : '';
                return <span style={{ fontWeight: 'bold', color: '#666' }}>{stt}</span>;
            },
            sortable: false
        },
        { 
            field: 'productCode', 
            headerName: 'Mã sản phẩm', 
            width: 120,
            renderCell: (params) => {
                const code = params.row.productCode;
                return (
                    <span style={{ 
                        fontWeight: 'bold', 
                        color: code ? '#1976d2' : '#999',
                        backgroundColor: code ? '#e3f2fd' : '#f5f5f5',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                    }}>
                        {code || 'N/A'}
                    </span>
                );
            }
        },
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
                rows={productsWithStt}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                disableRowSelectionOnClick
                getRowId={(row) => row.id || Math.random()}
                initialState={{
                    sorting: {
                        sortModel: [],
                    },
                }}
                sortingMode="server"
                disableColumnSorting={true}
                paginationMode="client"
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
