import { createBrowserRouter } from "react-router-dom"
import Login from "../pages/login"
import Signup from "../pages/signup"
import Dashboard from "../pages/dashboard"
import Category from "../pages/category"
import UserManagement from "../pages/user"
import MainLayout from "../layouts/MainLayout"

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <MainLayout>
                <Dashboard />
            </MainLayout>
        ),
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/sign-up",
        element: <Signup />,
    },
    {
        path: "/category",
        element: (
            <MainLayout>
                <Category />
            </MainLayout>
        ),
    },
    {
        path: "/users",
        element: (
            <MainLayout>
                <UserManagement />
            </MainLayout>
        ),
    },
])

export default router
