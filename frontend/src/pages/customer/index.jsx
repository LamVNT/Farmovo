import React, { useEffect, useState } from "react";
import { customerService } from "../../services/customerService";
import useCustomers from "../../hooks/useCustomers";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Stack, Checkbox, FormControlLabel, Typography, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CustomerFormDialog from "../../components/customer/CustomerFormDialog";
import CustomerDetailDialog from "../../components/customer/CustomerDetailDialog";
import CustomerTable from "../../components/customer/CustomerTable";

const PAGE_SIZE = 10;

const CustomerManagementPage = () => {
  const {
    customers,
    page,
    size: rowsPerPage,
    totalPages,
    totalItems,
    setPage,
    setSize: setRowsPerPage,
    fetchCustomers,
    loading,
    error
  } = useCustomers();
  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formMode, setFormMode] = useState("add");
  const [search, setSearch] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDebt, setFilterDebt] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Fetch customers from server when filters/page change
  useEffect(() => {
    const filters = {
      name: search || undefined,
      phone: undefined,
      email: undefined,
    };
    if (filterSupplier !== "") filters.isSupplier = filterSupplier === "true";
    if (filterDebt) filters.debtOnly = true;

    fetchCustomers(filters);
  }, [search, filterSupplier, filterDebt, page, rowsPerPage, fetchCustomers]);

  // Tự động cập nhật khi thêm/sửa/xóa
  const handleFormClose = (refresh) => {
    setOpenForm(false);
    setSelectedCustomer(null);
    if (refresh) {
      // Reset to first page when adding new customer to show it at the top
      if (formMode === "add") {
        setPage(0);
      }
      fetchCustomers();
    }
  };
  const handleDetailClose = () => {
    setOpenDetail(false);
    setSelectedCustomer(null);
  };

  // Search, filter, pagination
  const pageCount = totalPages;
  const pagedCustomers = customers; // server already paged

  // reset to first page when filters/size change
  useEffect(() => { setPage(0); }, [search, filterSupplier, filterDebt, rowsPerPage]);

  const handleAdd = () => {
    setFormMode("add");
    setSelectedCustomer(null);
    setOpenForm(true);
  };
  const handleEdit = (customer) => {
    setFormMode("edit");
    setSelectedCustomer(customer);
    setOpenForm(true);
  };
  const handleDetail = (customer) => {
    setSelectedCustomer(customer);
    setOpenDetail(true);
  };
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await customerService.deleteCustomer(customerToDelete.id, 1); // TODO: deletedBy real
      fetchCustomers();
    } catch (err) {
      // handle error appropriately
    } finally {
      setConfirmOpen(false);
      setCustomerToDelete(null);
    }
  };
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  return (
    <Box p={3} bgcolor="#fff" borderRadius={2} boxShadow={1}>
      <Typography variant="h5" fontWeight={600} mb={2}>Quản lý khách hàng</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={2}>
        <TextField
          label="Tìm kiếm khách hàng"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Nhà cung cấp</InputLabel>
          <Select
            value={filterSupplier}
            label="Nhà cung cấp"
            onChange={e => setFilterSupplier(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="true">Nhà cung cấp</MenuItem>
            <MenuItem value="false">Khách mua</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Checkbox checked={filterDebt} onChange={e => setFilterDebt(e.target.checked)} />}
          label="Chỉ khách hàng còn nợ"
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Thêm khách hàng
        </Button>
      </Stack>
      <CustomerTable
        customers={pagedCustomers}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onDetail={handleDetail}
        page={page+1}
        pageCount={pageCount}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        totalCount={totalItems}
      />
      <CustomerFormDialog
        open={openForm}
        onClose={handleFormClose}
        mode={formMode}
        customer={selectedCustomer}
      />
      <CustomerDetailDialog
        open={openDetail}
        onClose={handleDetailClose}
        customer={selectedCustomer}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        content="Bạn có chắc muốn xóa khách hàng này?"
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </Box>
  );
};

export default CustomerManagementPage; 