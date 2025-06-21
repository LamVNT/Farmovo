import React, { useState } from 'react';
import { Button, Checkbox, FormControlLabel } from "@mui/material";
import { FaRegEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";

const LoginForm = () => {
    const [isPasswordShow, setisPasswordShow] = useState(false);

    return (
        <form className="w-full px-8 mt-3">
            <div className="form-group mb-4 w-full">
                <h4 className="text-[14px] font-[500] mb-1">Email</h4>
                <input type="email"
                       className="w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-sm focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3"/>
            </div>
            <div className="form-group mb-4 w-full">
                <h4 className="text-[14px] font-[500] mb-1">Password</h4>
                <div className="relative w-full">
                    <input type={isPasswordShow ? "text" : "password"}
                           className="w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-sm focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3"/>
                    <Button
                        className="!absolute top-[5px] right-[10px] z-50 !rounded-full !w-[35px] !h-[35px] !min-w-[35px] !text-[#000]"
                        onClick={() => setisPasswordShow(!isPasswordShow)}>
                        {isPasswordShow ? <FaEyeSlash className="text-[18px]" /> : <FaRegEye className="text-[18px]"/>}
                    </Button>
                </div>
            </div>

            <div className="form-group mb-4 w-full flex items-center justify-between">
                <FormControlLabel control={<Checkbox defaultChecked />} label="Remember Me" />
                <Link to="/forgot-password"
                      className="text-primary font-[700] text-[15px] hover:underline hover:text-gray-700">
                    Forgot Password?
                </Link>
            </div>
            <Button className="btn-blue btn-lg w-full">Sign In</Button>
        </form>
    );
};

export default LoginForm;
