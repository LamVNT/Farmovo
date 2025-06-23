import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/login";
import Signup from "../pages/signup";
import Dashboard from "../pages/dashboard";
import Category from "../pages/category";
import UserManagement from "../pages/user";

import GuestRoute from "./GuestRoute";
import ProtectedRoute from "./PriviateRoute.jsx";
import Unauthorized from "../pages/unauthorized/index.jsx";

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
        path: "/unauthorized",
        element: <Unauthorized />,
    }
]);

export default router;
