import React, {useEffect, useState} from "react";
import {getRemainByProduct} from "../../services/reportService";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Button
} from "@mui/material";
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const RemainByProductReport = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRemainByProduct()
            .then(res => setData(res.data))
            .catch(() => alert("Lỗi khi lấy báo cáo tồn kho!"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box sx={{maxWidth: 1100, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2}}>
            <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
            <Typography variant="h5" fontWeight={700} mb={2}>Báo cáo tồn kho theo sản phẩm</Typography>
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
                                <TableCell><b>Mã SP</b></TableCell>
                                <TableCell><b>Tên sản phẩm</b></TableCell>
                                <TableCell><b>Tồn kho</b></TableCell>
                                <TableCell><b>Đơn vị</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">Không có dữ liệu</TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{row.productId || row.id}</TableCell>
                                        <TableCell>{row.productName || row.name}</TableCell>
                                        <TableCell>{row.remain}</TableCell>
                                        <TableCell>{row.unit || ''}</TableCell>
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

export default RemainByProductReport; 