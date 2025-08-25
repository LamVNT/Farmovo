import React, {useState, useMemo, useContext} from "react";
import {MyContext} from "../../App.jsx";
import DashboardBoxes from "../../components/dashboard-boxes/index.jsx";
import Button from "@mui/material/Button";
import {Link} from "react-router-dom";
import {FaPlus} from "react-icons/fa6";
import RevenueLineChart from "../../components/charts/RevenueLineChart.jsx";
import StockBarChart from "../../components/charts/StockBarChart.jsx";
import OrderStatusPieChart from "../../components/charts/OrderStatusPieChart.jsx";
import OrdersTable from "../../components/tables/OrdersTable.jsx";
import ProductsTable from "../../components/tables/ProductsTable.jsx";
import useDashboardSummary from "../../hooks/useDashboardSummary.js";
import {useEffect} from "react";
import {getStoreById} from "../../services/storeService";
import { useAuth } from "../../contexts/AuthorizationContext";
import useRevenueTrend from "../../hooks/useRevenueTrend";
import useStockByCategory from "../../hooks/useStockByCategory";
import useTopProducts from "../../hooks/useTopProducts";
import useTopCustomers from "../../hooks/useTopCustomers";
import useRecentImportTransactions from "../../hooks/useRecentImportTransactions";
import useRecentSaleTransactions from "../../hooks/useRecentSaleTransactions";
import { formatCurrency } from "../../utils/formatters";

const orders = [
    {
        id: 1,
        product: 'Apple MacBook Pro 17"',
        customer: 'Bạc',
        category: 'Laptop',
        price: 2999,
        created: '2023-06-15',
        status: 'Đã thanh toán'
    },
    {
        id: 2,
        product: 'Microsoft Surface Pro',
        customer: 'Trắng',
        category: 'Laptop PC',
        price: 1999,
        created: '2023-06-14',
        status: 'Chờ xử lý'
    },
    {
        id: 3,
        product: 'Magic Mouse 2',
        customer: 'Đen',
        category: 'Phụ kiện',
        price: 99,
        created: '2023-06-13',
        status: 'Thất bại'
    },
    {
        id: 4,
        product: 'Google Pixel Phone',
        customer: 'Xám',
        category: 'Điện thoại',
        price: 799,
        created: '2023-06-12',
        status: 'Đã thanh toán'
    },
    {
        id: 5,
        product: 'Apple Watch 5',
        customer: 'Đỏ',
        category: 'Đồ đeo',
        price: 999,
        created: '2023-06-11',
        status: 'Chờ xử lý'
    },
];

const products = [
    {id: 101, name: "MacBook Pro", stock: 20, category: "Laptop", price: 2999},
    {id: 102, name: "Surface Laptop", stock: 15, category: "Laptop", price: 1999},
    {id: 103, name: "iPhone 14", stock: 30, category: "Điện thoại", price: 1099},
    {id: 104, name: "Magic Mouse", stock: 40, category: "Phụ kiện", price: 99},
    {id: 105, name: "AirPods Pro", stock: 50, category: "Đồ đeo", price: 249},
];

