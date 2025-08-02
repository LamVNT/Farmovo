import React, {useContext, useState} from "react";
import {Link, useNavigate} from "react-router-dom"
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


const Sidebar = () => {
    const [submenuIndex, setSubmenuIndex] = useState(null)
    const isOpenSubMenu = (index) => {
        if (submenuIndex === index) {
            setSubmenuIndex(null);
        } else {
            setSubmenuIndex(index);
        }
    }

    const navigate = useNavigate();
    const context = useContext(MyContext);

    const handleLogout = async () => {
        try {
            await api.post("/logout", {}, {withCredentials: true}); // Gọi backend để xoá cookie
            localStorage.removeItem("user"); // ✅ Gợi ý #4: Xoá user info
            context.setIslogin(false); // Cập nhật lại state
            navigate("/login"); // Chuyển hướng
        } catch (error) {
            console.error("Logout error:", error);
        }
    };


    return (
        <>
            <div
                className={`sidebar fixed top-0 left-0 h-full z-30 transition-all duration-300
                ${context.isSidebarOpen ? 'w-[260px] min-w-[220px] max-w-[300px] px-4' : 'w-0 px-0'}
                bg-gradient-to-br from-white via-[#f8faff] to-[#e0e7ff] border-r border-indigo-100 shadow-xl rounded-tr-3xl rounded-br-3xl`}
            >
                <div className="py-6 w-full flex items-center justify-center mb-2">
                    <Link to="/">
                        <div className="flex flex-col items-center w-full">
                            <img src={FarmovoLogo} alt="Farmovo Logo" className="w-[90px] h-[90px] object-contain mb-1"/>
                            <span className="font-extrabold text-xl text-gray-800 tracking-wide leading-tight">FARMOVO</span>
                            <span className="text-[13px] text-gray-500 font-semibold tracking-wide -mt-1">EASY EGG-EASY SALE</span>
                        </div>
                    </Link>
                </div>

                <ul className="mt-2 flex flex-col gap-1">
                    <li>
                        <Link to="/">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${window.location.pathname === '/' ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            >
                                <RxDashboard className="text-[22px]"/> <span>Bảng điều khiển</span>
                            </Button>
                        </Link>
                    </li>
                    <div className="my-1 border-b border-indigo-50"></div>
                    <li>
                        <Button
                            className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${submenuIndex === 1 ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            onClick={() => isOpenSubMenu(1)}>
                            <GrTransaction className="text-[22px]"/> <span>Giao dịch</span>
                            <span className="ml-auto w-[30px] h-[30px] flex items-center justify-center">
                                <FaAngleDown className={`transition-all ${submenuIndex === 1 ? 'rotate-180' : ''}`}/>
                            </span>
                        </Button>
                        <Collapse isOpened={submenuIndex === 1 ? true : false}>
                            <ul className="w-full">
                                <li className="w-full">
                                    <Link to="/import">
                                        <Button className="!text-[rgba(99,102,241,0.8)] !capitalize !justify-start
                                         !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 hover:!bg-indigo-50 rounded-lg">
                                            <span className="block w-[5px] h-[5px] rounded-full bg-indigo-200"></span>{" " } Phiếu nhập hàng
                                        </Button>
                                    </Link>
                                </li>
                                <li className="w-full">
                                    <Link to="/sale">
                                        <Button className="!text-[rgba(99,102,241,0.8)] !capitalize
                                         !justify-start !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 hover:!bg-indigo-50 rounded-lg">
                                            <span className="block w-[5px] h-[5px] rounded-full bg-indigo-200"></span>{" " } Phiếu bán hàng
                                        </Button>
                                    </Link>
                                </li>
                            </ul>
                        </Collapse>
                    </li>
                    <div className="my-1 border-b border-indigo-50"></div>
                    <li>
                        <Link to="/users">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${window.location.pathname.startsWith('/users') ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            >
                                <FiUsers className="text-[22px]"/> <span>Người dùng</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/customers">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${window.location.pathname.startsWith('/customers') ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            >
                                <FiUsers className="text-[22px]"/> <span>Khách hàng</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/debts">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${window.location.pathname.startsWith('/debts') ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            >
                                <TbPigMoney className="text-[22px]"/> <span>Ghi chú công nợ</span>
                            </Button>
                        </Link>
                    </li>
                    <div className="my-1 border-b border-indigo-50"></div>
                    <li>
                        <Button
                            className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${submenuIndex === 3 ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            onClick={() => isOpenSubMenu(3)}
                        >
                            <RiProductHuntLine className="text-[22px]"/> <span>Sản phẩm</span>
                            <span className="ml-auto block w-[30px] h-[30px] flex items-center justify-center">
                                <FaAngleDown className={`transition-all ${submenuIndex === 3 ? 'rotate-180' : ''}`}/>
                            </span>
                        </Button>
                        <Collapse isOpened={submenuIndex === 3}>
                            <ul className="w-full">
                                <li className="w-full">
                                    <Link to="/product">
                                        <Button className="!text-[rgba(99,102,241,0.8)] !capitalize !justify-start
                                            !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 hover:!bg-indigo-50 rounded-lg">
                                            <span className="block w-[5px] h-[5px] rounded-full bg-indigo-200"></span>{" " } Danh sách sản phẩm
                                        </Button>
                                    </Link>
                                </li>
                                <li className="w-full">
                                    <Link to="/product/add">
                                        <Button className="!text-[rgba(99,102,241,0.8)] !capitalize
                                         !justify-start !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 hover:!bg-indigo-50 rounded-lg">
                                            <span className="block w-[5px] h-[5px] rounded-full bg-indigo-200"></span>{" " } Thêm sản phẩm
                                        </Button>
                                    </Link>
                                </li>
                            </ul>
                        </Collapse>
                    </li>
                    <li>
                        <Link to="/category">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${window.location.pathname.startsWith('/category') ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            >
                                <TbCategory className="text-[22px]"/> <span>Danh mục</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/store">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${window.location.pathname.startsWith('/store') ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            >
                                <FaStore className="text-[22px]"/> <span>Cửa hàng</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/stocktake">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${window.location.pathname.startsWith('/stocktake') ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            >
                                <FaRegSquareCheck className="text-[22px]"/> <span>Kiểm kho</span>
                            </Button>
                        </Link>
                    </li>
                    <li>
                        <Link to="/zone">
                            <Button
                                className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${window.location.pathname.startsWith('/zone') ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            >
                                <MdMap className="text-[22px]"/> <span>Khu vực</span>
                            </Button>
                        </Link>
                    </li>
                    <div className="my-1 border-b border-indigo-50"></div>
                    <li>
                        <Button
                            className={`w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-black hover:!bg-indigo-50 hover:!text-indigo-900 shadow-none
                                ${submenuIndex === 5 ? '!bg-indigo-100 !text-indigo-900 shadow-md' : ''}`}
                            onClick={() => isOpenSubMenu(5)}
                        >
                            <HiOutlineDocumentReport className="text-[22px]"/> <span>Báo cáo</span>
                            <span className="ml-auto block w-[30px] h-[30px] flex items-center justify-center">
                                <FaAngleDown className={`transition-all ${submenuIndex === 5 ? 'rotate-180' : ''}`}/>
                            </span>
                        </Button>
                        <Collapse isOpened={submenuIndex === 5}>
                            <ul className="w-full">
                                <li className="w-full">
                                    <Link to="/reports/remain-by-product">
                                        <Button
                                            className="!text-[rgba(99,102,241,0.8)] !capitalize !justify-start !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 hover:!bg-indigo-50 rounded-lg">
                                            <FaBoxOpen className="text-[16px]"/> Tồn kho theo sản phẩm
                                        </Button>
                                    </Link>
                                </li>
                                <li className="w-full">
                                    <Link to="/reports/stocktake-diff">
                                        <Button
                                            className="!text-[rgba(99,102,241,0.8)] !capitalize !justify-start !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 hover:!bg-indigo-50 rounded-lg">
                                            <FaExclamationTriangle className="text-[16px]"/> Sản phẩm sai lệch
                                        </Button>
                                    </Link>
                                </li>
                                <li className="w-full">
                                    <Link to="/reports/expiring-lots">
                                        <Button
                                            className="!text-[rgba(99,102,241,0.8)] !capitalize !justify-start !w-full !text-[13px] !font-[600] !pl-9 flex gap-3 hover:!bg-indigo-50 rounded-lg">
                                            <FaClock className="text-[16px]"/> Lô sắp hết hạn
                                        </Button>
                                    </Link>
                                </li>
                            </ul>
                        </Collapse>
                    </li>
                    <div className="my-1 border-b border-indigo-50"></div>
                    <li>
                        <Button
                            onClick={handleLogout}
                            className="w-full !capitalize !justify-start flex gap-3 text-[15px] !font-bold items-center !py-2 rounded-xl transition-all
                                !text-red-500 hover:!bg-red-50 hover:!text-red-700 shadow-none">
                            <IoMdLogOut className="text-[22px]"/> <span>Đăng xuất</span>
                        </Button>
                    </li>

                </ul>

            </div>
        </>
    )
}

export default Sidebar;