import React, {useEffect, useState} from "react";
import {
    Box,
    Button,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import DebtTable from "../../components/debt/DebtTable";
import AddDebtDialog from "../../components/debt/AddDebtDialog";
import EditDebtDialog from "../../components/debt/EditDebtDialog.jsx";
import {getDebtNotesByCustomerId, getTotalDebtByCustomerId} from "../../services/debtService";
import {getAllCustomers, getCustomerById} from "../../services/customerService";

const DebtManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [debtNotes, setDebtNotes] = useState([]);
    const [totalDebt, setTotalDebt] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedDebtNote, setSelectedDebtNote] = useState(null);
    const [error, setError] = useState("");

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
        return totalDebt < 0
            ? `Khách hàng nợ: ${Math.abs(totalDebt)}`
            : `Cửa hàng nợ: ${totalDebt}`;
    };

    return (
        <Container maxWidth="lg" sx={{mt: 4}}>
            <Typography variant="h4" gutterBottom>
                Quản lý nợ
            </Typography>
            {error && (
                <Typography color="error" sx={{mb: 2}}>
                    {error}
                </Typography>
            )}

            {/* Bảng danh sách khách hàng */}
            <Typography variant="h6" gutterBottom>
                Danh sách khách hàng
            </Typography>
            <TableContainer component={Paper} sx={{mb: 4}}>
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
                        {customers && customers.length > 0 ? (
                            customers.map((cust) => (
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
            </TableContainer>

            {/* Chi tiết khách hàng và giao dịch nợ */}
            {customer && selectedCustomerId && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Khách hàng: {customer.name || "N/A"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Tổng nợ: {formatTotalDebt(totalDebt)}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setAddDialogOpen(true)}
                        sx={{mb: 2}}
                    >
                        Thêm giao dịch nợ
                    </Button>
                    <DebtTable debtNotes={debtNotes} onEdit={handleEditDebtNote}/>
                    <AddDebtDialog
                        open={addDialogOpen}
                        onClose={() => setAddDialogOpen(false)}
                        customerId={selectedCustomerId}
                        onAdd={handleAddDebtNote}
                    />
                    <EditDebtDialog
                        open={editDialogOpen}
                        onClose={() => setEditDialogOpen(false)}
                        debtNote={selectedDebtNote}
                        customerId={selectedCustomerId}
                        onUpdate={handleUpdateDebtNote}
                    />
                </Box>
            )}
        </Container>
    );
};

export default DebtManagement;