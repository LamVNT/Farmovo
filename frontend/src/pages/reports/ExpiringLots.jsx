import React, {useEffect, useState} from "react";
import {getExpiringLots} from "../../services/reportService";
import {
    Box,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

const ExpiringLotsReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getExpiringLots()
            .then(res => setData(res.data))
            .catch(() => alert("Lỗi khi lấy báo cáo lô sắp hết hạn!"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box sx={{maxWidth: 1100, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2}}>
            <Typography variant="h5" fontWeight={700} mb={2}>Báo cáo lô hàng sắp hết hạn</Typography>
            {loading ? (
                <Box sx={{textAlign: "center", mt: 6}}>
                    <CircularProgress/>
                    <Typography mt={2}>Đang tải dữ liệu...</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{mt: 2, borderRadius: 2}}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{background: "#f5f5f5"}}>
                                <TableCell><b>Mã lô</b></TableCell>
                                <TableCell><b>Tên sản phẩm</b></TableCell>
                                <TableCell><b>Khu vực</b></TableCell>
                                <TableCell><b>Số lượng còn lại</b></TableCell>
                                <TableCell><b>Ngày hết hạn</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{row.lotId || row.id}</TableCell>
                                        <TableCell>{row.productName || row.name}</TableCell>
                                        <TableCell>{row.zoneName || row.zone}</TableCell>
                                        <TableCell>{row.remainQuantity || row.remain}</TableCell>
                                        <TableCell>{row.expireDate ? new Date(row.expireDate).toLocaleDateString('vi-VN') : ''}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default ExpiringLotsReport; 