import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Chip,
    IconButton,
    Collapse
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { vi } from 'date-fns/locale';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { listAllDebtNotes } from "../../services/debtService";
import { getAllCustomers } from "../../services/customerService";
import { getAllStores } from "../../services/storeService";

const DebtNoteSearchDialog = ({ open, onClose, onSearch }) => {
    const [searchForm, setSearchForm] = useState({
        customerId: null,
        storeId: null,
        debtType: "",
        fromSource: "",
        sourceId: "",
        debtDescription: "",
        minDebtAmount: "",
        maxDebtAmount: "",
        fromDate: null,
        toDate: null,
        customerName: "",
        storeName: "",
        createdBy: "",
        hasEvidence: null,
        evidence: "",
        page: 0,
        size: 10,
        sortBy: "debtDate",
        sortDirection: "desc"
    });

    const [customers, setCustomers] = useState([]);
    const [stores, setStores] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchCustomers();
            fetchStores();
        }
    }, [open]);

    const fetchCustomers = async () => {
        try {
            const response = await getAllCustomers();
            setCustomers(response);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await getAllStores();
            setStores(response);
        } catch (error) {
            console.error("Error fetching stores:", error);
        }
    };

    const handleChange = (field, value) => {
        setSearchForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            // Clean up form data
            const cleanForm = { ...searchForm };
            
            // Remove empty strings and convert to proper types
            Object.keys(cleanForm).forEach(key => {
                if (cleanForm[key] === "") {
                    delete cleanForm[key];
                }
            });

            // Convert amounts to numbers if they exist
            if (cleanForm.minDebtAmount) {
                cleanForm.minDebtAmount = parseFloat(cleanForm.minDebtAmount);
            }
            if (cleanForm.maxDebtAmount) {
                cleanForm.maxDebtAmount = parseFloat(cleanForm.maxDebtAmount);
            }

            // Convert IDs to numbers if they exist
            if (cleanForm.customerId) {
                cleanForm.customerId = parseInt(cleanForm.customerId);
            }
            if (cleanForm.storeId) {
                cleanForm.storeId = parseInt(cleanForm.storeId);
            }
            if (cleanForm.sourceId) {
                cleanForm.sourceId = parseInt(cleanForm.sourceId);
            }
            if (cleanForm.createdBy) {
                cleanForm.createdBy = parseInt(cleanForm.createdBy);
            }

            const result = await listAllDebtNotes(cleanForm);
            onSearch(result);
            onClose();
        } catch (error) {
            console.error("Error searching debt notes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setSearchForm({
            customerId: null,
            storeId: null,
            debtType: "",
            fromSource: "",
            sourceId: "",
            debtDescription: "",
            minDebtAmount: "",
            maxDebtAmount: "",
            fromDate: null,
            toDate: null,
            customerName: "",
            storeName: "",
            createdBy: "",
            hasEvidence: null,
            evidence: "",
            page: 0,
            size: 10,
            sortBy: "debtDate",
            sortDirection: "desc"
        });
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        Object.keys(searchForm).forEach(key => {
            if (searchForm[key] !== null && searchForm[key] !== "" && 
                !['page', 'size', 'sortBy', 'sortDirection'].includes(key)) {
                count++;
            }
        });
        return count;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">Tìm kiếm giao dịch nợ</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        {getActiveFiltersCount() > 0 && (
                            <Chip 
                                label={`${getActiveFiltersCount()} bộ lọc`} 
                                color="primary" 
                                size="small" 
                            />
                        )}
                        <IconButton onClick={() => setShowAdvanced(!showAdvanced)}>
                            {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Basic Search */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Mô tả nợ"
                            value={searchForm.debtDescription}
                            onChange={(e) => handleChange("debtDescription", e.target.value)}
                            placeholder="Tìm theo mô tả..."
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Loại nợ</InputLabel>
                            <Select
                                value={searchForm.debtType}
                                onChange={(e) => handleChange("debtType", e.target.value)}
                                label="Loại nợ"
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                <MenuItem value="+">Cửa hàng nợ (+)</MenuItem>
                                <MenuItem value="-">Khách hàng nợ (-)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Nguồn</InputLabel>
                            <Select
                                value={searchForm.fromSource}
                                onChange={(e) => handleChange("fromSource", e.target.value)}
                                label="Nguồn"
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                <MenuItem value="SALE">Bán hàng</MenuItem>
                                <MenuItem value="PURCHASE">Nhập hàng</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="ID nguồn"
                            value={searchForm.sourceId}
                            onChange={(e) => handleChange("sourceId", e.target.value)}
                            placeholder="ID giao dịch..."
                        />
                    </Grid>

                    {/* Advanced Search */}
                    <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 2, mt: 2 }}>
                                Tìm kiếm nâng cao
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Khách hàng</InputLabel>
                                <Select
                                    value={searchForm.customerId || ""}
                                    onChange={(e) => handleChange("customerId", e.target.value)}
                                    label="Khách hàng"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {customers.map((customer) => (
                                        <MenuItem key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Cửa hàng</InputLabel>
                                <Select
                                    value={searchForm.storeId || ""}
                                    onChange={(e) => handleChange("storeId", e.target.value)}
                                    label="Cửa hàng"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {stores.map((store) => (
                                        <MenuItem key={store.id} value={store.id}>
                                            {store.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Tên khách hàng"
                                value={searchForm.customerName}
                                onChange={(e) => handleChange("customerName", e.target.value)}
                                placeholder="Tìm theo tên khách hàng..."
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Tên cửa hàng"
                                value={searchForm.storeName}
                                onChange={(e) => handleChange("storeName", e.target.value)}
                                placeholder="Tìm theo tên cửa hàng..."
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Số tiền tối thiểu"
                                type="number"
                                value={searchForm.minDebtAmount}
                                onChange={(e) => handleChange("minDebtAmount", e.target.value)}
                                placeholder="0"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Số tiền tối đa"
                                type="number"
                                value={searchForm.maxDebtAmount}
                                onChange={(e) => handleChange("maxDebtAmount", e.target.value)}
                                placeholder="0"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                                <DateTimePicker
                                    label="Từ ngày"
                                    value={searchForm.fromDate}
                                    onChange={(newValue) => handleChange("fromDate", newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                                <DateTimePicker
                                    label="Đến ngày"
                                    value={searchForm.toDate}
                                    onChange={(newValue) => handleChange("toDate", newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Có bằng chứng</InputLabel>
                                <Select
                                    value={searchForm.hasEvidence === null ? "" : searchForm.hasEvidence}
                                    onChange={(e) => handleChange("hasEvidence", e.target.value === "" ? null : e.target.value)}
                                    label="Có bằng chứng"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value={true}>Có</MenuItem>
                                    <MenuItem value={false}>Không</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Bằng chứng"
                                value={searchForm.evidence}
                                onChange={(e) => handleChange("evidence", e.target.value)}
                                placeholder="Tìm theo bằng chứng..."
                            />
                        </Grid>
                    </Collapse>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={handleClear} 
                    startIcon={<ClearIcon />}
                    color="secondary"
                >
                    Xóa bộ lọc
                </Button>
                <Button onClick={onClose}>Hủy</Button>
                <Button 
                    onClick={handleSearch} 
                    variant="contained" 
                    startIcon={<SearchIcon />}
                    disabled={loading}
                >
                    {loading ? "Đang tìm..." : "Tìm kiếm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DebtNoteSearchDialog; 