import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    TextField,
    InputAdornment,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import DebtTable from "../../components/debt/DebtTable";
import AddDebtDialog from "../../components/debt/AddDebtDialog";
import EditDebtDialog from "../../components/debt/EditDebtDialog.jsx";
import { getDebtNotesByCustomerId, getTotalDebtByCustomerId } from "../../services/debtService";
import { getAllCustomers, getCustomerById } from "../../services/customerService";

const DebtManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [debtNotes, setDebtNotes] = useState([]);
    const [totalDebt, setTotalDebt] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
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

                    const debtNotesData = await getDebtNotesByCustomerId(selectedCustomerId);
                    setDebtNotes(debtNotesData || []);

                    try {
                        const totalDebtData = await getTotalDebtByCustomerId(selectedCustomerId);
                        setTotalDebt(totalDebtData || 0);
                    } catch (error) {
                        console.error("Failed to fetch total debt, continuing with other data:", error);
                        setTotalDebt(0);
                        setError("Không thể tải tổng nợ, nhưng dữ liệu khác vẫn được hiển thị");
                    }

                    // Tự động mở modal DebtTable sau khi load data
                    setDebtTableOpen(true);
                } catch (error) {
                    console.error("Failed to fetch customer data:", error);
                    setError("Không thể tải dữ liệu khách hàng: " + (error.response?.data?.message || error.message));
                }
            };
            fetchCustomerData();
        }
    }, [selectedCustomerId]);

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

    const handleEditDebtNote = (debtNote) => {
        if (debtNote) {
            setSelectedDebtNote(debtNote);
            setEditDialogOpen(true);
        }
    };

    const handleUpdateDebtNote = (updatedDebtNote) => {
        if (updatedDebtNote) {
            setDebtNotes(
                debtNotes.map((note) => (note.id === updatedDebtNote.id ? updatedDebtNote : note))
            );
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

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
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
            <TextField
                placeholder="Tìm kiếm tên, SĐT hoặc địa chỉ..."
                value={customerSearch}
                onChange={handleCustomerSearchChange}
                fullWidth
                margin="normal"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />
            <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tên</TableCell>
                            <TableCell>Số điện thoại</TableCell>
                            <TableCell>Địa chỉ</TableCell>
                            <TableCell>Tổng nợ</TableCell>
                            <TableCell>Hành động</TableCell>
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
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => setSelectedCustomerId(cust.id)}
                                            disabled={!cust.id}
                                        >
                                            Xem chi tiết
                                        </Button>
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
            </TableContainer>

            {/* Chi tiết khách hàng và giao dịch nợ */}
            {customer && selectedCustomerId && (
                <DebtTable
                    open={debtTableOpen}
                    onClose={() => setDebtTableOpen(false)}
                    debtNotes={debtNotes}
                    onEdit={handleEditDebtNote}
                    customer={customer}
                    totalDebt={totalDebt}
                    onAddDebt={() => setAddDialogOpen(true)}
                    addDialogOpen={addDialogOpen}
                    onAddDialogClose={() => setAddDialogOpen(false)}
                    onAddDebtNote={handleAddDebtNote}
                />
            )}
            <EditDebtDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                debtNote={selectedDebtNote}
                customerId={selectedCustomerId}
                onUpdate={handleUpdateDebtNote}
            />
        </Container>
    );
};

export default DebtManagement;