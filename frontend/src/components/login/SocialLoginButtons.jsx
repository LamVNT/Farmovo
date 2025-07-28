import React from 'react';
import {Button} from "@mui/material";
import {FcGoogle} from "react-icons/fc";
import {FaFacebook} from "react-icons/fa";

const SocialLoginButtons = ({onGoogleClick, onFacebookClick, loadingGoogle, loadingFacebook}) => (
    <div className="flex items-center justify-center w-full mt-5 gap-4">
        <Button
            onClick={onGoogleClick}
            endIcon={<FcGoogle/>}
            loading={loadingGoogle}
            variant="outlined"
            className="!bg-none !py-2 !text-[15px] !capitalize !px-5 text-[rgba(0,0,0,0.7)]"
        >
            Signin with Google
        </Button>

        <Button
            onClick={onFacebookClick}
            endIcon={<FaFacebook/>}
            loading={loadingFacebook}
            variant="outlined"
            className="!bg-none !py-2 !text-[15px] !capitalize !px-5 text-[rgba(0,0,0,0.7)]"
        >
            Signin with Facebook
        </Button>
    </div>
);

export default SocialLoginButtons;
