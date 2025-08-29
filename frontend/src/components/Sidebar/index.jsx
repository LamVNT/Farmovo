import React, {useContext, useState} from "react";
import {Link, useNavigate, useLocation} from "react-router-dom"
import Button from "@mui/material/Button";
import {RxDashboard} from "react-icons/rx";
import {FiUsers} from "react-icons/fi";
import {RiProductHuntLine} from "react-icons/ri";
import {TbCategory} from "react-icons/tb";
import {MdMap} from "react-icons/md"; // Material Icons
import {IoBagCheckOutline} from "react-icons/io5";
import {IoMdLogOut} from "react-icons/io";
import {FaAngleDown} from "react-icons/fa6";
import {GrTransaction} from "react-icons/gr";
import {FaRegSquareCheck} from "react-icons/fa6";
import {TbPigMoney} from "react-icons/tb";
import {Collapse} from 'react-collapse';
import {MyContext} from "../../App.jsx";
import api from "../../services/axiosClient.js";
import {HiOutlineDocumentReport} from "react-icons/hi";
import {FaBoxOpen, FaExclamationTriangle, FaClock} from "react-icons/fa";
import FarmovoLogo from '../../assets/Farmovo.png';
import {FaStore} from "react-icons/fa6";
import {MdHistory} from "react-icons/md";
import PermissionGate, { AdminOnly } from "../PermissionGate.jsx";
import { useAuth } from "../../contexts/AuthorizationContext";


