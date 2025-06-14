import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createBrowserRouter, RouterProvider} from "react-router-dom";
import Dashboard from "./pages/dashboard"; // Capital D
import Header from "./components/Header"
import Sidebar from "./components/Sidebar";
import './app.css';


function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            exact:true,
            element: (
                <>
                    <section className="main">
                        <Header/>
                        <div className="contentMain flex">
                            <div className="sidebarWrapper w-[18%]">
                                <Sidebar/>
                            </div>
                        </div>
                    </section>
                </>
            ),
        },
    ]);

    return (
        <RouterProvider router={router} />
    );
}

export default App;
