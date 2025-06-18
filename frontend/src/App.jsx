import { createBrowserRouter, RouterProvider} from "react-router-dom";
import Dashboard from "./pages/dashboard"; // Capital D
import Header from "./components/Header"
import Sidebar from "./components/Sidebar";
import Login from "./pages/login"
import Category from "./pages/category";
import { createContext, useState} from "react";
import './app.css';
import Signup from "./pages/signup/index.jsx";
import UserManagement from "./pages/user/index.jsx";

const MyContext = createContext();
function App() {
    const [isSidebarOpen, setisSidebarOpen] = useState(true);
    const [isLogin, setIslogin] = useState(false);

    const router = createBrowserRouter([
        {
            path: "/",
            exact:true,
            element: (
                <>
                    <section className="main">
                        <Header/>
                        <div className="contentMain flex">
                            <div
                                className={`overflow-hidden sidebarWrapper ${isSidebarOpen === true ? 'w-[18%]' : 'w-[0px] opacity-0'} transition-all`}>
                                <Sidebar/>
                            </div>
                            <div
                                className={`contentRight py-4 px-5 w-[82%] ${isSidebarOpen === false ? 'w-[100%]' : 'w-[82%]'} transition-all`}>
                                <Dashboard/>
                            </div>
                        </div>
                    </section>
                </>
            ),
        },
        {
            path: "/login",
            exact:true,
            element: (
                <>
                    <Login/>
                </>
            ),
        },
        {
            path: "/sign-up",
            exact:true,
            element: (
                <>
                    <Signup/>
                </>
            ),
        },
        {
            path: "/category",
            element: (
                <>
                    <section className="main">
                        <Header/>
                        <div className="contentMain flex">
                            <div
                                className={`overflow-hidden sidebarWrapper ${isSidebarOpen === true ? 'w-[18%]' : 'w-[0px] opacity-0'} transition-all`}>
                                <Sidebar/>
                            </div>
                            <div
                                className={`contentRight py-4 px-5 w-[82%] ${isSidebarOpen === false ? 'w-[100%]' : 'w-[82%]'} transition-all`}>
                                <Category/>
                            </div>
                        </div>
                    </section>
                </>
            ),
        },
        {
            path: "/users",
            element: (
                <>
                    <section className="main">
                        <Header/>
                        <div className="contentMain flex">
                            <div
                                className={`overflow-hidden sidebarWrapper ${isSidebarOpen === true ? 'w-[18%]' : 'w-[0px] opacity-0'} transition-all`}>
                                <Sidebar/>
                            </div>
                            <div
                                className={`contentRight py-4 px-5 w-[82%] ${isSidebarOpen === false ? 'w-[100%]' : 'w-[82%]'} transition-all`}>
                                <UserManagement/>
                            </div>
                        </div>
                    </section>
                </>
            ),
        },
    ]);

    const values = {
        isSidebarOpen,
        setisSidebarOpen,
        isLogin,
        setIslogin
    };

    return (
        <MyContext.Provider value={values}>
            <RouterProvider router={router}/>
        </MyContext.Provider>
    );
}

export default App;
export {MyContext}
