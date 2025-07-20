import React, { useState, useEffect } from "react";
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
    Stack
} from "@mui/material";
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
    const [debtNotes, setDebtNotes] = useState([]);
    const [debtNotesPage, setDebtNotesPage] = useState(0);
    const [debtNotesRowsPerPage, setDebtNotesRowsPerPage] = useState(10);
    const [debtNotesTotalPages, setDebtNotesTotalPages] = useState(0);
    const [debtNotesTotalItems, setDebtNotesTotalItems] = useState(0);
    const [totalDebt, setTotalDebt] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [debtTableOpen, setDebtTableOpen] = useState(false); // State cho modal DebtTable
    const [selectedDebtNote, setSelectedDebtNote] = useState(null);
    const [error, setError] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerPage, setCustomerPage] = useState(0);
    const [customerRowsPerPage, setCustomerRowsPerPage] = useState(5);

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
            const fetchCustomerData = async () => {
                try {
                    setError("");
                    const customerData = await getCustomerById(selectedCustomerId);
                    setCustomer(customerData);

                    const debtNotesData = await getDebtNotesByCustomerId(selectedCustomerId, debtNotesPage, debtNotesRowsPerPage);
                    setDebtNotes(debtNotesData.content || []);
                    setDebtNotesTotalPages(debtNotesData.totalPages || 0);
                    setDebtNotesTotalItems(debtNotesData.totalItems || 0);

                    try {
                        const totalDebtData = await getTotalDebtByCustomerId(selectedCustomerId);
                        setTotalDebt(totalDebtData || 0);
                    } catch (error) {
                        console.error("Failed to fetch total debt, continuing with other data:", error);
                        setTotalDebt(0);
                        setError("Không thể tải tổng nợ, nhưng dữ liệu khác vẫn được hiển thị");
                    }

                    setDebtTableOpen(true);
                } catch (error) {
                    console.error("Failed to fetch customer data:", error);
                    setError("Không thể tải dữ liệu khách hàng: " + (error.response?.data?.message || error.message));
                }
            };
            fetchCustomerData();
        }
    }, [selectedCustomerId, debtNotesPage, debtNotesRowsPerPage]);

    const handleAddDebtNote = (newDebtNote) => {
        if (newDebtNote) {
            setDebtNotes([...debtNotes, newDebtNote]);
            getTotalDebtByCustomerId(selectedCustomerId)
                .then((data) => setTotalDebt(data || 0))
                .catch((error) => {
                    console.error("Failed to refresh total debt:", error);
                    setError("Không thể làm mới tổng nợ");
                });
        }
    };

    const handleViewDebtNote = (debtNote) => {
        if (debtNote) {
            setSelectedDebtNote(debtNote);
            setDetailDialogOpen(true);
        }
    };

    const formatTotalDebt = (totalDebt) => {
        if (totalDebt == null || totalDebt === 0) return "0";
        if (totalDebt < 0) {
            return (
                <span style={{ color: 'red', fontWeight: 'bold' }}>- {Math.abs(totalDebt)}</span>
            );
        } else {
            return (
                <span style={{ color: 'green', fontWeight: 'bold' }}>+ {totalDebt}</span>
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
    const nonZeroDebtCustomers = customers.filter(cust => cust.totalDebt !== 0 && cust.totalDebt !== null && cust.totalDebt !== undefined);
    const filteredCustomers = nonZeroDebtCustomers.filter(cust => {
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