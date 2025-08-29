import React, {useContext, useState} from "react";
import {RiMenu2Line} from "react-icons/ri"
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import {styled} from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import {FaRegBell} from "react-icons/fa6";
import {FaRegUser} from "react-icons/fa6";
import {FaSignOutAlt} from "react-icons/fa";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import {MyContext} from '../../App.jsx'
import {Link, useNavigate} from "react-router-dom";
import {getStoreById} from '../../services/storeService';
import NotificationDropdown from './NotificationDropdown';
import api from '../../services/axiosClient.js';
import { useAuth } from "../../contexts/AuthorizationContext";


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
    const [storeName, setStoreName] = useState("");
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const { logout, isAdmin, isStaff } = useAuth();

    const handleLogout = async () => {
        try {
            await api.post("/logout", {}, { withCredentials: true });
        } catch (e) {
            // ignore and still clear client state
        }
        logout();
        context.setIslogin(false);
        handleCloseMyAcc();
        navigate("/login");
    };

    React.useEffect(() => {
        // Lấy user từ localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const u = JSON.parse(userStr);
            setUser(u);
            // Chỉ lấy storeName nếu không phải admin
            if (!isAdmin()) {
                // Ưu tiên lấy storeName trực tiếp
                if (u?.storeName) setStoreName(u.storeName);
                // Nếu không có, lấy theo storeId
                else if (u?.storeId) {
                    getStoreById(u.storeId).then(store => {
                        setStoreName(store.storeName || store.name || "");
                    }).catch(() => setStoreName(""));
                }
            }
        }
    }, [isAdmin]);

    return (
        <header
            className={`w-full h-[auto] py-4 px-6 bg-white flex items-center justify-between border-b border-gray-200 fixed top-0 left-0 right-0 z-40 shadow-sm`}>

            <div className='part1 flex items-center gap-4' style={{
                paddingLeft: context.isSidebarOpen ? 400 : 0,
                transition: 'padding-left 0.3s'
            }}>
                {/* Menu Button Container - Fixed position */}
                <div className="flex items-center gap-4" style={{
                    position: 'fixed',
                    left: context.isSidebarOpen ? 230 : 20,
                    top: '20px',
                    zIndex: 30,
                    transition: 'left 0.3s'
                }}>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                        style={{fontSize: 20, color: '#374151'}}
                        onClick={() => context.setisSidebarOpen(!context.isSidebarOpen)}
                        title={context.isSidebarOpen ? 'Ẩn menu' : 'Hiện menu'}
                    >
                        <RiMenu2Line/>
                    </button>
                    
                    {/* Store Name - chỉ hiển thị cho Staff, không hiển thị cho Admin */}
                    {!isAdmin() && storeName && (
                        <span className="text-lg font-semibold text-gray-800">{storeName}</span>
                    )}
                </div>
            </div>

            <div className='flex-1 flex items-center justify-center'>
                {/* Central area - empty for clean design */}
            </div>

            <div className='part2 flex items-center justify-end gap-5'>
                {/* Notifications */}
                <NotificationDropdown />


                {
                    context.isLogin === true ?

                        <div className="relative">
                            <div className="rounded-full w-8 h-8 overflow-hidden cursor-pointer border-2 border-gray-200"
                                 onClick={handleClickMyAcc}>
                                <img src={user?.avatar || "https://ecme-react.themenate.net/img/avatars/thumb-1.jpg"}
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
                                            <img
                                                src={user?.avatar || "https://ecme-react.themenate.net/img/avatars/thumb-1.jpg"}
                                                className="w-full h-full object-cover"/>
                                        </div>
                                        <div className="info">
                                            <h3 className="text-[16px] font-[500] leading-5">{user?.fullName || user?.username || "User"}</h3>
                                            <p className="text-[13px] font-[400] opacity-70">{user?.email || ""}</p>
                                        </div>
                                    </div>
                                </MenuItem>
                                <Divider/>


                                <MenuItem component={Link} to="/profile" className="flex items-center gap-3">
                                    <FaRegUser className="text-[16px]"/>
                                    <span className="text-[14px]">Trang cá nhân</span>
                                </MenuItem>


                                <MenuItem onClick={handleLogout} className="flex items-center gap-3">
                                    <FaSignOutAlt className="text-[18px]"/> <span
                                    className="text-[14px]">Đăng xuất</span>
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