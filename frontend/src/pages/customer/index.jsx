import React, { useEffect, useState, useMemo } from "react";
import { getAllCustomers, customerService } from "../../services/customerService";
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Stack, Checkbox, FormControlLabel, Typography, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CustomerFormDialog from "../../components/customer/CustomerFormDialog";
import CustomerDetailDialog from "../../components/customer/CustomerDetailDialog";
import CustomerTable from "../../components/customer/CustomerTable";

const PAGE_SIZE = 10;

const CustomerManagementPage = () => {
  const [customers, setCustomers] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formMode, setFormMode] = useState("add");
  const [search, setSearch] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDebt, setFilterDebt] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE);

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      const data = await getAllCustomers(); // Đã trả về CustomerDto mới
      setCustomers(data);
    } catch (err) {
      // handle error
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Tự động cập nhật khi thêm/sửa/xóa
  const handleFormClose = (refresh) => {
    setOpenForm(false);
    setSelectedCustomer(null);
    if (refresh) fetchCustomers();
  };
  const handleDetailClose = () => {
    setOpenDetail(false);
    setSelectedCustomer(null);
  };

  // Search, filter, pagination
  const filteredCustomers = useMemo(() => {
    let data = customers;
    if (search) {
      data = data.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterSupplier !== "") {
      data = data.filter(c => c.isSupplier === (filterSupplier === "true"));
    }
    if (filterDebt) {
      data = data.filter(c => c.totalDebt > 0);
    }
    return data;
  }, [customers, search, filterSupplier, filterDebt]);

  const pageCount = Math.ceil(filteredCustomers.length / rowsPerPage);
  const pagedCustomers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  // Reset page về 1 khi filter/search thay đổi
  useEffect(() => { setPage(1); }, [search, filterSupplier, filterDebt, rowsPerPage]);

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
  const handleDelete = async (customer) => {
    if (window.confirm("Bạn có chắc muốn xóa khách hàng này?")) {
      try {
        await customerService.deleteCustomer(customer.id, 1); // TODO: lấy deletedBy thực tế
        fetchCustomers();
      } catch (err) {
        // handle error
      }
    }
  };
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
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
            <MenuItem value="true">Có</MenuItem>
            <MenuItem value="false">Không</MenuItem>
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
        onDelete={handleDelete}
        onDetail={handleDetail}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        totalCount={filteredCustomers.length}
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
    </Box>
  );
};

export default CustomerManagementPage; 