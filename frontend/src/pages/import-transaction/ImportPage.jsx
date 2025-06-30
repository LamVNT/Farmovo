import React from 'react';
import { TextField, Button, Checkbox, FormControlLabel } from '@mui/material';
import { FaLock, FaCheck } from 'react-icons/fa';
import { AiOutlinePlus } from 'react-icons/ai';

const ImportPage = () => {
    return (
        <div className="flex w-full h-screen bg-gray-100">
            {/* Table nhập hàng */}
            <div className="flex-1 p-4 bg-white rounded-md m-4 shadow-md">
                <div className="mb-4 font-semibold text-lg">Nhập hàng</div>

                <table className="w-full border-collapse">
                    <thead className="bg-blue-100">
                    <tr>
                        <th className="p-2 border text-sm">STT</th>
                        <th className="p-2 border text-sm">Mã hàng</th>
                        <th className="p-2 border text-sm">Tên hàng</th>
                        <th className="p-2 border text-sm">ĐVT</th>
                        <th className="p-2 border text-sm">Số lượng</th>
                        <th className="p-2 border text-sm">Đơn giá</th>
                        <th className="p-2 border text-sm">Giảm giá</th>
                        <th className="p-2 border text-sm">Thành tiền</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td colSpan="8" className="text-center py-10 text-sm text-gray-600">
                            <div className="font-semibold text-base mb-1">Thêm sản phẩm từ file excel</div>
                            <div className="text-sm mb-3">
                                (Tải về file mẫu: <a href="#" className="text-blue-600 underline">Excel file</a>)
                            </div>
                            <Button
                                variant="contained"
                                className="!bg-green-600 hover:!bg-green-700"
                                startIcon={<AiOutlinePlus />}
                            >
                                Chọn file dữ liệu
                            </Button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* Bên phải: Thông tin nhập hàng */}
            <div className="w-96 bg-white p-4 m-4 rounded-md shadow-md space-y-4 text-sm">
                <div className="flex justify-between items-center">
                    <span className="font-semibold">👤 Vũ Lâm</span>
                    <span className="text-xs text-gray-500">30/06/2025 23:51</span>
                </div>

                <TextField size="small" fullWidth placeholder="Tìm nhà cung cấp" />
                <hr />

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <div className="font-semibold">Mã phiếu nhập</div>
                        <div>Mã phiếu tự động</div>
                    </div>
                </div>

                <div className="font-semibold">Mã đặt hàng nhập</div>

                <div className="font-semibold">Trạng thái</div>
                <FormControlLabel
                    control={<Checkbox checked />}
                    label="Phiếu tạm"
                />

                <div className="flex justify-between">
                    <div className="font-semibold">Tổng tiền hàng</div>
                    <TextField value="0" size="small" style={{ width: '60px' }} />
                </div>

                <div className="flex justify-between">
                    <div className="font-semibold">Giảm giá</div>
                    <div>0</div>
                </div>

                <div className="flex justify-between">
                    <div className="font-semibold">Cần trả nhà cung cấp</div>
                    <div className="text-blue-600 cursor-pointer">0</div>
                </div>

                <TextField
                    multiline
                    rows={2}
                    placeholder="Ghi chú"
                    fullWidth
                    variant="outlined"
                    size="small"
                />

                <div className="flex gap-2 pt-2">
                    <Button
                        fullWidth
                        variant="contained"
                        className="!bg-blue-600 hover:!bg-blue-700 text-white"
                        startIcon={<FaLock />}
                    >
                        Lưu tạm
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        className="!bg-green-600 hover:!bg-green-700 text-white"
                        startIcon={<FaCheck />}
                    >
                        Hoàn thành
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ImportPage;
