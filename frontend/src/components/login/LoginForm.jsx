import React, { useState, useContext, useEffect  } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from '@mui/material/FormControlLabel';
import { FaRegEye, FaEyeSlash } from "react-icons/fa";
import { MyContext } from '../../App';
import api from "../../services/axiosClient.js";

const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false); // ✅ Thêm state này
    const [isPasswordShow, setIsPasswordShow] = useState(false);
    const { setIslogin } = useContext(MyContext);
    const navigate = useNavigate();
    // const remembered = localStorage.getItem("rememberedEmail");
    useEffect(() => {
        const remembered = localStorage.getItem("rememberedEmail");
        if (remembered) {
            setEmail(remembered);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/signin", {
                username: email,
                password: password,
                rememberMe: rememberMe
            }, {
                withCredentials: true
            });

            const token = response.data.jwtToken;
            localStorage.setItem("token", token);
            setIslogin(true);

            const roles = response.data.roles;
            if (roles.includes("ROLE_ADMIN")) {
                navigate("/users");
            } else {
                navigate("/");
            }

        } catch (err) {
            alert("Đăng nhập thất bại! Vui lòng kiểm tra lại.");
            console.error("❌ Lỗi:", err.response?.data || err.message);
        }
    };

    return (
        <form className="w-full px-8 mt-3" onSubmit={handleLogin}>
            <div className="form-group mb-4 w-full">
                <h4 className="text-[14px] font-[500] mb-1">Email</h4>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                       className="w-full h-[50px] border-2 rounded-sm px-3" required />
            </div>
            <div className="form-group mb-4 w-full">
                <h4 className="text-[14px] font-[500] mb-1">Password</h4>
                <div className="relative w-full">
                    <input type={isPasswordShow ? "text" : "password"} value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="w-full h-[50px] border-2 rounded-sm px-3" required />
                    <Button className="!absolute top-[5px] right-[10px] z-50 !rounded-full !w-[35px]"
                            onClick={() => setIsPasswordShow(!isPasswordShow)} type="button">
                        {isPasswordShow ? <FaEyeSlash /> : <FaRegEye />}
                    </Button>
                </div>
            </div>

            <div className="form-group mb-4 w-full flex items-center justify-between">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)} // ✅ Cập nhật state
                        />
                    }
                    label="Remember Me"
                />
                <Link to="/forgot-password" className="text-primary text-[15px] hover:underline">Forgot Password?</Link>
            </div>

            <Button type="submit" className="btn-blue btn-lg w-full">Sign In</Button>
        </form>
    );
};

export default LoginForm;