import React, { useState, useEffect } from "react";
import useDebtNotes from "../../hooks/useDebtNotes";
import {
    Container,
    Typography,
    Button,
    Box,
    TextField,
    InputAdornment,
    IconButton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tabs,
    Tab,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import DebtTable from "../../components/debt/DebtTableDialog.jsx";
import AddDebtDialog from "../../components/debt/AddDebtDialog";
import DebtDetailDialog from "../../components/debt/DebtDetailDialog.jsx";
import { getDebtNotesByCustomerId, getTotalDebtByCustomerId } from "../../services/debtService";
import { getAllCustomers, getCustomerById } from "../../services/customerService";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatCurrency } from "../../utils/formatters";

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
    const [activeTab, setActiveTab] = useState(0); // 0: Khách hàng nợ, 1: Cửa hàng nợ, 2: Không nợ

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

    const handleOpenDebtTable = (custId) => {
        if (custId === selectedCustomerId) {
            setDebtTableOpen(true);
            // optionally refetch
            fetchDebtNotes(custId);
        } else {
            setSelectedCustomerId(custId);
        }
    };


    const handleViewDebtNote = (debtNote) => {
        if (debtNote) {
            setSelectedDebtNote(debtNote);
            setDetailDialogOpen(true);
        }
    };

    const formatTotalDebt = (totalDebt) => {
        if (totalDebt == null || totalDebt === 0) return formatCurrency(0);
        if (totalDebt < 0) {
            return (
                <span style={{ color: 'red', fontWeight: 'bold' }}>- {formatCurrency(Math.abs(totalDebt))} <span style={{ fontWeight: 'normal', fontSize: 12 }}>(Khách đang nợ)</span></span>
            );
        }
        return (
            <span style={{ color: 'green', fontWeight: 'bold' }}>+ {formatCurrency(totalDebt)} <span style={{ fontWeight: 'normal', fontSize: 12 }}>(Cửa hàng nợ)</span></span>
        );
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
    // Lọc khách hàng theo tab hiện tại
    let filteredByTab = customers;
    if (activeTab === 0) {
        // Tab "Khách hàng nợ" - chỉ hiển thị khách hàng có nợ âm (khách đang nợ)
        filteredByTab = customers.filter(cust => 
            cust.totalDebt !== null && 
            cust.totalDebt !== undefined && 
            cust.totalDebt < 0
        );
    } else if (activeTab === 1) {
        // Tab "Cửa hàng nợ" - chỉ hiển thị khách hàng có nợ dương (cửa hàng đang nợ)
        filteredByTab = customers.filter(cust => 
            cust.totalDebt !== null && 
            cust.totalDebt !== undefined && 
            cust.totalDebt > 0
        );
    } else if (activeTab === 2) {
        // Tab "Không nợ" - hiển thị khách hàng có tổng nợ bằng 0
        filteredByTab = customers.filter(cust => Number(cust.totalDebt) === 0);
    }

    // Lọc theo loại khách hàng
    let filteredByType = filteredByTab;
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
    // DataGrid columns definition
    const columns = [
        { field: 'name', headerName: 'Tên', flex: 1 },
        { field: 'phone', headerName: 'Số điện thoại', flex: 1 },
        { field: 'address', headerName: 'Địa chỉ', flex: 1.5 },
        {
            field: 'typeLabel', headerName: 'Loại khách hàng', flex: 1, renderCell: (params) => (
                <span style={{
                    padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                    backgroundColor: params.row.isSupplier ? '#e3f2fd' : '#f3e5f5',
                    color: params.row.isSupplier ? '#1976d2' : '#7b1fa2'
                }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'totalDebt', headerName: 'Tổng nợ', flex: 1, renderCell: (params) => formatTotalDebt(params.value)
        },
        {
            field: 'actions', headerName: 'Hành động', flex: 0.6, sortable: false, filterable: false, renderCell: (params) => (
                <IconButton color="primary" onClick={() => handleOpenDebtTable(params.row.id)} disabled={!params.row.id}>
                    <VisibilityIcon />
                </IconButton>
            )
        }
    ];

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

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setCustomerPage(0); // Reset về trang đầu khi chuyển tab
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

            {/* Tabs để phân chia loại nợ */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="debt management tabs">
                    <Tab 
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>Khách hàng nợ</span>
                                <Box sx={{ 
                                    backgroundColor: 'red', 
                                    color: 'white', 
                                    borderRadius: '50%', 
                                    width: 20, 
                                    height: 20, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {customers.filter(cust => cust.totalDebt < 0).length}
                                </Box>
                            </Box>
                        } 
                    />
                    <Tab 
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>Cửa hàng nợ</span>
                                <Box sx={{ 
                                    backgroundColor: 'green', 
                                    color: 'white', 
                                    borderRadius: '50%', 
                                    width: 20, 
                                    height: 20, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {customers.filter(cust => cust.totalDebt > 0).length}
                                </Box>
                            </Box>
                        } 
                    />
                    <Tab 
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>Không nợ</span>
                                <Box sx={{ 
                                    backgroundColor: '#9e9e9e', 
                                    color: 'white', 
                                    borderRadius: '50%', 
                                    width: 20, 
                                    height: 20, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {customers.filter(cust => Number(cust.totalDebt) === 0).length}
                                </Box>
                            </Box>
                        } 
                    />
                </Tabs>
            </Box>

            {/* Bảng danh sách khách hàng */}
            <Typography variant="h6" gutterBottom>
                Danh sách khách hàng {activeTab === 0 ? '(Khách hàng nợ)' : activeTab === 1 ? '(Cửa hàng nợ)' : '(Không nợ)'}
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
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tên</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Số điện thoại</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Địa chỉ</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Loại khách hàng</TableCell>
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
                                <TableCell>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        backgroundColor: cust.isSupplier ? '#e3f2fd' : '#f3e5f5',
                                        color: cust.isSupplier ? '#1976d2' : '#7b1fa2'
                                    }}>
                                        {cust.isSupplier ? 'Nhà cung cấp' : 'Khách mua'}
                                    </span>
                                </TableCell>
                                <TableCell>{formatTotalDebt(cust.totalDebt)}</TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={() => handleOpenDebtTable(cust.id)} disabled={!cust.id}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6}>Không có khách hàng</TableCell>
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
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
            />

            {/* Chú thích ký hiệu tổng nợ */}
            <Typography variant="body2" align="right" sx={{ mt: 2 }}>
                <span style={{ color: 'red', fontWeight: 'bold' }}>"-": khách đang nợ</span>
                <span style={{ margin: '0 8px' }}>, </span>
                <span style={{ color: 'green', fontWeight: 'bold' }}>"+": cửa hàng nợ</span>
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