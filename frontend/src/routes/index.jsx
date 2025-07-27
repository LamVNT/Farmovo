import {createBrowserRouter} from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/login";
import Signup from "../pages/signup";
import Dashboard from "../pages/dashboard";
import Category from "../pages/category";
import UserManagement from "../pages/user";
import Unauthorized from "../pages/unauthorized";

import ProtectedRoute from "./PriviateRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";

// Import pages
import Profile from "../pages/profile/index.jsx"; // chỉnh tên nếu cần
import ProfileLayout from "../layouts/ProfileLayout.jsx"; // mới
import Security from "../pages/profile/Security";
import Notification from "../pages/profile/Notification";
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
import RemainByProductReport from '../pages/reports/RemainByProduct';
import StocktakeDiffReport from '../pages/reports/StocktakeDiff';
import ExpiringLotsReport from '../pages/reports/ExpiringLots';
import StocktakeLot from '../pages/import-detail/StocktakeLot';
import CustomerManagementPage from "../pages/customer";
import ForgotPassword from "../pages/ForgotPassword";
import Store from "../pages/store/index.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
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
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
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
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <DebtNote/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },

    {
        path: "/profile",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
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
        ],
    },
    {
        path: "/import",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
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
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <ImportPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/import-detail-stocktake",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <StocktakeLot/>
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
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <Zone/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/product",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <Product/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/sale",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <SaleTransactionPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/sale/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <SaleTransactionPage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/sale/new",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <AddSalePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/stocktake",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <StockTakePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/stocktake/create",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <CreateStocktakePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/stocktake/edit/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <CreateStocktakePage/>
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/stocktake/:id",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
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
        element: <StocktakeDiffReport/>,
    },
    {
        path: "/reports/expiring-lots",
        element: <ExpiringLotsReport/>,
    },
    {
        path: "/customers",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
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
]);

export default router;
