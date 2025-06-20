import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { createContext, useState } from "react";
import './app.css';

const MyContext = createContext();

function App() {
    const [isSidebarOpen, setisSidebarOpen] = useState(true);
    const [isLogin, setIslogin] = useState(false);

    const values = {
        isSidebarOpen,
        setisSidebarOpen,
        isLogin,
        setIslogin,
    };

    return (
        <MyContext.Provider value={values}>
            <RouterProvider router={router} />
        </MyContext.Provider>
    );
}

export default App;
export { MyContext };
