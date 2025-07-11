import React from 'react';
import {DataGrid} from '@mui/x-data-grid';
import {IconButton} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ProductTable = ({products, onEdit, onDelete}) => {
    const columns = [
        {field: 'id', headerName: 'ID', flex: 0.5},
        {field: 'productName', headerName: 'Tên sản phẩm', flex: 1.5},
        {field: 'productDescription', headerName: 'Mô tả', flex: 2},
        {field: 'productQuantity', headerName: 'Số lượng', flex: 1},
        {
            field: 'categoryName',
            headerName: 'Danh mục',
            flex: 1,
            valueGetter: (params) => params.row?.categoryName || 'N/A',
        },
        {
            field: 'storeName',
            headerName: 'Cửa hàng',
            flex: 1,
            valueGetter: (params) => params.row?.storeName || 'N/A',
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            flex: 1,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton onClick={() => onEdit(params.row)}>
                        <EditIcon color="primary"/>
                    </IconButton>
                    <IconButton onClick={() => onDelete(params.id)}>
                        <DeleteIcon color="error"/>
                    </IconButton>
                </>
            ),
        },
    ];

    return (
        <div style={{height: 400}}>
            <DataGrid
                rows={products}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
                disableSelectionOnClick
                getRowId={(row) => row.id}
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

export default ProductTable;