const orderStatusData = [
    {name: 'Đã thanh toán', value: orders.filter(o => o.status === 'Đã thanh toán').length},
    {name: 'Chờ xử lý', value: orders.filter(o => o.status === 'Chờ xử lý').length},
    {name: 'Thất bại', value: orders.filter(o => o.status === 'Thất bại').length},
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

    // --- Controls for Top lists ---
    const [topLimit, setTopLimit] = useState(5);
    const [topRange, setTopRange] = useState(7); // days: 7, 30, 90
    const topTo = to;
    const topFrom = new Date(today.getTime() - (topRange - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    // Lấy dữ liệu từ API
    const {data: revenueData, loading: loadingRevenue, error: errorRevenue} = useRevenueTrend({type, from, to});
    const {data: stockData, loading: loadingStock, error: errorStock} = useStockByCategory();
    const {data: topProducts, loading: loadingTopProducts, error: errorTopProducts} = useTopProducts({
        from: topFrom,
        to: topTo,
        limit: topLimit
    });
    const {data: topCustomers, loading: loadingTopCustomers, error: errorTopCustomers} = useTopCustomers({
        from: topFrom,
        to: topTo,
        limit: topLimit
    });
    const {data: recentImports, loading: loadingImports, error: errorImports} = useRecentImportTransactions(5);
    const {data: recentSales, loading: loadingSales, error: errorSales} = useRecentSaleTransactions(5);
    // Map stockData để hiển thị tên category
    const stockChartData = stockData.map(item => ({name: item.category, stock: item.stock}));
    const {summary, loading, error} = useDashboardSummary();
    const [storeName, setStoreName] = useState("");
    const { user, isStaff } = useAuth();

    useEffect(() => {
        if (user && isStaff()) {
            if (user.storeName) {
                setStoreName(user.storeName);
            } else if (user.storeId) {
                getStoreById(user.storeId).then(store => {
                    setStoreName(store.storeName || store.name || "");
                });
            }
        }
    }, [user, isStaff]);


    const context = useContext(MyContext);
    // Header cải tiến
    return (
        <div className="p-2 bg-gray-100 min-h-screen">
            <div
                className="w-full py-4 px-6 bg-gradient-to-r from-[#f8fafc] to-[#e0e7ff] rounded-xl shadow-lg flex items-center gap-6 mb-6 justify-between">
                <div className="flex-1 pl-2">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
                        Xin chào,
                        <br/>
                        <span className="text-indigo-700">{user ? user.fullName || user.username : "..."}</span>
                    </h1>
                    {isStaff() && storeName && (
                        <p className="text-xl font-semibold text-indigo-600 mt-2">Kho: {storeName}</p>
                    )}
                    <p className="text-lg text-gray-600 mt-3">Đây là những gì đang diễn ra tại cửa hàng của bạn hôm nay.</p>
                </div>
                <img src="/shop-illustration.webp" alt="Shop Illustration"
                     className="w-64 h-auto rounded-2xl shadow-xl border border-indigo-100"/>
            </div>

            {loading ? (
                <div className="text-center text-gray-500 text-lg py-10">Đang tải tổng quan dashboard...</div>
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
            {error && <div
                className="text-red-600 text-center py-4">{error}</div>} {/* Đổi style trực tiếp thành class TailwindCSS */}

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
                <div
                    className="relative group bg-gradient-to-br from-white via-[#f0f4ff] to-[#e0e7ff] p-6 rounded-2xl shadow-xl border border-indigo-100 transition-all hover:shadow-2xl hover:scale-[1.02]">
                    <div
                        className="absolute top-4 right-6 opacity-10 text-7xl pointer-events-none select-none group-hover:opacity-20 transition-all">📈
                    </div>
                    {loadingRevenue ? (
                        <div>Đang tải dữ liệu doanh thu...</div>
                    ) : errorRevenue ? (
                        <div className="text-red-600">{errorRevenue}</div>
                    ) : (
                        <RevenueLineChart data={revenueData} timeFilter={timeFilter} setTimeFilter={setTimeFilter}/>
                    )}
                </div>
                <div
                    className="relative group bg-gradient-to-br from-white via-[#f0f4ff] to-[#e0e7ff] p-6 rounded-2xl shadow-xl border border-indigo-100 transition-all hover:shadow-2xl hover:scale-[1.02]">
                    <div
                        className="absolute top-4 right-6 opacity-10 text-7xl pointer-events-none select-none group-hover:opacity-20 transition-all">📊
                    </div>
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
            <div className="mb-2 mt-2 flex items-center justify-between">
                <div className="flex gap-2">
                    {[
                        {label: "7 ngày", value: 7},
                        {label: "30 ngày", value: 30},
                        {label: "90 ngày", value: 90}
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setTopRange(opt.value)}
                            className={`px-3 py-1 rounded-full text-sm border ${topRange === opt.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200'}`}
                        >{opt.label}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Top</span>
                    <select
                        className="px-2 py-1 border rounded-md text-sm"
                        value={topLimit}
                        onChange={(e) => setTopLimit(Number(e.target.value))}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div
                    className="relative group bg-gradient-to-br from-white via-[#f8faff] to-[#e0e7ff] p-6 rounded-2xl shadow-xl border border-indigo-100 transition-all hover:shadow-2xl hover:scale-[1.02]">
                    <div
                        className="absolute top-4 right-6 opacity-10 text-7xl pointer-events-none select-none group-hover:opacity-20 transition-all">🥇
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2">
                        <span className="text-3xl">🏆</span> Top Sản phẩm bán chạy
                    </h2>
                    {loadingTopProducts ? (
                        <div>Đang tải...</div>
                    ) : errorTopProducts ? (
                        <div className="text-red-600">{errorTopProducts}</div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead>
                            <tr className="text-indigo-700">
                                <th className="py-2 px-4">#</th>
                                <th className="py-2 px-4">Sản phẩm</th>
                                <th className="py-2 px-4">Nhóm</th>
                                <th className="py-2 px-4">Số lượng</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topProducts.map((item, idx) => (
                                <tr key={item.productName + idx} className="hover:bg-indigo-50 transition-all">
                                    <td className="py-2 px-4 font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
                                    <td className="py-2 px-4 font-semibold">{item.productName}</td>
                                    <td className="py-2 px-4">{item.category}</td>
                                    <td className="py-2 px-4 text-indigo-700 font-bold">{item.quantity}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div
                    className="relative group bg-gradient-to-br from-white via-[#f8faff] to-[#e0e7ff] p-6 rounded-2xl shadow-xl border border-indigo-100 transition-all hover:shadow-2xl hover:scale-[1.02]">
                    <div
                        className="absolute top-4 right-6 opacity-10 text-7xl pointer-events-none select-none group-hover:opacity-20 transition-all">👑
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2">
                        <span className="text-3xl">💎</span> Top Khách hàng mua nhiều nhất
                    </h2>
                    {loadingTopCustomers ? (
                        <div>Đang tải...</div>
                    ) : errorTopCustomers ? (
                        <div className="text-red-600">{errorTopCustomers}</div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead>
                            <tr className="text-indigo-700">
                                <th className="py-2 px-4">#</th>
                                <th className="py-2 px-4">Khách hàng</th>
                                <th className="py-2 px-4">Tổng tiền</th>
                                <th className="py-2 px-4">Số đơn</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topCustomers.map((item, idx) => (
                                <tr key={item.customerName + idx} className="hover:bg-indigo-50 transition-all">
                                    <td className="py-2 px-4 font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
                                    <td className="py-2 px-4 font-semibold">{item.customerName}</td>
                                    <td className="py-2 px-4 text-indigo-700 font-bold">{formatCurrency(item.totalAmount)}</td>
                                    <td className="py-2 px-4">{item.orderCount}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>


            {/* Latest Import Transactions */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Phiếu Nhập Hàng Gần Đây</h2>
                    <Link to="/import" className="inline-block" style={{textDecoration: 'none'}}>
                        <Button variant="contained" color="primary"
                                className="!bg-green-600 hover:!bg-green-700 !rounded-full !shadow-md !capitalize">
                            Xem Phiếu Nhập Hàng
                        </Button>
                    </Link>
                </div>
                {loadingImports ? (
                    <div>Đang tải...</div>
                ) : errorImports ? (
                    <div className="text-red-600">{errorImports}</div>
                ) : (
                    <OrdersTable orders={recentImports.map((item, idx) => ({
                        id: item.id,
                        code: item.name || item.id,
                        partner: item.supplierName || "",
                        store: item.storeName || item.storeId || "",
                        price: item.totalAmount,
                        created: item.importDate?.slice(0, 10),
                        status: item.status,
                    }))}/>
                )}
            </div>


            {/* Latest Sale Transactions */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Phiếu Bán Hàng Gần Đây</h2>
                    <Link to="/sale" className="inline-block" style={{textDecoration: 'none'}}>
                        <Button variant="contained" color="primary"
                                className="!bg-blue-600 hover:!bg-blue-700 !rounded-full !shadow-md !capitalize">
                            Xem Phiếu Bán Hàng
                        </Button>
                    </Link>
                </div>
                {loadingSales ? (
                    <div>Đang tải...</div>
                ) : errorSales ? (
                    <div className="text-red-600">{errorSales}</div>
                ) : (
                    <OrdersTable orders={recentSales.map((item, idx) => ({
                        id: item.id,
                        code: item.name || item.id,
                        partner: item.customerName || "",
                        store: item.storeName || "",
                        price: item.totalAmount,
                        created: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : (item.saleDate?.slice(0, 10) || ''),
                        status: item.status,
                    }))}/>
                )}
            </div>

            {/* XÓA BẢNG Recent Orders và Product Stock Overview */}
        </div>
    );
};

export default Dashboard;
