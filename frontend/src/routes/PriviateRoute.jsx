// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { MyContext } from "../App.jsx";

const PrivateRoute = ({ children }) => {
    const { isLogin } = useContext(MyContext);
    return isLogin ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
