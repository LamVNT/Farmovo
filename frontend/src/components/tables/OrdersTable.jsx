import {DataGrid} from "@mui/x-data-grid";
import {TextField} from "@mui/material";
import {useState, useMemo} from "react";

const OrdersTable = ({orders}) => {
    const [searchOrder, setSearchOrder] = useState("");

    // Search by code, partner and store
    const filteredOrders = useMemo(() =>
        orders.filter(o => {
            const code = String(o.code ?? o.name ?? o.id ?? "");
            const partner = String(o.partner ?? "");
            const store = String(o.store ?? "");
            const haystack = (code + " " + partner + " " + store).toLowerCase();
            return haystack.includes(searchOrder.toLowerCase());
        }), [searchOrder, orders]);

    // Robust money formatter: supports number, numeric string, BigDecimal-like
    const formatMoney = (v) => {
        if (v === null || v === undefined) return "";
        const parsed = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
        if (Number.isFinite(parsed)) return parsed.toLocaleString('vi-VN');
        return String(v);
    };

    const prettifyStatus = (value) => {
        if (!value) return "";
        const text = String(value).toLowerCase().replace(/_/g, ' ');
        return text.replace(/(^|\s)\S/g, (t) => t.toUpperCase());
    };

    const orderColumns = [
        { field: 'code', headerName: 'Mã Đơn', flex: 1 },
        { field: 'partner', headerName: 'Khách hàng / Nhà cung cấp', flex: 1.2 },
        { field: 'store', headerName: 'Kho', flex: 1 },
        { field: 'price', headerName: 'Giá', flex: 0.8, renderCell: (params) => formatMoney(params.value) },
        { field: 'created', headerName: 'Ngày tạo', flex: 1 },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 1,
            renderCell: (params) => {
                const raw = String(params.value || '');
                const value = prettifyStatus(raw);
                let color = '';
                switch (raw.toUpperCase()) {
                    case 'COMPLETE':
                        color = 'text-green-700';
                        break;
                    case 'CANCEL':
                        color = 'text-red-700';
                        break;
                    case 'DRAFT':
                        color = 'text-yellow-700';
                        break;
                    case 'PENDING':
                    case 'WAITING_FOR_APPROVE':
                    case 'WAITING_FOR_APPROVAL':
                    case 'PROCESSING':
                        color = 'text-blue-700';
                        break;
                    default:
                        color = 'text-gray-700';
                }
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{value}</span>
                );
            }
        }
    ];

    return (
        <div className="card my-4 shadow-lg rounded-2xl bg-gradient-to-br from-white via-indigo-50 to-indigo-100 p-5">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-indigo-700 drop-shadow-sm">Đơn Hàng Gần Đây</h2>
                <TextField
                    label="Tìm kiếm đơn hàng"
                    size="small"
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    sx={{ background: 'white', borderRadius: 2 }}
                />
            </div>
            <div style={{height: 360}}>
                <DataGrid
                    rows={filteredOrders}
                    columns={orderColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                    sx={{
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 2px 12px 0 rgba(99,102,241,0.08)',
                        '& .MuiDataGrid-columnHeaders': {
                            background: 'linear-gradient(90deg,#e0e7ff 0%,#f5f5f5 100%)',
                            fontWeight: 'bold',
                            fontSize: 15,
                            color: '#3730a3',
                        },
                        '& .MuiDataGrid-row': { transition: 'background 0.2s' },
                        '& .MuiDataGrid-row:hover': { background: '#e0e7ff33' },
                        '& .MuiDataGrid-cell': { fontSize: 14 },
                    }}
                />
            </div>
        </div>
    );
};

export default OrdersTable;
