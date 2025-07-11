import React, {useMemo, useState} from "react";
import DashboardBoxes from "../../components/dashboard-boxes/index.jsx";
import Button from "@mui/material/Button";
import {FaPlus} from "react-icons/fa6";
import RevenueLineChart from "../../components/charts/RevenueLineChart.jsx";
import StockBarChart from "../../components/charts/StockBarChart.jsx";
import OrderStatusPieChart from "../../components/charts/OrderStatusPieChart.jsx";
import OrdersTable from "../../components/tables/OrdersTable.jsx";
import ProductsTable from "../../components/tables/ProductsTable.jsx";

const orders = [
    {
        id: 1,
        product: 'Apple MacBook Pro 17"',
        customer: 'Silver',
        category: 'Laptop',
        price: 2999,
        created: '2023-06-15',
        status: 'Paid'
    },
    {
        id: 2,
        product: 'Microsoft Surface Pro',
        customer: 'White',
        category: 'Laptop PC',
        price: 1999,
        created: '2023-06-14',
        status: 'Pending'
    },
    {
        id: 3,
        product: 'Magic Mouse 2',
        customer: 'Black',
        category: 'Accessories',
        price: 99,
        created: '2023-06-13',
        status: 'Failed'
    },
    {
        id: 4,
        product: 'Google Pixel Phone',
        customer: 'Gray',
        category: 'Phone',
        price: 799,
        created: '2023-06-12',
        status: 'Paid'
    },
    {
        id: 5,
        product: 'Apple Watch 5',
        customer: 'Red',
        category: 'Wearables',
        price: 999,
        created: '2023-06-11',
        status: 'Pending'
    },
];

const products = [
    {id: 101, name: "MacBook Pro", stock: 20, category: "Laptop", price: 2999},
    {id: 102, name: "Surface Laptop", stock: 15, category: "Laptop", price: 1999},
    {id: 103, name: "iPhone 14", stock: 30, category: "Phone", price: 1099},
    {id: 104, name: "Magic Mouse", stock: 40, category: "Accessories", price: 99},
    {id: 105, name: "AirPods Pro", stock: 50, category: "Wearables", price: 249},
];

const revenueData = [
    {date: '2025-06-11', revenue: 999},
    {date: '2025-06-12', revenue: 799},
    {date: '2025-06-13', revenue: 99},
    {date: '2025-06-14', revenue: 1999},
    {date: '2025-06-15', revenue: 2999},
];

const orderStatusData = [
    {name: 'Paid', value: orders.filter(o => o.status === 'Paid').length},
    {name: 'Pending', value: orders.filter(o => o.status === 'Pending').length},
    {name: 'Failed', value: orders.filter(o => o.status === 'Failed').length},
];


const stockData = products.map(p => ({name: p.name, stock: p.stock}));

const Dashboard = () => {
    const [timeFilter, setTimeFilter] = useState("monthly");
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
            <div
                className="w-full py-2 px-5 border bg-white border-[rgba(0,0,0,0.1)] flex items-center gap-8 mb-5 justify-between rounded-md">
                <div>
                    <h1 className="text-[35px] font-bold mb-3">Good Morning,<br/>Lam</h1>
                    <p>Here’s what’s happening on your store today.</p>
                    <br/>
                    <Button className="btn-blue !capitalize">
                        <FaPlus/> Add Product
                    </Button>
                </div>
                <img src="/shop-illustration.webp" className="w-[250px]"/>
            </div>

            <DashboardBoxes/>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 my-4">
                {/* Line Chart */}
                <RevenueLineChart data={filteredRevenueData} timeFilter={timeFilter} setTimeFilter={setTimeFilter}/>
                <StockBarChart data={stockData}/>
                <OrderStatusPieChart data={orderStatusData}/>
            </div>

            <OrdersTable orders={orders}/>
            <ProductsTable products={products}/>
        </>
    );
};

export default Dashboard;
