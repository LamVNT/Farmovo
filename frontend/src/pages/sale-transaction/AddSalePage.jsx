import React, {useEffect, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {FaPlus, FaTrash} from "react-icons/fa";
import saleTransactionService from "../../services/saleTransactionService";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";

const AddSalePage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        customerId: "",
        storeId: "",
        totalAmount: 0,
        paidAmount: 0,
        saleTransactionNote: "",
        status: "DRAFT",
        saleDate: new Date(),
        detail: []
    });

    const [createFormData, setCreateFormData] = useState({
        customers: [],
        stores: [],
        products: []
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingFormData, setLoadingFormData] = useState(true);
    const [error, setError] = useState(null);
    const [searchProduct, setSearchProduct] = useState("");

    // Lọc sản phẩm theo search và chỉ hiển thị những sản phẩm có remainQuantity > 0
    const filteredProducts = createFormData.products?.filter(product => {
        const matchesSearch = product.productName?.toLowerCase().includes(searchProduct.toLowerCase()) ||
            product.productCode?.toLowerCase().includes(searchProduct.toLowerCase());
        const hasStock = product.remainQuantity > 0;
        return matchesSearch && hasStock;
    }) || [];

    // Lọc để chỉ hiển thị các sản phẩm duy nhất (không trùng lặp proId)
    const uniqueProducts = filteredProducts.reduce((acc, product) => {
        const existingProduct = acc.find(p => p.proId === product.proId);
        if (!existingProduct) {
            acc.push(product);
        }
        return acc;
    }, []);

    useEffect(() => {
        loadCreateFormData();
    }, []);

    // Debug logging khi createFormData thay đổi
    useEffect(() => {
        console.log("=== DEBUG CREATE FORM DATA CHANGED ===");
        console.log("createFormData:", createFormData);
        console.log("Customers:", createFormData.customers);
        console.log("Stores:", createFormData.stores);
        console.log("Products:", createFormData.products);
        console.log("Filtered Products:", filteredProducts);
        console.log("Unique Products:", uniqueProducts);
    }, [createFormData, filteredProducts, uniqueProducts]);

    const loadCreateFormData = async () => {
        setLoadingFormData(true);
        try {
            const data = await saleTransactionService.getCreateFormData();
            console.log("=== DEBUG FRONTEND CREATE FORM DATA ===");
            console.log("Full data:", data);
            console.log("Customers:", data.customers);
            console.log("Stores:", data.stores);
            console.log("Products:", data.products);
            setCreateFormData(data);
        } catch (err) {
            console.error("Error loading form data:", err);
            setError("Không thể tải dữ liệu form");
        } finally {
            setLoadingFormData(false);
        }
    };

    const handleAddProduct = () => {
        if (!selectedBatch || quantity <= 0) return;

        // Kiểm tra số lượng tồn kho
        if (quantity > selectedBatch.remainQuantity) {
            setError(`Số lượng vượt quá tồn kho. Còn lại: ${selectedBatch.remainQuantity}`);
            return;
        }

        const existingIndex = formData.detail.findIndex(item => item.id === selectedBatch.id);
        if (existingIndex >= 0) {
            const updatedDetail = [...formData.detail];
            const newQuantity = updatedDetail[existingIndex].quantity + quantity;

            // Kiểm tra tổng số lượng không vượt quá tồn kho
            if (newQuantity > selectedBatch.remainQuantity) {
                setError(`Tổng số lượng vượt quá tồn kho. Còn lại: ${selectedBatch.remainQuantity}`);
                return;
            }

            updatedDetail[existingIndex].quantity = newQuantity;
            setFormData({...formData, detail: updatedDetail});
        } else {
            const newItem = {
                ...selectedBatch,
                quantity: quantity
            };
            setFormData({
                ...formData,
                detail: [...formData.detail, newItem]
            });
        }

        setSelectedBatch(null);
        setQuantity(1);
        setError(null);
    };

    const handleRemoveProduct = (index) => {
        const updatedDetail = formData.detail.filter((_, i) => i !== index);
        setFormData({...formData, detail: updatedDetail});
    };

    const calculateTotal = () => {
        return formData.detail.reduce((total, item) => {
            return total + (item.unitSalePrice * item.quantity);
        }, 0);
    };

    const handleSubmit = async () => {
        if (formData.detail.length === 0) {
            setError("Vui lòng thêm ít nhất một sản phẩm");
            return;
        }

        if (!formData.customerId) {
            setError("Vui lòng chọn khách hàng");
            return;
        }

        if (!formData.storeId) {
            setError("Vui lòng chọn cửa hàng");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const submitData = {
                ...formData,
                totalAmount: calculateTotal()
            };
            await saleTransactionService.create(submitData);
            navigate("/sale");
        } catch (err) {
            setError("Không thể tạo phiếu bán hàng");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Typography variant="h4" className="font-bold text-gray-800 mb-2">
                        Tạo phiếu bán hàng
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Tạo phiếu bán hàng mới với thông tin khách hàng và sản phẩm
                    </Typography>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                    <Button
                        variant="outlined"
                        onClick={loadCreateFormData}
                        disabled={loadingFormData}
                        startIcon={loadingFormData ? <CircularProgress size={16}/> : null}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                        {loadingFormData ? "Đang tải..." : "Tải lại dữ liệu"}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={async () => {
                            try {
                                const response = await fetch(`${import.meta.env.VITE_API_URL}/sale-transactions/test-data`);
                                const text = await response.text();
                                console.log('Test API response:', text);
                                alert('Test API response: ' + text);
                            } catch (error) {
                                console.error('Test API error:', error);
                                alert('Test API error: ' + error.message);
                            }
                        }}
                        className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                        Test API
                    </Button>
                </div>

                {/* Status Alerts */}
                {error && (
                    <Alert severity="error" className="mb-6 shadow-sm">
                        <Typography variant="body2" className="font-medium">
                            {error}
                        </Typography>
                    </Alert>
                )}

                {!loadingFormData && !error && (
                    <Alert severity="success" className="mb-6 shadow-sm">
                        <Typography variant="body2" className="font-medium">
                            ✅ Đã tải: {createFormData.customers?.length || 0} khách
                            hàng, {createFormData.stores?.length || 0} cửa
                            hàng, {createFormData.products?.length || 0} sản phẩm
                        </Typography>
                    </Alert>
                )}

                {/* Main Content - Three Columns */}
                <Grid container spacing={4} alignItems="flex-start">
                    {/* Left Column - Basic Information */}
                    <Grid item xs={12} md={4}>
                        <Card className="shadow-lg border-0 bg-white">
                            <CardContent className="p-4">
                                <div className="flex items-center mb-4">
                                    <div
                                        className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                        <span className="text-blue-600 font-bold text-sm">ℹ️</span>
                                    </div>
                                    <Typography variant="h6" className="font-bold text-gray-800 text-sm">
                                        Thông tin cơ bản
                                    </Typography>
                                </div>
                                <div className="space-y-3 pl-2">
                                    <FormControl variant="standard" size="small" style={{width: '80%'}}>
                                        <InputLabel className="text-gray-600 text-sm">Khách hàng</InputLabel>
                                        <Select
                                            value={formData.customerId || ""}
                                            onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                                            disabled={loadingFormData}
                                        >
                                            {loadingFormData ? (
                                                <MenuItem disabled>Đang tải...</MenuItem>
                                            ) : createFormData.customers?.length > 0 ? (
                                                createFormData.customers.map((customer) => (
                                                    <MenuItem key={customer.id} value={customer.id}>
                                                        {customer.name || customer.customerName || 'Không có tên'}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled>Không có dữ liệu khách hàng</MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" size="small" style={{width: '80%'}}>
                                        <InputLabel className="text-gray-600 text-sm">Cửa hàng</InputLabel>
                                        <Select
                                            value={formData.storeId || ""}
                                            onChange={(e) => setFormData({...formData, storeId: e.target.value})}
                                            disabled={loadingFormData}
                                        >
                                            {loadingFormData ? (
                                                <MenuItem disabled>Đang tải...</MenuItem>
                                            ) : createFormData.stores?.length > 0 ? (
                                                createFormData.stores.map((store) => (
                                                    <MenuItem key={store.id} value={store.id}>
                                                        {store.name || store.storeName || 'Không có tên'}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled>Không có dữ liệu cửa hàng</MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" size="small" style={{width: '80%'}}>
                                        <InputLabel className="text-gray-600 text-sm">Trạng thái</InputLabel>
                                        <Select
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        >
                                            <MenuItem value="DRAFT">📝 Nháp</MenuItem>
                                            <MenuItem value="COMPLETE">✅ Hoàn thành</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Box display="flex" gap={2} alignItems="flex-end" mt={2}>
                                        <TextField
                                            label="Ghi chú"
                                            multiline
                                            rows={2}
                                            value={formData.saleTransactionNote}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                saleTransactionNote: e.target.value
                                            })}
                                            variant="standard"
                                            size="small"
                                            style={{width: '48%'}}
                                        />
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DateTimePicker
                                                label="Thời gian bán"
                                                value={formData.saleDate}
                                                onChange={(newValue) => setFormData({...formData, saleDate: newValue})}
                                                renderInput={(params) => (
                                                    <TextField {...params} variant="standard" size="small"
                                                               style={{width: '48%'}}/>
                                                )}
                                            />
                                        </LocalizationProvider>
                                    </Box>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Middle Column - Add Products */}
                    <Grid item xs={12} md={4}>
                        <Card className="shadow-lg border-0 bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center mb-6">
                                    <div
                                        className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-green-600 font-bold text-lg">🛍️</span>
                                    </div>
                                    <Typography variant="h6" className="font-bold text-gray-800">
                                        Thêm sản phẩm
                                    </Typography>
                                </div>
                                {/* Thêm sản phẩm - 2 hàng */}
                                <Box>
                                    <Box display="flex" gap={2} alignItems="flex-end" mb={2}>
                                        <FormControl variant="standard" size="small"
                                                     style={{minWidth: 120, flex: '1 1 140px'}}>
                                            <InputLabel className="text-gray-600">Chọn sản phẩm</InputLabel>
                                            <Select
                                                value={selectedProduct?.proId || ""}
                                                onChange={async (e) => {
                                                    const product = uniqueProducts.find(p => p.proId === e.target.value);
                                                    setSelectedProduct(product);
                                                    setSelectedBatch(null);
                                                    if (product) {
                                                        const batches = await saleTransactionService.getBatchesByProductId(product.proId);
                                                        setAvailableBatches(batches);
                                                    } else {
                                                        setAvailableBatches([]);
                                                    }
                                                }}
                                                disabled={loadingFormData}
                                            >
                                                {loadingFormData ? (
                                                    <MenuItem disabled>Đang tải...</MenuItem>
                                                ) : uniqueProducts.length > 0 ? (
                                                    uniqueProducts.map((product) => (
                                                        <MenuItem key={product.proId} value={product.proId}>
                                                            <div className="flex flex-col">
                                                                <span
                                                                    className="font-medium text-gray-800">{product.productName || 'Không có tên'}</span>
                                                                <span className="text-sm text-gray-500">
                                                                    Mã: {product.productCode || product.proId}
                                                                </span>
                                                            </div>
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem disabled>
                                                        {searchProduct ? 'Không tìm thấy sản phẩm phù hợp' : 'Không có sản phẩm có sẵn'}
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>

                                        <FormControl variant="standard" size="small"
                                                     style={{minWidth: 120, flex: '1 1 140px'}}>
                                            <InputLabel className="text-gray-600">Chọn batch</InputLabel>
                                            <Select
                                                value={selectedBatch?.id || ""}
                                                onChange={(e) => {
                                                    const batch = availableBatches.find(b => b.id === e.target.value);
                                                    setSelectedBatch(batch);
                                                }}
                                                disabled={!selectedProduct}
                                            >
                                                {!selectedProduct ? (
                                                    <MenuItem disabled>Vui lòng chọn sản phẩm trước</MenuItem>
                                                ) : availableBatches.length > 0 ? (
                                                    availableBatches.map((batch) => (
                                                        <MenuItem key={batch.id} value={batch.id}>
                                                            <div className="flex flex-col">
                                                                <span
                                                                    className="font-medium text-gray-800">Batch ID: {batch.id}</span>
                                                                <span className="text-sm text-gray-500">
                                                                    📦 Tồn: {batch.remainQuantity || 0} | 
                                                                    💰 Giá: {(batch.unitSalePrice || 0)?.toLocaleString('vi-VN')} VNĐ |
                                                                    📅 HSD: {batch.expireDate ? new Date(batch.expireDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem disabled>Không có batch nào cho sản phẩm này</MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <Box display="flex" gap={2} alignItems="flex-end">
                                        <TextField
                                            type="number"
                                            label="Số lượng"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                            inputProps={{min: 1}}
                                            variant="standard"
                                            size="small"
                                            style={{minWidth: 80, flex: '0 1 80px'}}
                                        />

                                        <Button
                                            variant="contained"
                                            startIcon={<FaPlus/>}
                                            onClick={handleAddProduct}
                                            disabled={!selectedBatch || quantity <= 0}
                                            style={{minWidth: 120, flex: '0 1 120px', height: 40}}
                                            className="bg-blue-600 hover:bg-blue-700 shadow-md"
                                        >
                                            Thêm
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Column - Batch Info */}
                    <Grid item xs={12} md={2}>
                        {selectedBatch && (
                            <Box
                                minWidth={220}
                                maxWidth={300}
                                flex="0 0 auto"
                                sx={{
                                    background: '#e3f0ff',
                                    borderRadius: 2,
                                    border: '1px solid #b6d4fe',
                                    p: 2,
                                    ml: 2,
                                }}
                            >
                                <Typography variant="subtitle2" className="font-bold text-blue-800 mb-2">
                                    Thông tin batch đã chọn:
                                </Typography>
                                <div className="space-y-1 text-sm text-blue-700">
                                    <div>📦 Tồn kho: {selectedBatch.remainQuantity || 0}</div>
                                    <div>💰 Giá bán: {(selectedBatch.unitSalePrice || 0)?.toLocaleString('vi-VN')} VNĐ
                                    </div>
                                    <div>📅 Ngày
                                        nhập: {selectedBatch.createAt ? new Date(selectedBatch.createAt).toLocaleDateString('vi-VN') : 'N/A'}</div>
                                    {selectedBatch.remainQuantity < quantity && (
                                        <div className="text-red-600 font-medium">
                                            ⚠️ Số lượng vượt quá tồn kho!
                                        </div>
                                    )}
                                </div>
                            </Box>
                        )}
                    </Grid>
                </Grid>

                {/* Selected Products Section - Full Width Below */}
                {formData.detail.length > 0 && (
                    <Card className="shadow-lg border-0 bg-white mt-6">
                        <CardContent className="p-6">
                            <div className="flex items-center mb-6">
                                <div
                                    className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-purple-600 font-bold text-lg">📋</span>
                                </div>
                                <Typography variant="h6" className="font-bold text-gray-800">
                                    Sản phẩm đã chọn ({formData.detail.length})
                                </Typography>
                            </div>

                            <div className="overflow-x-auto">
                                <Table className="bg-gray-50 rounded-lg">
                                    <TableHead>
                                        <TableRow className="bg-gray-100">
                                            <TableCell className="font-bold text-gray-700">Sản phẩm</TableCell>
                                            <TableCell align="center" className="font-bold text-gray-700">Số
                                                lượng</TableCell>
                                            <TableCell align="right" className="font-bold text-gray-700">Đơn
                                                giá</TableCell>
                                            <TableCell align="right" className="font-bold text-gray-700">Thành
                                                tiền</TableCell>
                                            <TableCell align="center" className="font-bold text-gray-700">Hành
                                                động</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.detail.map((item, index) => (
                                            <TableRow key={index} className="hover:bg-gray-100 transition-colors">
                                                <TableCell>
                                                    <div>
                                                        <div
                                                            className="font-medium text-gray-800">{item.productName}</div>
                                                        <div className="text-sm text-gray-500">
                                                            Mã: {item.productCode} | Batch: {item.id}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={item.quantity}
                                                        color="primary"
                                                        size="small"
                                                        className="bg-blue-500"
                                                    />
                                                </TableCell>
                                                <TableCell align="right" className="font-medium">
                                                    {item.unitSalePrice?.toLocaleString('vi-VN')} VNĐ
                                                </TableCell>
                                                <TableCell align="right">
                                                    <strong className="text-green-600">
                                                        {(item.unitSalePrice * item.quantity)?.toLocaleString('vi-VN')} VNĐ
                                                    </strong>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleRemoveProduct(index)}
                                                        size="small"
                                                        className="hover:bg-red-50"
                                                    >
                                                        <FaTrash/>
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Total Amount */}
                            <Box
                                className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                                <div className="flex justify-between items-center">
                                    <Typography variant="h6" className="font-bold text-gray-700">
                                        Tổng tiền:
                                    </Typography>
                                    <Typography variant="h4" className="font-bold text-green-600">
                                        {calculateTotal().toLocaleString('vi-VN')} VNĐ
                                    </Typography>
                                </div>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-8">
                    <Button
                        variant="outlined"
                        onClick={() => navigate("/sale")}
                        size="large"
                        className="border-gray-400 text-gray-600 hover:bg-gray-50 px-8"
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || formData.detail.length === 0 || !formData.customerId || !formData.storeId}
                        startIcon={loading ? <CircularProgress size={20}/> : null}
                        size="large"
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8"
                        style={{minWidth: 200}}
                    >
                        {loading ? "Đang lưu..." : "Lưu phiếu bán hàng"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddSalePage; 