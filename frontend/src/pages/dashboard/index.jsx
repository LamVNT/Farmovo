import React, { useState, useMemo } from "react";
import DashboardBoxes from "../../components/DashboardBoxes/index.jsx";
import Button from "@mui/material/Button";
import { FaPlus } from "react-icons/fa6";
import { DataGrid } from "@mui/x-data-grid";
import {
    IconButton, TextField, MenuItem, Select,
    FormControl, InputLabel
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Progress from "../../components/ProgressBar";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

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

const revenueData = [
    { date: '2025-06-11', revenue: 999 },
    { date: '2025-06-12', revenue: 799 },
    { date: '2025-06-13', revenue: 99 },
    { date: '2025-06-14', revenue: 1999 },
    { date: '2025-06-15', revenue: 2999 },
];

const orderStatusData = [
    { name: 'Paid', value: orders.filter(o => o.status === 'Paid').length },
    { name: 'Pending', value: orders.filter(o => o.status === 'Pending').length },
    { name: 'Failed', value: orders.filter(o => o.status === 'Failed').length },
];

const pieColors = ['#4CAF50', '#FFC107', '#F44336'];

const stockData = products.map(p => ({ name: p.name, stock: p.stock }));

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
            const colorDot = params.value === 'Paid' ? 'bg-green-500'
                : params.value === 'Pending' ? 'bg-yellow-500'
                    : 'bg-red-500';
            const textColor = params.value === 'Paid' ? 'text-green-600'
                : params.value === 'Pending' ? 'text-yellow-600'
                    : 'text-red-600';
            return (
                <div className={`flex items-center gap-2 font-medium ${textColor}`}>
                    <span className={`w-3 h-3 rounded-full ${colorDot}`} />
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
                <IconButton onClick={() => alert("Edit row " + params.id)}><EditIcon color="primary" /></IconButton>
                <IconButton onClick={() => alert("Delete row " + params.id)}><DeleteIcon color="error" /></IconButton>
            </>
        )
    }
];

const productColumns = [
    { field: 'name', headerName: 'Product Name', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    {  field: 'stock',
        headerName: 'Stock',
        flex: 1,
        renderCell: (params) => {
            const stock = params.value;
            const percentage = Math.min((stock / 50) * 100, 100); // 50 là max giả định
            const type = percentage < 30 ? 'warning' : percentage < 70 ? 'info' : 'success';

            return (
                <div className="flex items-center">
                    <div className="text-sm font-medium mb-1">{stock}</div>
                    <Progress percentage={percentage} type={type} />
                </div>
            );
        } },
    { field: 'price', headerName: 'Price', flex: 1 },
    {
        field: 'actions',
        headerName: 'Actions',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
            <>
                <IconButton onClick={() => alert("Edit product " + params.id)}><EditIcon color="primary" /></IconButton>
                <IconButton onClick={() => alert("Delete product " + params.id)}><DeleteIcon color="error" /></IconButton>
            </>
        )

    }

];

const Dashboard = () => {
    const [searchOrder, setSearchOrder] = useState("");
    const [searchProduct, setSearchProduct] = useState("");
    const [timeFilter, setTimeFilter] = useState("monthly");

    const filteredOrders = useMemo(() =>
        orders.filter(o =>
            o.product.toLowerCase().includes(searchOrder.toLowerCase())
        ), [searchOrder]);

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(searchProduct.toLowerCase())
        ), [searchProduct]);

    const filteredRevenueData = useMemo(() => {
        if (timeFilter === "weekly") {
            return revenueData.slice(-7);
        } else if (timeFilter === "annually") {
            const byYear = {};
            revenueData.forEach(item => {
                const year = new Date(item.date).getFullYear();
                byYear[year] = (byYear[year] || 0) + item.revenue;
            });
            return Object.entries(byYear).map(([year, revenue]) => ({
                date: year,
                revenue,
            }));
        }
        return revenueData;
    }, [timeFilter]);

    return (
        <>
            <div className="w-full py-2 px-5 border bg-white border-[rgba(0,0,0,0.1)] flex items-center gap-8 mb-5 justify-between rounded-md">
                <div>
                    <h1 className="text-[35px] font-bold mb-3">Good Morning,<br />Lam</h1>
                    <p>Here’s what’s happening on your store today.</p>
                    <br />
                    <Button className="btn-blue !capitalize">
                        <FaPlus /> Add Product
                    </Button>
                </div>
                <img src="/shop-illustration.webp" className="w-[250px]" />
            </div>

            <DashboardBoxes />

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 my-4">
                {/* Line Chart */}
                <div className="bg-white p-5 shadow-md rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Revenue Trend</h3>
                        <FormControl size="small">
                            <InputLabel id="time-select-label">Time</InputLabel>
                            <Select
                                labelId="time-select-label"
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                label="Time"
                                style={{ width: 120 }}
                            >
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                                <MenuItem value="annually">Annually</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={filteredRevenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="bg-white p-5 shadow-md rounded-lg">
                    <h3 className="font-semibold mb-2">Stock Overview</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stockData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="stock" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-5 shadow-md rounded-lg">
                    <h3 className="font-semibold mb-2">Order Status</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={orderStatusData}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                label
                                dataKey="value"
                            >
                                {orderStatusData.map((entry, index) => (
                                    <Cell key={index} fill={pieColors[index % pieColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Orders Table */}
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
                <div style={{ height: 400 }}>
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

            {/* Products Table */}
            <div className="card my-4 shadow-md sm:rounded-lg bg-white p-5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Product List</h2>
                    <TextField
                        label="Search Products"
                        size="small"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                    />
                </div>
                <div style={{ height: 400 }}>
                    <DataGrid
                        rows={filteredProducts}
                        columns={productColumns}
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
        </>
    );
};

export default Dashboard;
