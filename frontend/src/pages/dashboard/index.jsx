import React, {useState, useMemo} from "react";
import DashboardBoxes from "../../components/dashboard-boxes/index.jsx";
import Button from "@mui/material/Button";
import {FaPlus} from "react-icons/fa6";
import RevenueLineChart from "../../components/charts/RevenueLineChart.jsx";
import StockBarChart from "../../components/charts/StockBarChart.jsx";
import OrderStatusPieChart from "../../components/charts/OrderStatusPieChart.jsx";
import OrdersTable from "../../components/tables/OrdersTable.jsx";
import ProductsTable from "../../components/tables/ProductsTable.jsx";
import useDashboardSummary from "../../hooks/useDashboardSummary.js";
import { userService } from "../../services/userService";
import { useEffect } from "react";
import { getStoreById } from "../../services/storeService";
import useRevenueTrend from "../../hooks/useRevenueTrend";
import useStockByCategory from "../../hooks/useStockByCategory";
import useTopProducts from "../../hooks/useTopProducts";
import useTopCustomers from "../../hooks/useTopCustomers";
import useRecentImportTransactions from "../../hooks/useRecentImportTransactions";
import useRecentSaleTransactions from "../../hooks/useRecentSaleTransactions";

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

const orderStatusData = [
    {name: 'Paid', value: orders.filter(o => o.status === 'Paid').length},
    {name: 'Pending', value: orders.filter(o => o.status === 'Pending').length},
    {name: 'Failed', value: orders.filter(o => o.status === 'Failed').length},
];


