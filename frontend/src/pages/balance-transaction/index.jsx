import React, { useState, useEffect, useRef } from "react";
import { DataGrid } from '@mui/x-data-grid';
import { Alert, TextField, Button, Checkbox, FormControl, Select, MenuItem } from '@mui/material';
import balanceTransactionService from '../../services/balanceTransactionService';
import { formatCurrency } from "../../utils/formatters";

const BalanceTransactionPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadTransactions();
    }, [page, pageSize, search]);

    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                size: pageSize,
                search,
            };
            const data = await balanceTransactionService.listPaged(params);
            setTransactions(Array.isArray(data) ? data : (data?.content || []));
            setTotal(data?.totalElements || 0);
        } catch (err) {
            setError('Không thể tải danh sách phiếu cân bằng');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { field: 'name', headerName: 'Mã phiếu', width: 160 },
        { field: 'customerName', headerName: 'Khách hàng', width: 160 },
        { field: 'storeName', headerName: 'Cửa hàng', width: 150 },
        { field: 'saleDate', headerName: 'Thời gian', width: 170, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString('vi-VN') : '' },
        { field: 'totalAmount', headerName: 'Tổng tiền', width: 130, valueFormatter: (params) => formatCurrency(params.value || 0) },
        { field: 'paidAmount', headerName: 'Đã thanh toán', width: 130, valueFormatter: (params) => formatCurrency(params.value || 0) },
        { field: 'status', headerName: 'Trạng thái', width: 120 },
    ];

    return (
        <div className="w-full relative">
            {error && (
                <Alert severity="error" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
                    {error}
                </Alert>
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Phiếu Cân Bằng Kho</h2>
            </div>
            <div className="mb-4 w-1/2">
                <TextField
                    label="Tìm kiếm khách hàng, cửa hàng..."
                    size="small"
                    fullWidth
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                />
            </div>
            <div style={{ height: 500, overflowY: 'auto', overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
                <DataGrid
                    rows={transactions}
                    columns={columns}
                    page={page}
                    pageSize={pageSize}
                    rowCount={total}
                    pagination
                    paginationMode="server"
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    loading={loading}
                    getRowId={row => row.id}
                />
            </div>
        </div>
    );
};

export default BalanceTransactionPage; 