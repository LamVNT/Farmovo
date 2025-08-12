// pages/login/index.jsx
import React from 'react';
import LoginForm from '../../components/login/LoginForm';
import { Link, NavLink } from 'react-router-dom';
import Button from "@mui/material/Button";
import { CiLogin, CiUser } from "react-icons/ci";
import SocialLoginButtons from '../../components/login/SocialLoginButtons';
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
                            <CiLogin className="text-[18px]" />Login
                        </Button>
                    </NavLink>
                    <NavLink
                        to="/sign-up"
                        className={({ isActive }) => (isActive ? "isActive" : "")}
                    >
                        <Button className="!rounded-full !text-[rgba(0,0,0,0.8)] !px-5 flex gap-1">
                            <CiUser className="text-[18px]" />SignUp
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
                    Welcome Back!<br />
                    Sign in with your credentials.
                </h1>

                <SocialLoginButtons />
                <div className="w-full flex items-center justify-center gap-3 my-6">
                    <span className="flex items-center w-[100px] h-[1px] bg-[rgba(0,0,0,0.2)]"></span>
                    <span className="text-[15px] font-[500]">Or, Sign in with your email</span>
                    <span className="flex items-center w-[100px] h-[1px] bg-[rgba(0,0,0,0.2)]"></span>
                </div>

                <LoginForm />
            </div>
        </section>
    );
};

export default Login;
