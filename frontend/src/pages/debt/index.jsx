import React, { useState, useEffect } from "react";
import useDebtNotes from "../../hooks/useDebtNotes";
import {
    Container,
    Typography,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    InputAdornment,
    IconButton,
    Stack,
    ToggleButton,
    ToggleButtonGroup
} from "@mui/material";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import DebtTable from "../../components/debt/DebtTable";
import AddDebtDialog from "../../components/debt/AddDebtDialog";
import DebtDetailDialog from "../../components/debt/DebtDetailDialog.jsx";
import { getDebtNotesByCustomerId, getTotalDebtByCustomerId } from "../../services/debtService";
import { getAllCustomers, getCustomerById } from "../../services/customerService";
import VisibilityIcon from '@mui/icons-material/Visibility';

const DebtManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [customer, setCustomer] = useState(null);
    const {
        debtNotes,
        totalDebt,
        page: debtNotesPage,
        size: debtNotesRowsPerPage,
        totalPages: debtNotesTotalPages,
        totalItems: debtNotesTotalItems,
        setPage: setDebtNotesPage,
        setSize: setDebtNotesRowsPerPage,
        fetchDebtNotes,
    } = useDebtNotes();
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [debtTableOpen, setDebtTableOpen] = useState(false); // State cho modal DebtTable
    const [selectedDebtNote, setSelectedDebtNote] = useState(null);
    const [error, setError] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerPage, setCustomerPage] = useState(0);
    const [customerRowsPerPage, setCustomerRowsPerPage] = useState(5);
    const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
    const [filterDebt, setFilterDebt] = useState(false);

    // Date filter for debt notes
    const [debtFromDate, setDebtFromDate] = useState(null);
    const [debtToDate, setDebtToDate] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const customerData = await getAllCustomers();
                setCustomers(customerData || []);
            } catch (error) {
                console.error("Failed to fetch customers:", error);
                setError("Không thể tải danh sách khách hàng");
            }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (selectedCustomerId) {
            const load = async () => {
                try {
                    setError("");
                    const customerData = await getCustomerById(selectedCustomerId);
                    setCustomer(customerData);
                    await fetchDebtNotes(selectedCustomerId, buildDebtFilters());
                    setDebtTableOpen(true);
                } catch (error) {
                    console.error("Failed to fetch customer data:", error);
                    setError("Không thể tải dữ liệu khách hàng: " + (error.response?.data?.message || error.message));
                }
            };
            load();
        }
    }, [selectedCustomerId, debtNotesPage, debtNotesRowsPerPage, fetchDebtNotes, debtFromDate, debtToDate]);

    const handleAddDebtNote = () => {
        fetchDebtNotes(selectedCustomerId);
    };

    const handleViewDebtNote = (debtNote) => {
        if (debtNote) {
            setSelectedDebtNote(debtNote);
            setDetailDialogOpen(true);
        }
    };

    const formatTotalDebt = (totalDebt) => {
        if (totalDebt == null || totalDebt === 0) return "0 VND";
        if (totalDebt < 0) {
            return (
                <span style={{ color: 'red', fontWeight: 'bold' }}>- {Math.abs(totalDebt)} VND <span style={{fontWeight:'normal', fontSize:12}}>(Khách đang nợ)</span></span>
            );
        } else {
            return (
                <span style={{ color: 'green', fontWeight: 'bold' }}>+ {totalDebt} VND <span style={{fontWeight:'normal', fontSize:12}}>(Cửa hàng nợ)</span></span>
            );
        }
    };

    const handleCustomerSearchChange = (e) => {
        setCustomerSearch(e.target.value);
        setCustomerPage(0);
    };
    const handleCustomerPageChange = (event, newPage) => {
        setCustomerPage(newPage);
    };
    const handleCustomerRowsPerPageChange = (event) => {
        setCustomerRowsPerPage(parseInt(event.target.value, 10));
        setCustomerPage(0);
    };
    // Lọc chỉ lấy khách hàng có tổng nợ khác 0
    let nonZeroDebtCustomers = customers.filter(cust => cust.totalDebt !== 0 && cust.totalDebt !== null && cust.totalDebt !== undefined);
    // Lọc theo loại khách hàng
    let filteredByType = nonZeroDebtCustomers;
    if (customerTypeFilter === 'supplier') {
        filteredByType = filteredByType.filter(cust => cust.isSupplier);
    } else if (customerTypeFilter === 'buyer') {
        filteredByType = filteredByType.filter(cust => !cust.isSupplier);
    }
    const filteredCustomers = filteredByType.filter(cust => {
        const name = cust.name?.toLowerCase() || "";
        const phone = cust.phone?.toLowerCase() || "";
        const address = cust.address?.toLowerCase() || "";
        const search = customerSearch.toLowerCase();
        return (
            name.includes(search) ||
            phone.includes(search) ||
            address.includes(search)
        );
    });
    const paginatedCustomers = filteredCustomers.slice(customerPage * customerRowsPerPage, customerPage * customerRowsPerPage + customerRowsPerPage);

    const handleDebtNotesPageChange = (event, newPage) => {
        setDebtNotesPage(newPage);
    };
    const handleDebtNotesRowsPerPageChange = (event) => {
        setDebtNotesRowsPerPage(parseInt(event.target.value, 10));
        setDebtNotesPage(0);
    };

    // Handle date filter change from DebtTable
    const handleDateFilterChange = (from, to) => {
        setDebtFromDate(from);
        setDebtToDate(to);
    };

    const buildDebtFilters = () => {
        const filters = {};
        if (debtFromDate) filters.fromDate = debtFromDate.toISOString();
        if (debtToDate) filters.toDate = debtToDate.toISOString();
        return filters;
    };

    return (
        <Box p={3} bgcolor="#fff" borderRadius={2} boxShadow={1}>
            <Typography variant="h5" fontWeight={600} mb={2}>
                Quản lý nợ
            </Typography>
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            {/* Bảng danh sách khách hàng */}
            <Typography variant="h6" gutterBottom>
                Danh sách khách hàng
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={2}>
                <TextField
                    placeholder="Tìm kiếm tên, SĐT hoặc địa chỉ..."
                    value={customerSearch}
                    onChange={handleCustomerSearchChange}
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <ToggleButtonGroup
                    value={customerTypeFilter}
                    exclusive
                    onChange={(e, newValue) => { if (newValue) setCustomerTypeFilter(newValue); }}
                    size="small"
                    sx={{ ml: 2 }}
                >
                    <ToggleButton value="all">Tất cả</ToggleButton>
                    <ToggleButton value="buyer">Khách mua</ToggleButton>
                    <ToggleButton value="supplier">Nhà cung cấp</ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tên</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Số điện thoại</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Địa chỉ</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tổng nợ</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedCustomers && paginatedCustomers.length > 0 ? (
                            paginatedCustomers.map((cust) => (
                                <TableRow key={cust.id || Math.random()}>
                                    <TableCell>{cust.name || "N/A"}</TableCell>
                                    <TableCell>{cust.phone || "N/A"}</TableCell>
                                    <TableCell>{cust.address || "N/A"}</TableCell>
                                    <TableCell>{formatTotalDebt(cust.totalDebt)}</TableCell>
                                    <TableCell>
                                        <IconButton color="primary" onClick={() => setSelectedCustomerId(cust.id)} disabled={!cust.id}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5}>Không có khách hàng</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={filteredCustomers.length}
                    page={customerPage}
                    onPageChange={handleCustomerPageChange}
                    rowsPerPage={customerRowsPerPage}
                    onRowsPerPageChange={handleCustomerRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25]}
                />
            </div>

            {/* Chú thích ký hiệu tổng nợ */}
            <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 2 }}>
                "-": khách đang nợ, "+": cửa hàng nợ
            </Typography>

            {/* Chi tiết khách hàng và giao dịch nợ */}
            {customer && selectedCustomerId && (
                <DebtTable
                    open={debtTableOpen}
                    onClose={() => setDebtTableOpen(false)}
                    debtNotes={debtNotes}
                    onEdit={handleViewDebtNote}
                    customer={customer}
                    totalDebt={totalDebt}
                    onAddDebt={() => setAddDialogOpen(true)}
                    addDialogOpen={addDialogOpen}
                    onAddDialogClose={() => setAddDialogOpen(false)}
                    onAddDebtNote={handleAddDebtNote}
                    debtNotesPage={debtNotesPage}
                    debtNotesRowsPerPage={debtNotesRowsPerPage}
                    debtNotesTotalPages={debtNotesTotalPages}
                    debtNotesTotalItems={debtNotesTotalItems}
                    onDebtNotesPageChange={handleDebtNotesPageChange}
                    onDebtNotesRowsPerPageChange={handleDebtNotesRowsPerPageChange}
                    fromDate={debtFromDate}
                    toDate={debtToDate}
                    onDateFilterChange={handleDateFilterChange}
                />
            )}
            <DebtDetailDialog
                open={detailDialogOpen}
                onClose={() => {
                    setDetailDialogOpen(false);
                    setSelectedDebtNote(null);
                }}
                debtNote={selectedDebtNote}
            />
        </Box>
    );
};

export default DebtManagement;