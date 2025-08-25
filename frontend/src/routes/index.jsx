import {createBrowserRouter} from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/login";
import Signup from "../pages/signup";
import Dashboard from "../pages/dashboard";
import Category from "../pages/category";
import UserManagement from "../pages/user";
import Unauthorized from "../pages/unauthorized";

import ProtectedRoute from "./ProtectedRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";

// Import pages
import Profile from "../pages/profile/index.jsx"; // chỉnh tên nếu cần
import ProfileLayout from "../layouts/ProfileLayout.jsx"; // mới
import Security from "../pages/profile/Security";
import Notification from "../pages/profile/Notification";
import ChangePasswordPage from "../pages/profile/ChangePasswordPage";
import Zone from "../pages/zone/index.jsx";
import ImportTransactionPage from "../pages/import-transaction/index.jsx";
import ImportPage from "../pages/import-transaction/ImportPage.jsx";
import DebtNote from "../pages/debt/index.jsx";
import StockTakePage from "../pages/stocktake/index.jsx";
import StockTakeDetailPage from "../pages/stocktake/Detail.jsx";
import CreateStocktakePage from "../pages/stocktake/Create.jsx";
import Product from "../pages/product/index.jsx";
import SaleTransactionPage from "../pages/sale-transaction/index.jsx";
import AddSalePage from "../pages/sale-transaction/AddSalePage.jsx";
import EditSalePage from "../pages/sale-transaction/EditSalePage.jsx";
import RemainByProductReport from '../pages/reports/RemainByProduct';
import StocktakeDiffReport from '../pages/reports/StocktakeDiff';
import ExpiringLotsReport from '../pages/reports/ExpiringLots';
import CustomerManagementPage from "../pages/customer";
import ForgotPassword from "../pages/ForgotPassword";
import Store from "../pages/store/index.jsx";
import EditPage from '../pages/import-transaction/EditPage';
import { DashboardReport, RemainSummaryReport, InOutSummaryReport, DailyRevenue, SalesShiftTotal, ImportsTotal } from '../pages/reports';
import FinancialReport from '../pages/reports/FinancialReport';
import InventoryReport from '../pages/reports/InventoryReport';
import ChangeStatusLogPage from "../pages/change-status-log/index.jsx";
import BalanceSalePage from '../pages/sale-transaction/BalanceSalePage';
import BalanceTransactionPage from "../pages/balance-transaction/index.jsx";
import TestBalancePage from "../pages/balance/TestBalance.jsx";
const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <Dashboard/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/login",
        element: (
            <GuestRoute>
                <Login/>
            </GuestRoute>
        ),
    },
    {
        path: "/sign-up",
        element: (
            <GuestRoute>
                <Signup/>
            </GuestRoute>
        ),
    },
    {
        path: "/forgot-password",
        element: (
            <GuestRoute>
                <ForgotPassword/>
            </GuestRoute>
        ),
    },
    {
        path: "/category",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <Category/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/users",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <UserManagement/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },

    {
        path: "/debts",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <DebtNote/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },

    {
        path: "/profile",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <ProfileLayout/>
                </MainLayout>
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Profile/>,
            },
            {
                path: "security",
                element: <Security/>,
            },
            {
                path: "notification",
                element: <Notification/>,
            },
            {
                path: "change-password",
                element: <ChangePasswordPage/>,
            },
        ],
    },
    {
        path: "/import",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <ImportTransactionPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/import/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <ImportTransactionPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/import/new",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <ImportPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/import/edit/:id',
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <EditPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },

    {
        path: "/unauthorized",
        element: <Unauthorized/>,
    },
    {
        path: "/zone",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <Zone/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/product",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <Product/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/sale",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <SaleTransactionPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/sale/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <SaleTransactionPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/sale/new",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <AddSalePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/sale/edit/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <EditSalePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/sale/balance/:stocktakeId",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <BalanceSalePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/test/balance/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <TestBalancePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/stocktake",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <StockTakePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/stocktake/create",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <CreateStocktakePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/stocktake/edit/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <CreateStocktakePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/stocktake/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <StockTakeDetailPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/remain-by-product",
        element: <RemainByProductReport/>,
    },
    {
        path: "/reports/stocktake-diff",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <StocktakeDiffReport/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/expiring-lots",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <ExpiringLotsReport/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/dashboard",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <DashboardReport/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/financial",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <FinancialReport/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/inventory",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <InventoryReport/>
                </MainLayout>
            </ProtectedRoute>
                ),
    },
    {
        path: "/reports/remain-summary",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <RemainSummaryReport/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/inout-summary",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <InOutSummaryReport/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/daily-revenue",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <DailyRevenue/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/sales-total",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <SalesShiftTotal/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/reports/imports-total",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <ImportsTotal/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/customers",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <CustomerManagementPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/store",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <Store/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/change-status-log",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <ChangeStatusLogPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/balance",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_STAFF"]}>
                <MainLayout>
                    <BalanceTransactionPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    
]);

export default router;
