import React, { useState, useMemo } from "react";
import DashboardBoxes from "../../components/DashboardBoxes/index.jsx";
import Button from "@mui/material/Button";
import { FaPlus } from "react-icons/fa6";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, TextField } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const orders = [
    { id: 1, product: 'Apple MacBook Pro 17"', customer: 'Silver', category: 'Laptop', price: 2999, created: '2023-06-15', status: 'Paid' },
    { id: 2, product: 'Microsoft Surface Pro', customer: 'White', category: 'Laptop PC', price: 1999, created: '2023-06-14', status: 'Pending' },
    { id: 3, product: 'Magic Mouse 2', customer: 'Black', category: 'Accessories', price: 99, created: '2023-06-13', status: 'Failed' },
    { id: 4, product: 'Google Pixel Phone', customer: 'Gray', category: 'Phone', price: 799, created: '2023-06-12', status: 'Paid' },
    { id: 5, product: 'Apple Watch 5', customer: 'Red', category: 'Wearables', price: 999, created: '2023-06-11', status: 'Pending' },
];


const products = [
    { id: 101, name: "MacBook Pro", stock: 20, category: "Laptop", price: 2999 },
    { id: 102, name: "Surface Laptop", stock: 15, category: "Laptop", price: 1999 },
    { id: 103, name: "iPhone 14", stock: 30, category: "Phone", price: 1099 },
    { id: 104, name: "Magic Mouse", stock: 40, category: "Accessories", price: 99 },
    { id: 105, name: "AirPods Pro", stock: 50, category: "Wearables", price: 249 },
];

const orderColumns = [
    { field: 'product', headerName: 'Order Id', flex: 1 },
    { field: 'customer', headerName: 'Customer', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    { field: 'price', headerName: 'Price', flex: 1, type: 'number' },
    { field: 'created', headerName: 'Created', flex: 1 },
    {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        renderCell: (params) => {
            const status = params.value;

            const colorDot =
                status === 'Paid' ? 'bg-green-500' :
                    status === 'Pending' ? 'bg-yellow-500' :
                        'bg-red-500';

            const textColor =
                status === 'Paid' ? 'text-green-600' :
                    status === 'Pending' ? 'text-yellow-600' :
                        'text-red-600';

            return (
                <div className={`flex items-center gap-2 font-medium ${textColor}`}>
                    <span className={`w-3 h-3 rounded-full ${colorDot}`} />
                    <span>{status}</span>
                </div>
            );
        }
    },
    {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        flex: 1,
        renderCell: (params) => (
            <>
                <IconButton onClick={() => alert("Edit row " + params.id)}><EditIcon color="primary" /></IconButton>
                <IconButton onClick={() => alert("Delete row " + params.id)}><DeleteIcon color="error" /></IconButton>
            </>
        ),
    },
];

const productColumns = [
    { field: 'name', headerName: 'Product Name', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    { field: 'stock', headerName: 'Stock', flex: 1, type: 'number' },
    { field: 'price', headerName: 'Price', flex: 1, type: 'number' },
    {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        flex: 1,
        renderCell: (params) => (
            <>
                <IconButton onClick={() => alert("Edit product " + params.id)}><EditIcon color="primary" /></IconButton>
                <IconButton onClick={() => alert("Delete product " + params.id)}><DeleteIcon color="error" /></IconButton>
            </>
        ),
    },
];

const Dashboard = () => {
    const [searchOrder, setSearchOrder] = useState("");
    const [searchProduct, setSearchProduct] = useState("");

    const filteredOrders = useMemo(() =>
        orders.filter(row =>
            row.product.toLowerCase().includes(searchOrder.toLowerCase())
        ), [searchOrder]);

    const filteredProducts = useMemo(() =>
        products.filter(row =>
            row.name.toLowerCase().includes(searchProduct.toLowerCase())
        ), [searchProduct]);

    return (
        <>
            <div className="w-full py-2 px-5 border bg-white border-[rgba(0,0,0,0.1)] flex items-center gap-8 mb-5 justify-between rounded-md">
                <div className="info">
                    <h1 className="text-[35px] font-bold leading-10 mb-3">
                        Good Morning,<br />Lam
                    </h1>
                    <p>Here’s What happening on your store today. See the statistics at once.</p>
                    <br />
                    <Button className="btn-blue !capitalize">
                        <FaPlus /> Add Product
                    </Button>
                </div>
                <img src="/shop-illustration.webp" className="w-[250px]" />
            </div>

            <DashboardBoxes />

            {/* ========== Recent Orders Table ========== */}
            <div className="card my-4 shadow-md sm:rounded-lg bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] font-[600]">Recent Orders</h2>
                    <TextField
                        label="Search Orders"
                        variant="outlined"
                        size="small"
                        value={searchOrder}
                        onChange={(e) => setSearchOrder(e.target.value)}
                    />
                </div>
                <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                        rows={filteredOrders}
                        columns={orderColumns}
                        pageSize={5}
                        rowsPerPageOptions={[5, 10]}
                        checkboxSelection
                        disableSelectionOnClick
                    />
                </div>
            </div>

            {/* ========== Product Table ========== */}
            <div className="card my-4 shadow-md sm:rounded-lg bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] font-[600]">Product List</h2>
                    <TextField
                        label="Search Products"
                        variant="outlined"
                        size="small"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                    />
                </div>
                <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                        rows={filteredProducts}
                        columns={productColumns}
                        pageSize={5}
                        rowsPerPageOptions={[5, 10]}
                        checkboxSelection
                        disableSelectionOnClick
                    />
                </div>
            </div>
        </>
    );
};

export default Dashboard;
