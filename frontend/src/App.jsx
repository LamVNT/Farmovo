import {RouterProvider} from "react-router-dom";
import router from "./routes";
import {createContext, useEffect, useState} from "react";
import './app.css';
import {Toaster} from "react-hot-toast";

const MyContext = createContext();

function App() {
    const [isSidebarOpen, setisSidebarOpen] = useState(true);
    const [isLogin, setIslogin] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) setIslogin(true);
    }, []);

    const values = {
        isSidebarOpen,
        setisSidebarOpen,
        isLogin,
        setIslogin,
    };

    return (
        <MyContext.Provider value={values}>
            <RouterProvider router={router}/>
            <Toaster position="top-right" reverseOrder={false}/>
        </MyContext.Provider>
    );
}

export default App;
export {MyContext};
