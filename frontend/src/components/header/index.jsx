import React, {useContext} from "react";
import {RiMenu2Line} from "react-icons/ri"
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import {styled} from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import {FaRegBell, FaRegUser} from "react-icons/fa6";
import {FaSignOutAlt} from "react-icons/fa";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import {MyContext} from '../../App.jsx'
import {Link} from "react-router-dom";


const StyledBadge = styled(Badge)(({theme}) => ({
    '& .MuiBadge-badge': {
        right: -3,
        top: 13,
        border: `2px solid ${(theme.vars ?? theme).palette.background.paper}`,
        padding: '0 4px',
    },
}));
const Header = () => {
    const [anchorMyAcc, setAnchorMyAcc] = React.useState(null);
    const openMyAcc = Boolean(anchorMyAcc);
    const handleClickMyAcc = (event) => {
        setAnchorMyAcc(event.currentTarget);
    };
    const handleCloseMyAcc = () => {
        setAnchorMyAcc(null);
    };

    const context = useContext(MyContext);

    return (
        <header
            className={`w-full h-[auto] py-2 ${context.isSidebarOpen === true ? 'pl-64' : 'pl-5'} shadow-md pr-7 bg-[#fff] flex items-center justify-between transition-all`}>
            <div className='part1'>
                <Button className="!w-[40px] !h-[40px] !rounded-full !min-w-[40px] text-[22px] !text-[rgba(0,0,0,0.8)]"
                        onClick={() => context.setisSidebarOpen(!context.isSidebarOpen)}>
                    <RiMenu2Line className="text-[22px] text-[rgba(0,0,0,0.8)]"/>
                </Button>
            </div>

            <div className='part2 w-[40%] flex items-center justify-end gap-5'>
                <IconButton aria-label="cart">
                    <StyledBadge badgeContent={4} color="secondary">
                        <FaRegBell/>
                    </StyledBadge>
                </IconButton>


                {
                    context.isLogin === true ?

                        <div className="relative">
                            <div className="rounded-full w-[30px] h-[30px] overflow-hidden cursor-pointer"
                                 onClick={handleClickMyAcc}>
                                <img src="https://ecme-react.themenate.net/img/avatars/thumb-1.jpg"
                                     className="w-full h-full object-cover"/>
                            </div>

                            <Menu
                                anchorEl={anchorMyAcc}
                                id="account-menu"
                                open={openMyAcc}
                                onClose={handleCloseMyAcc}
                                onClick={handleCloseMyAcc}
                                slotProps={{
                                    paper: {
                                        elevation: 0,
                                        sx: {
                                            overflow: 'visible',
                                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                            mt: 1.5,
                                            '& .MuiAvatar-root': {
                                                width: 32,
                                                height: 32,
                                                ml: -0.5,
                                                mr: 1,
                                            },
                                            '&::before': {
                                                content: '""',
                                                display: 'block',
                                                position: 'absolute',
                                                top: 0,
                                                right: 14,
                                                width: 10,
                                                height: 10,
                                                bgcolor: 'background.paper',
                                                transform: 'translateY(-50%) rotate(45deg)',
                                                zIndex: 0,
                                            },
                                        },
                                    },
                                }}
                                transformOrigin={{horizontal: 'right', vertical: 'top'}}
                                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                            >
                                <MenuItem onClick={handleCloseMyAcc} className="!bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-full w-[30px] h-[30px] overflow-hidden cursor-pointer">
                                            <img src="https://ecme-react.themenate.net/img/avatars/thumb-1.jpg"
                                                 className="w-full h-full object-cover"/>
                                        </div>

                                        <div className="info">
                                            <h3 className="text-[16px] font-[500] leading-5">Vu Nguyen Tung Lam</h3>
                                            <p className="text-[13px] font-[400] opacity-70">admin@gmail.com</p>
                                        </div>
                                    </div>
                                </MenuItem>
                                <Divider/>


                                <MenuItem component={Link} to="/profile" className="flex items-center gap-3">
                                    <FaRegUser className="text-[16px]"/>
                                    <span className="text-[14px]">Profile</span>
                                </MenuItem>


                                <MenuItem onClick={handleCloseMyAcc} className="flex items-center gap-3">
                                    <FaSignOutAlt className="text-[18px]"/> <span
                                    className="text-[14px]">Sign Out</span>
                                </MenuItem>
                            </Menu>
                        </div>

                        :

                        <Button className="btn-blue btn-sm !rounded-full">Sign In </Button>
                }


            </div>
        </header>
    )
}

export default Header;