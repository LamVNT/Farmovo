import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { createContext, useState, useEffect } from "react";
import './App.css';
import {Toaster} from "react-hot-toast";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { AuthorizationProvider } from './contexts/AuthorizationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { StoreSelectionProvider } from './contexts/StoreSelectionContext';

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
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <AuthorizationProvider>
                <StoreSelectionProvider>
                    <NotificationProvider>
                        <MyContext.Provider value={values}>
                        <RouterProvider router={router} />
                        <Toaster
                        position="top-center"
                        reverseOrder={false}
                        toastOptions={{
                            style: {
                                borderRadius: '12px',
                                background: '#fff',
                                color: '#222',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                                padding: '16px 24px',
                                minWidth: '320px',
                                maxWidth: '90vw',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#22c55e',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                        </MyContext.Provider>
                    </NotificationProvider>
                </StoreSelectionProvider>
            </AuthorizationProvider>
        </LocalizationProvider>
    );
}

export default App;
export { MyContext };
