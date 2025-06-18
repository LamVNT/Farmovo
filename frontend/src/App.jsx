import { createBrowserRouter, RouterProvider} from "react-router-dom";
import Dashboard from "./pages/dashboard"; // Capital D
import Header from "./components/Header"
import Sidebar from "./components/Sidebar";
import Login from "./pages/login"
import { createContext, useState} from "react";
import './app.css';
import Signup from "./pages/signup/index.jsx";

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