const Dashboard = () => {
    // State cho filter thời gian
    const [timeFilter, setTimeFilter] = useState("weekly"); // Giá trị mặc định hợp lệ
    // Map timeFilter sang type cho API
    let type = "day";
    if (timeFilter === "monthly") type = "month";
    if (timeFilter === "annually") type = "year";
    // Tính toán khoảng thời gian mặc định (7 ngày gần nhất)
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const from = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    // Lấy dữ liệu từ API
    const { data: revenueData, loading: loadingRevenue, error: errorRevenue } = useRevenueTrend({ type, from, to });
    const { data: stockData, loading: loadingStock, error: errorStock } = useStockByCategory();
    const { data: topProducts, loading: loadingTopProducts, error: errorTopProducts } = useTopProducts({ from, to, limit: 5 });
    const { data: topCustomers, loading: loadingTopCustomers, error: errorTopCustomers } = useTopCustomers({ from, to, limit: 5 });
    const { data: recentImports, loading: loadingImports, error: errorImports } = useRecentImportTransactions(5);
    const { data: recentSales, loading: loadingSales, error: errorSales } = useRecentSaleTransactions(5);
    // Map stockData để hiển thị tên category
    const stockChartData = stockData.map(item => ({ name: item.category, stock: item.stock }));
    const { summary, loading, error } = useDashboardSummary();
    const [user, setUser] = useState(null);
    const [storeName, setStoreName] = useState("");

    useEffect(() => {
        userService.getCurrentUser().then(u => {
            setUser(u);
            if (u?.role === "STAFF") {
                if (u.storeName) setStoreName(u.storeName);
                else if (u.storeId) {
                    getStoreById(u.storeId).then(store => {
                        setStoreName(store.storeName || store.name || "");
                    });
                }
            }
        });
    }, []);

    return (
        <div className="p-5 bg-gray-100 min-h-screen"> {/* Thêm padding và background cho toàn bộ trang */}
            <div
                className="w-full py-6 px-8 bg-white rounded-lg shadow-md flex items-center gap-8 mb-6 justify-between"> {/* Đổi border thành shadow, tăng padding, bo tròn góc */}
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2"> {/* Tăng cỡ chữ, đổi font, màu sắc */}
                        Good Morning,
                        <br/>
                        {user ? user.fullName || user.username : "..."}
                    </h1>
                    {/* Hiển thị tên Kho đã được thiết kế riêng */}
                    {user?.role === "STAFF" && storeName && (
                        <p className="text-xl font-semibold text-indigo-600 mt-2"> {/* Tăng cỡ chữ, font, màu sắc cho tên Kho */}
                            Kho: {storeName}
                        </p>
                    )}
                    <p className="text-lg text-gray-600 mt-3">Here’s what’s happening on your store today.</p>
                </div>
                <img src="/shop-illustration.webp" alt="Shop Illustration" className="w-64 h-auto rounded-lg shadow-sm"/> {/* Tăng kích thước ảnh, thêm bo tròn và shadow */}
            </div>

            {loading ? (
                <div className="text-center text-gray-500 text-lg py-10">Loading dashboard summary...</div>
            ) : (
                <DashboardBoxes
                    totalProducts={summary?.totalProducts}
                    totalCustomers={summary?.totalCustomers}
                    totalSuppliers={summary?.totalSuppliers}
                    totalImportOrders={summary?.totalImportOrders}
                    totalExportOrders={summary?.totalExportOrders}
                    totalRevenue={summary?.totalRevenue}
                    expiringLots={summary?.expiringLots}
                />
            )}
            {error && <div className="text-red-600 text-center py-4">{error}</div>} {/* Đổi style trực tiếp thành class TailwindCSS */}

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-8"> {/* Chia 2 cột, tăng gap, margin */}
                <div className="bg-white p-8 rounded-lg shadow-md"> {/* Tăng padding */}
                    {loadingRevenue ? (
                        <div>Đang tải dữ liệu doanh thu...</div>
                    ) : errorRevenue ? (
                        <div className="text-red-600">{errorRevenue}</div>
                    ) : (
                        <RevenueLineChart data={revenueData} timeFilter={timeFilter} setTimeFilter={setTimeFilter}/>
                    )}
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md">
                    {loadingStock ? (
                        <div>Đang tải dữ liệu tồn kho...</div>
                    ) : errorStock ? (
                        <div className="text-red-600">{errorStock}</div>
                    ) : (
                        <StockBarChart data={stockChartData}/>
                    )}
                </div>
            </div>

            {/* Top Products & Top Customers Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Top Sản phẩm bán chạy</h2>
                    {loadingTopProducts ? (
                        <div>Đang tải...</div>
                    ) : errorTopProducts ? (
                        <div className="text-red-600">{errorTopProducts}</div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4">#</th>
                                    <th className="py-2 px-4">Sản phẩm</th>
                                    <th className="py-2 px-4">Nhóm</th>
                                    <th className="py-2 px-4">Số lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((item, idx) => (
                                    <tr key={item.productName + idx}>
                                        <td className="py-2 px-4">{idx + 1}</td>
                                        <td className="py-2 px-4">{item.productName}</td>
                                        <td className="py-2 px-4">{item.category}</td>
                                        <td className="py-2 px-4">{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Top Khách hàng mua nhiều nhất</h2>
                    {loadingTopCustomers ? (
                        <div>Đang tải...</div>
                    ) : errorTopCustomers ? (
                        <div className="text-red-600">{errorTopCustomers}</div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4">#</th>
                                    <th className="py-2 px-4">Khách hàng</th>
                                    <th className="py-2 px-4">Tổng tiền</th>
                                    <th className="py-2 px-4">Số đơn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCustomers.map((item, idx) => (
                                    <tr key={item.customerName + idx}>
                                        <td className="py-2 px-4">{idx + 1}</td>
                                        <td className="py-2 px-4">{item.customerName}</td>
                                        <td className="py-2 px-4">{item.totalAmount?.toLocaleString()}</td>
                                        <td className="py-2 px-4">{item.orderCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Latest Import Transactions */}
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold mb-4">Latest Import Transactions</h2>
                {loadingImports ? (
                    <div>Đang tải...</div>
                ) : errorImports ? (
                    <div className="text-red-600">{errorImports}</div>
                ) : (
                    <OrdersTable orders={recentImports.map((item, idx) => ({
                        id: item.id,
                        product: item.name || item.id,
                        customer: item.supplierName || "",
                        category: item.storeId || "",
                        price: item.totalAmount,
                        created: item.importDate?.slice(0, 10),
                        status: item.status,
                    }))} />
                )}
            </div>

            {/* Latest Sale Transactions */}
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold mb-4">Latest Sale Transactions</h2>
                {loadingSales ? (
                    <div>Đang tải...</div>
                ) : errorSales ? (
                    <div className="text-red-600">{errorSales}</div>
                ) : (
                    <OrdersTable orders={recentSales.map((item, idx) => ({
                        id: item.id,
                        product: item.name || item.id,
                        customer: item.customerName || "",
                        category: item.storeName || "",
                        price: item.totalAmount,
                        created: item.saleDate?.slice(0, 10),
                        status: item.status,
                    }))} />
                )}
            </div>

            {/* XÓA BẢNG Recent Orders và Product Stock Overview */}
        </div>
    );
};

export default Dashboard;