const Sidebar = () => {
    const [submenuIndex, setSubmenuIndex] = useState(null)
    const location = useLocation();
    
    const isOpenSubMenu = (index) => {
        if (submenuIndex === index) {
            setSubmenuIndex(null);
        } else {
            setSubmenuIndex(index);
        }
    }

    // Auto-open submenu if current page is in transaction section
    React.useEffect(() => {
        if (location.pathname === '/import' || location.pathname === '/sale' || location.pathname === '/balance') {
            setSubmenuIndex(1);
        }
    }, [location.pathname]);

    const navigate = useNavigate();
    const context = useContext(MyContext);
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await api.post("/logout", {}, {withCredentials: true}); // Gọi backend để xoá cookie
            logout(); // Clear AuthorizationContext - this also clears localStorage
            context.setIslogin(false); // Cập nhật lại state
            navigate("/login"); // Chuyển hướng
        } catch (error) {
            console.error("Logout error:", error);
            // Even if logout API fails, clear local state
            logout();
            context.setIslogin(false);
            navigate("/login");
        }
    };


    return (
        <>
            <div
                className={`sidebar fixed top-0 left-0 bg-[#fff] border-r border-[rgba(0,0,0,0.1)] py-2 px-4 z-50`}
                style={{ 
                    height: 'calc(100vh - 20px)',
                    width: context.isSidebarOpen ? '220px' : '0px',
                    transition: 'width 0.3s ease'
                }}>
                <div className="py-2 w-full">
                    <Link to="/">
                        <img src={FarmovoLogo} alt="Farmovo Logo" className="w-[120px]"/>
                    </Link>
                </div>

                <ul className="mt-4">
                    <li>
                        <Link to="/">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                !font-[600] items-center !py-2 transition-all duration-200 ${
                                    location.pathname === '/' 
                                        ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                        : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                }`}>
                                <RxDashboard className={`text-[20px] ${
                                    location.pathname === '/' ? 'text-[#8b5cf6]' : ''
                                }`}/> 
                                <span>Bảng điều khiển</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Button
                            className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                            !font-[600] items-center !py-2 transition-all duration-200 ${
                                location.pathname === '/import' || location.pathname === '/sale' || location.pathname === '/balance'
                                    ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                    : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                            }`}
                            onClick={() => isOpenSubMenu(1)}>
                            <GrTransaction className={`text-[20px] ${
                                location.pathname === '/import' || location.pathname === '/sale' || location.pathname === '/balance' ? 'text-[#8b5cf6]' : ''
                            }`}/> 
                            <span>Giao dịch</span>
                            <span className="ml-auto w-[30px] h-[30px] flex items-center justify-center">
                                <FaAngleDown className={`transition-all ${submenuIndex === 1 ? 'rotate-180' : ''} ${
                                    location.pathname === '/import' || location.pathname === '/sale' || location.pathname === '/balance' ? 'text-[#8b5cf6]' : ''
                                }`}/>
                            </span>
                        </Button>
                        <Collapse isOpened={submenuIndex === 1 ? true : false}>
                            <ul className="w-full">
                                <li className="w-full">
                                    <Link to="/import">
                                        <Button className={`!capitalize !justify-start !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 transition-all duration-200 ${
                                            location.pathname === '/import'
                                                ? '!text-[#8b5cf6] !bg-[#f3f0ff] hover:!bg-[#ede9fe]'
                                                : '!text-[rgba(0,0,0,0.7)] hover:!bg-[#f8f8f8]'
                                        }`}>
                                            <span className={`block w-[5px] h-[5px] rounded-full ${
                                                location.pathname === '/import' ? 'bg-[#8b5cf6]' : 'bg-[rgba(0,0,0,0.2)]'
                                            }`}></span>{" "} Phiếu
                                            nhập hàng
                                        </Button>
                                    </Link>
                                </li>
                                <li className="w-full">
                                    <Link to="/sale">
                                        <Button className={`!capitalize !justify-start !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 transition-all duration-200 ${
                                            location.pathname === '/sale'
                                                ? '!text-[#8b5cf6] !bg-[#f3f0ff] hover:!bg-[#ede9fe]'
                                                : '!text-[rgba(0,0,0,0.7)] hover:!bg-[#f8f8f8]'
                                        }`}>
                                            <span className={`block w-[5px] h-[5px] rounded-full ${
                                                location.pathname === '/sale' ? 'bg-[#8b5cf6]' : 'bg-[rgba(0,0,0,0.2)]'
                                            }`}></span>{" "} Phiếu
                                            bán hàng
                                        </Button>
                                    </Link>
                                </li>
                                <li className="w-full">
                                    <Link to="/balance">
                                        <Button className={`!capitalize !justify-start !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 transition-all duration-200 ${
                                            location.pathname === '/balance'
                                                ? '!text-[#8b5cf6] !bg-[#f3f0ff] hover:!bg-[#ede9fe]'
                                                : '!text-[rgba(0,0,0,0.7)] hover:!bg-[#f8f8f8]'
                                        }`}>
                                            <span className={`block w-[5px] h-[5px] rounded-full ${
                                                location.pathname === '/balance' ? 'bg-[#8b5cf6]' : 'bg-[rgba(0,0,0,0.2)]'
                                            }`}></span>{" "} Phiếu cân bằng
                                        </Button>
                                    </Link>
                                </li>
                            </ul>
                        </Collapse>

                    </li>
                    <AdminOnly>
                        <li>
                            <Link to="/users">
                                <Button
                                    className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                     !font-[600] items-center !py-2 transition-all duration-200 ${
                                        location.pathname === '/users'
                                            ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                            : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                    }`}>
                                    <FiUsers className={`text-[20px] ${
                                        location.pathname === '/users' ? 'text-[#8b5cf6]' : ''
                                    }`}/> 
                                    <span>Người dùng</span>
                                </Button>
                            </Link>
                        </li>
                    </AdminOnly>
                    <li>
                        <Link to="/customers">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                 !font-[600] items-center !py-2 transition-all duration-200 ${
                                    location.pathname === '/customers'
                                        ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                        : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                }`}>
                                <FiUsers className={`text-[20px] ${
                                    location.pathname === '/customers' ? 'text-[#8b5cf6]' : ''
                                }`}/> 
                                <span>Khách hàng</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/debts">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                 !font-[600] items-center !py-2 transition-all duration-200 ${
                                    location.pathname === '/debts'
                                        ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                        : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                }`}>
                                <TbPigMoney className={`text-[20px] ${
                                    location.pathname === '/debts' ? 'text-[#8b5cf6]' : ''
                                }`}/> 
                                <span>Ghi chú công nợ</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/product">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                !font-[600] items-center !py-2 transition-all duration-200 ${
                                    location.pathname === '/product'
                                        ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                        : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                }`}>
                                <RiProductHuntLine className={`text-[20px] ${
                                    location.pathname === '/product' ? 'text-[#8b5cf6]' : ''
                                }`}/> 
                                <span>Sản phẩm</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/category">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                !font-[600] items-center !py-2 transition-all duration-200 ${
                                    location.pathname === '/category'
                                        ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                        : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                }`}>
                                <TbCategory className={`text-[20px] ${
                                    location.pathname === '/category' ? 'text-[#8b5cf6]' : ''
                                }`}/> 
                                <span>Danh mục</span>
                            </Button>
                        </Link>
                    </li>
                    <AdminOnly>
                        <li>
                            <Link to="/store">
                                <Button
                                    className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                    !font-[600] items-center !py-2 transition-all duration-200 ${
                                        location.pathname === '/store'
                                            ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                            : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                    }`}>
                                    <FaStore className={`text-[20px] ${
                                        location.pathname === '/store' ? 'text-[#8b5cf6]' : ''
                                    }`}/> 
                                    <span>Cửa hàng</span>
                                </Button>
                            </Link>
                        </li>
                    </AdminOnly>
                    <li>
                        <Link to="/stocktake">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                 !font-[600] items-center !py-2 transition-all duration-200 ${
                                    location.pathname === '/stocktake'
                                        ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                        : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                }`}>
                                <FaRegSquareCheck className={`text-[20px] ${
                                    location.pathname === '/stocktake' ? 'text-[#8b5cf6]' : ''
                                }`}/> 
                                <span>Kiểm kho</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/zone">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                !font-[600] items-center !py-2 transition-all duration-200 ${
                                    location.pathname === '/zone'
                                        ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                        : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                }`}>
                                    <MdMap className={`text-[20px] ${
                                        location.pathname === '/zone' ? 'text-[#8b5cf6]' : ''
                                    }`}/> 
                                    <span>Khu vực</span>
                                </Button>
                            </Link>
                        </li>
                    <AdminOnly>
                        <li>
                            <Link to="/change-status-log">
                                <Button
                                    className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                    !font-[600] items-center !py-2 transition-all duration-200 ${
                                        location.pathname === '/change-status-log'
                                            ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                            : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                    }`}>
                                    <MdHistory className={`text-[20px] ${
                                        location.pathname === '/change-status-log' ? 'text-[#8b5cf6]' : ''
                                    }`}/> 
                                    <span>Lịch sử thay đổi</span>
                                </Button>
                            </Link>
                        </li>
                    </AdminOnly>
                    <li>
                        <Link to="/reports/dashboard">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[14px]
                                !font-[600] items-center !py-2 transition-all duration-200 ${
                                    location.pathname.startsWith('/reports')
                                        ? '!bg-[#f3f0ff] !text-[#8b5cf6] hover:!bg-[#ede9fe]' 
                                        : '!text-[rgba(0,0,0,0.8)] hover:!bg-[#f1f1f1]'
                                }`}>
                                <HiOutlineDocumentReport className={`text-[20px] ${
                                    location.pathname.startsWith('/reports') ? 'text-[#8b5cf6]' : ''
                                }`}/> 
                                <span>Báo cáo</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Button
                            onClick={handleLogout}
                            className="w-full !capitalize !justify-start flex gap-3 text-[14px]
                                !text-[rgba(0,0,0,0.8)] !font-[600] items-center !py-2 hover:!bg-[#f1f1f1]">
                            <IoMdLogOut className="text-[20px]"/> <span>Đăng xuất</span>
                        </Button>
                    </li>

                </ul>

            </div>
        </>
    )
}

export default Sidebar;