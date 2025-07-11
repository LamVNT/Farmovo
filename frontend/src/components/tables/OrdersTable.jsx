import {DataGrid} from "@mui/x-data-grid";
import {IconButton, TextField} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {useMemo, useState} from "react";

const OrdersTable = ({orders}) => {
    const [searchOrder, setSearchOrder] = useState("");

    const filteredOrders = useMemo(() =>
        orders.filter(o =>
            o.product.toLowerCase().includes(searchOrder.toLowerCase())
        ), [searchOrder, orders]);

    const orderColumns = [
        {field: 'product', headerName: 'Order Id', flex: 1},
        {field: 'customer', headerName: 'Customer', flex: 1},
        {field: 'category', headerName: 'Category', flex: 1},
        {field: 'price', headerName: 'Price', flex: 1, type: 'number'},
        {field: 'created', headerName: 'Created', flex: 1},
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            renderCell: (params) => {
                const colorDot = params.value === 'Paid' ? 'bg-green-500'
                    : params.value === 'Pending' ? 'bg-yellow-500'
                        : 'bg-red-500';
                const textColor = params.value === 'Paid' ? 'text-green-600'
                    : params.value === 'Pending' ? 'text-yellow-600'
                        : 'text-red-600';
                return (
                    <div className={`flex items-center gap-2 font-medium ${textColor}`}>
                        <span className={`w-3 h-3 rounded-full ${colorDot}`}/>
                        <span>{params.value}</span>
                    </div>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton onClick={() => alert("Edit row " + params.id)}><EditIcon color="primary"/></IconButton>
                    <IconButton onClick={() => alert("Delete row " + params.id)}><DeleteIcon
                        color="error"/></IconButton>
                </>
            )
        }
    ];

    return (
        <div className="card my-4 shadow-md sm:rounded-lg bg-white p-5">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <TextField
                    label="Search Orders"
                    size="small"
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                />
            </div>
            <div style={{height: 400}}>
                <DataGrid
                    rows={filteredOrders}
                    columns={orderColumns}
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
        </div>
    );
};

export default OrdersTable;
