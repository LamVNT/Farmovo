// pages/login/index.jsx
import React from 'react';
import LoginForm from '../../components/login/LoginForm';
import { Link, NavLink } from 'react-router-dom';
import Button from "@mui/material/Button";
import { CiLogin } from "react-icons/ci";
import FarmovoLogo from '../../assets/Farmovo.png';

const Login = () => {
    return (
        <section className='bg-white w-full'>
            <header className="w-full fixed top-0 left-0 px-4 py-3 flex items-center justify-between z-50">
                <Link to="/">
                    <img className="w-[200px]" src={FarmovoLogo} alt="Farmovo Logo" />
                </Link>

                <div className="flex items-center gap-0">
                    <NavLink
                        to="/login"
                        className={({ isActive }) => (isActive ? "isActive" : "")}
                    >
                        <Button className="!rounded-full !text-[rgba(0,0,0,0.8)] !px-5 flex gap-1">
                            <CiLogin className="text-[18px]" />Đăng nhập
                        </Button>
                    </NavLink>
                </div>
            </header>

            <img src="/patern.webp" className="w-full fixed top-0 left-0 opacity-5" />

            <div className="loginBox card w-[600px] pb-20 mx-auto pt-20 relative z-50">
                <div className="text-center">
                    <img src="/icon-login.svg" className="m-auto" />
                </div>
                <h1 className="text-center text-[35px] font-[800] mt-4">
                    Chào mừng trở lại!<br />
                    Đăng nhập bằng thông tin đăng nhập của bạn.
                </h1>

                <LoginForm />
            </div>
        </section>
    );
};

export default Login;
