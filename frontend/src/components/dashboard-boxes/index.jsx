import React from "react";
import {Swiper, SwiperSlide} from 'swiper/react';
import {Navigation} from 'swiper/modules';
import 'swiper/css'
import 'swiper/css/navigation';
import {AiTwotoneGift} from "react-icons/ai";
import {IoStatsChartSharp} from "react-icons/io5";
import {FiShoppingBag} from "react-icons/fi";
import {LuPiggyBank} from "react-icons/lu";
import {TbBrandProducthunt} from "react-icons/tb";


const DashboardBoxes = ({
    totalProducts,
    totalCustomers,
    totalSuppliers,
    totalImportOrders,
    totalExportOrders,
    totalRevenue,
    expiringLots,
}) => {
    return (
        <>
            <Swiper
                slidesPerView={4}
                spaceBetween={10}
                navigation={true}
                modules={[Navigation]}
                className="dashboardBoxesSlider"
            >
                <SwiperSlide>
                    <div
                        className="box bg-white p-5 cursor-pointer hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4">
                        <TbBrandProducthunt className="text-[40px] text-[#7928ca]"/>
                        <div className="info w-[70%] ">
                            <h3>Tổng Sản Phẩm</h3>
                            <b>{totalProducts ?? '-'}</b>
                        </div>
                        <IoStatsChartSharp className="text-[50px] text-[#7928ca]"/>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div
                        className="box p-5 bg-white cursor-pointer hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4">
                        <AiTwotoneGift className="text-[40px] text-[#3872fa]"/>
                        <div className="info w-[70%]">
                            <h3>Tổng Khách Hàng</h3>
                            <b>{totalCustomers ?? '-'}</b>
                        </div>
                        <IoStatsChartSharp className="text-[50px] text-[#3872fa]"/>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div
                        className="box p-5 bg-white cursor-pointer hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4">
                        <AiTwotoneGift className="text-[40px] text-[#10b981]"/>
                        <div className="info w-[70%]">
                            <h3>Tổng Nhà Cung Cấp</h3>
                            <b>{totalSuppliers ?? '-'}</b>
                        </div>
                        <IoStatsChartSharp className="text-[50px] text-[#10b981]"/>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div
                        className="box p-5 bg-white cursor-pointer hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4">
                        <FiShoppingBag className="text-[40px] text-[#3872fa]"/>
                        <div className="info w-[70%]">
                            <h3>Đơn Hàng Nhập</h3>
                            <b>{totalImportOrders ?? '-'}</b>
                        </div>
                        <IoStatsChartSharp className="text-[50px] text-[#3872fa]"/>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div
                        className="box p-5 bg-white cursor-pointer hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4">
                        <FiShoppingBag className="text-[40px] text-[#10b981]"/>
                        <div className="info w-[70%]">
                            <h3>Đơn Hàng Xuất</h3>
                            <b>{totalExportOrders ?? '-'}</b>
                        </div>
                        <IoStatsChartSharp className="text-[50px] text-[#10b981]"/>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div
                        className="box p-5 bg-white cursor-pointer hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4">
                        <LuPiggyBank className="text-[40px]  text-[#3872fa]"/>
                        <div className="info w-[70%]">
                            <h3>Tổng Doanh Thu</h3>
                            <b>{totalRevenue != null ? totalRevenue.toLocaleString() : '-'}</b>
                        </div>
                        <IoStatsChartSharp className="text-[50px] text-[#3872fa]"/>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div
                        className="box p-5 bg-white cursor-pointer hover:bg-[#f1f1f1] rounded-md border border-[rgba(0,0,0,0.1)] flex items-center gap-4">
                        <AiTwotoneGift className="text-[40px] text-[#fa3838]"/>
                        <div className="info w-[70%]">
                            <h3>Lô Hết Hạn</h3>
                            <b>{expiringLots ?? '-'}</b>
                        </div>
                        <IoStatsChartSharp className="text-[50px] text-[#fa3838]"/>
                    </div>
                </SwiperSlide>
            </Swiper>
        </>
    )
}

export default DashboardBoxes;