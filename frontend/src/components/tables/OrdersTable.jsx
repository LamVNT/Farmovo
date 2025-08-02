import {DataGrid} from "@mui/x-data-grid";
import {TextField} from "@mui/material";
import {useState, useMemo} from "react";

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
                const value = params.value;
                let color = '';
                let bg = '';
                switch (value) {
                    case 'Complete':
                        color = 'text-green-700';
                        bg = 'bg-green-500';
                        break;
                    case 'Cancel':
                        color = 'text-red-700';
                        bg = 'bg-red-100';
                        break;
                    case 'Draft':
                        color = 'text-yellow-700';
                        bg = 'bg-yellow-100';
                        break;
                    case 'Pending':
                        color = 'text-blue-700';
                        bg = 'bg-blue-100';
                        break;
                    case 'Processing':
                        color = 'text-indigo-700';
                        bg = 'bg-indigo-100';
                        break;
                    default:
                        color = 'text-gray-700';
                        bg = 'bg-gray-100';
                }
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{value}</span>
                );
            }
        },
        // Đã loại bỏ cột actions cho bảng Dashboard
    ];

    return (
        <div className="card my-4 shadow-lg rounded-2xl bg-gradient-to-br from-white via-indigo-50 to-indigo-100 p-5">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-indigo-700 drop-shadow-sm">Recent Orders</h2>
                <TextField
                    label="Tìm kiếm đơn hàng"
                    size="small"
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    sx={{ background: 'white', borderRadius: 2 }}
                />
            </div>
            <div style={{height: 360}}>
                <DataGrid
                    rows={filteredOrders}
                    columns={orderColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                    sx={{
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 2px 12px 0 rgba(99,102,241,0.08)',
                        '& .MuiDataGrid-columnHeaders': {
                            background: 'linear-gradient(90deg,#e0e7ff 0%,#f5f5f5 100%)',
                            fontWeight: 'bold',
                            fontSize: 15,
                            color: '#3730a3',
                        },
                        '& .MuiDataGrid-row': {
                            transition: 'background 0.2s',
                        },
                        '& .MuiDataGrid-row:hover': {
                            background: '#e0e7ff33',
                        },
                        '& .MuiDataGrid-cell': {
                            fontSize: 14,
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default OrdersTable;
