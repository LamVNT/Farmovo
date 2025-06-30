import { createBrowserRouter } from "react-router-dom";
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

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <Dashboard />
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/login",
        element: (
            <GuestRoute>
                <Login />
            </GuestRoute>
        ),
    },
    {
        path: "/sign-up",
        element: (
            <GuestRoute>
                <Signup />
            </GuestRoute>
        ),
    },
    {
        path: "/category",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <Category />
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/users",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <UserManagement />
                </MainLayout>
            </ProtectedRoute>
        ),
    },

    {
        path: "/profile",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <ProfileLayout />
                </MainLayout>
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Profile />,
            },
            {
                path: "security",
                element: <Security />,
            },
            {
                path: "notification",
                element: <Notification />,
            },
        ],
    },
    {
        path: "/import",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <ImportTransactionPage />
                </MainLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: "/import/new",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                <MainLayout>
                    <ImportPage />
                </MainLayout>
            </ProtectedRoute>
        ),
    },

    {
        path: "/unauthorized",
        element: <Unauthorized />,
    },
    {
        path: "/zone",
        element: (
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_USER"]}>
                <MainLayout>
                    <Zone />
                </MainLayout>
            </ProtectedRoute>
        ),
    },
]);

export default router;
