import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, MenuItem, Checkbox, Button, Chip, Select, FormControl } from "@mui/material";
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import axios from '../../services/axiosClient';
import { getZones } from '../../services/zoneService';

const StocktakeLot = () => {
  const [importDetails, setImportDetails] = useState([]);
  const [zones, setZones] = useState([]);
  const [filters, setFilters] = useState({
    store: "",
    zone: "",
    product: "",
    importDate: "",
    isCheck: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Thêm state cho realQuantity
  const [realMap, setRealMap] = useState({}); // {id: realQuantity}
  const [isCheckMap, setIsCheckMap] = useState({}); // {id: isCheck}
  const realChangedRef = useRef(false);
  const [hiddenRows, setHiddenRows] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  // Đổi tên biến filter cho rõ nghĩa
  const [reviewStatus, setReviewStatus] = useState('all'); // 'need' | 'done' | 'all'
  const [isCheckFilter, setIsCheckFilter] = useState('all'); // 'all' | 'checked' | 'unchecked'

  // Lấy dữ liệu từ backend
  const fetchData = async (keepRealMap = false) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.store) params.store = filters.store;
      if (filters.zone) params.zone = filters.zone;
      if (filters.product) params.product = filters.product;
      if (filters.importDate) params.importDate = filters.importDate;
      if (filters.isCheck !== "") params.isCheck = filters.isCheck;
      const res = await axios.get('/import-details/stocktake-lot', { params });
      setImportDetails(res.data);
      // Khởi tạo realMap và isCheckMap
      if (!keepRealMap) {
        const newRealMap = {};
        const newIsCheckMap = {};
        res.data.forEach(row => {
          newRealMap[row.id] = row.realQuantity || "";
          newIsCheckMap[row.id] = row.isCheck;
        });
        setRealMap(newRealMap);
        setIsCheckMap(newIsCheckMap);
      } else {
        setRealMap(prev => {
          const newRealMap = { ...prev };
          res.data.forEach(row => {
            if (!(row.id in newRealMap)) newRealMap[row.id] = row.realQuantity || "";
          });
          return newRealMap;
        });
        setIsCheckMap(prev => {
          const newIsCheckMap = { ...prev };
          res.data.forEach(row => {
            if (!(row.id in newIsCheckMap)) newIsCheckMap[row.id] = row.isCheck;
          });
          return newIsCheckMap;
        });
      }
    } catch (e) {
      setError("Không lấy được dữ liệu kiểm kê lô!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    getZones().then(setZones);
    // eslint-disable-next-line
  }, [filters]);

  // Đổi trạng thái IsCheck
  const handleToggleIsCheck = async (row) => {
    try {
      await axios.patch(`/import-details/${row.id}/is-check`, null, { params: { isCheck: !row.isCheck } });
      fetchData(true); // Giữ lại realMap cũ
    } catch (e) {
      alert('Cập nhật trạng thái kiểm tra thất bại!');
    }
  };

  // Thay đổi số thực tế
  const handleRealChange = (id, value) => {
    setRealMap(prev => ({ ...prev, [id]: value }));
    realChangedRef.current = true;
  };

  // Thêm hàm cập nhật Remain
  const handleUpdateRemain = async (row) => {
    const real = realMap[row.id];
    if (real === "" || isNaN(Number(real))) {
      alert("Vui lòng nhập số lượng thực tế hợp lệ!");
      return;
    }
    try {
      await axios.patch(`/import-details/${row.id}/remain`, { remainQuantity: Number(real) });
      setRealMap(prev => ({ ...prev, [row.id]: "" })); // Reset real sau khi update
      realChangedRef.current = false;
      fetchData(true); // Luôn đồng bộ lại dữ liệu mới nhất từ backend
    } catch (e) {
      alert('Cập nhật số lượng thực tế thất bại!');
    }
  };

  // Ẩn dòng khi Complete
  const handleComplete = async (row) => {
    try {
      const real = realMap[row.id];
      // Cập nhật remainQuantity nếu real khác remainQuantity
      if (real !== "" && Number(real) !== row.remainQuantity) {
        await axios.patch(`/import-details/${row.id}/remain`, { remainQuantity: Number(real) });
      }
      // Cập nhật isCheck nếu khác
      if (isCheckMap[row.id] !== row.isCheck) {
        await axios.patch(`/import-details/${row.id}/is-check`, null, { params: { isCheck: isCheckMap[row.id] } });
      }
      // Ẩn dòng khỏi bảng (chỉ frontend)
      setHiddenRows(prev => [...prev, row.id]);
    } catch (e) {
      alert('Cập nhật thất bại!');
    }
  };

  // Đổi trạng thái IsCheck local
  const handleIsCheckChangeLocal = (row, value) => {
    setIsCheckMap(prev => ({ ...prev, [row.id]: value }));
  };

  // Lấy danh sách filter động từ dữ liệu hiện tại
  const unique = (arr, key) => [...new Set(arr.map(i => i[key]).filter(Boolean))];

  // Sửa filter trạng thái kiểm kê chỉ ăn theo thao tác ẩn/hiện dòng
  const filteredDetails = importDetails
    // Lọc theo IsCheck trước, dùng state local
    .filter(row => {
      const isCheck = isCheckMap[row.id] !== undefined ? isCheckMap[row.id] : row.isCheck;
      if (isCheckFilter === 'checked' && isCheck !== false) return false;
      if (isCheckFilter === 'unchecked' && isCheck !== true) return false;
      return true;
    })
    // Sau đó lọc theo trạng thái thao tác
    .filter(row => {
      if (reviewStatus === 'need' && hiddenRows.includes(row.id)) return false;
      if (reviewStatus === 'done' && !hiddenRows.includes(row.id)) return false;
      return true;
    })
    // Các filter khác (zone, product, ...)
    .filter(row => {
      if (filters.zone) {
        const selectedZoneId = Number(filters.zone);
        const zoneArr = Array.isArray(row.zonesId) ? row.zonesId.map(Number) : [];
        if (!zoneArr.includes(selectedZoneId)) return false;
      }
      return true;
    });

  // Cảnh báo khi rời trang nếu có real chưa update
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (realChangedRef.current && Object.values(realMap).some(v => v !== "")) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [realMap]);

  return (
    <Box sx={{ maxWidth: 1100, margin: '40px auto', background: '#fff', p: 4, borderRadius: 3, boxShadow: 2 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>Kiểm kê lô</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          select
          size="small"
          label="Kho"
          value={filters.store}
          onChange={e => setFilters(f => ({ ...f, store: e.target.value }))}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {unique(importDetails, 'storeName').map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField
          select
          size="small"
          label="Zone"
          value={filters.zone}
          onChange={e => setFilters(f => ({ ...f, zone: e.target.value }))}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.zoneName}</MenuItem>)}
        </TextField>
        <TextField
          select
          size="small"
          label="Sản phẩm"
          value={filters.product}
          onChange={e => setFilters(f => ({ ...f, product: e.target.value }))}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {unique(importDetails, 'productName').map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="Ngày nhập"
          value={filters.importDate}
          onChange={e => setFilters(f => ({ ...f, importDate: e.target.value }))}
          sx={{ minWidth: 150 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          select
          size="small"
          label="IsCheck"
          value={isCheckFilter}
          onChange={e => setIsCheckFilter(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="checked">Đã kiểm</MenuItem>
          <MenuItem value="unchecked">Chưa kiểm</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Trạng thái"
          value={reviewStatus}
          onChange={e => setReviewStatus(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="need">Update</MenuItem>
          <MenuItem value="done">Complete</MenuItem>
        </TextField>
      </Box>
      {loading ? (
        <Typography align="center" sx={{my: 4}}>Đang tải dữ liệu...</Typography>
      ) : error ? (
        <Typography color="error" align="center" sx={{my: 4}}>{error}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ background: '#f5f5f5' }}>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Sản phẩm</b></TableCell>
                <TableCell><b>Zone</b></TableCell>
                <TableCell><b>Kho</b></TableCell>
                <TableCell><b>Ngày nhập</b></TableCell>
                <TableCell><b>Remain</b></TableCell>
                <TableCell><b>Thực tế</b></TableCell>
                <TableCell><b>Chênh lệch</b></TableCell>
                <TableCell><b>IsCheck</b></TableCell>
                <TableCell><b>Thao tác</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">Không có lô hàng nào</TableCell>
                </TableRow>
              ) : (
                filteredDetails.map(row => {
                  const real = realMap[row.id] || "";
                  const diff = real !== "" && !isNaN(Number(real)) ? Number(real) - row.remainQuantity : "";
                  return (
                    <TableRow key={row.id} hover sx={row.remainQuantity === 0 ? { background: '#eaffea' } : {}}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell>{
                        row.zonesId && row.zonesId.length > 0
                          ? row.zonesId.map(zid => zones.find(z => z.id === zid)?.zoneName || zid).join(", ")
                          : ""
                      }</TableCell>
                      <TableCell>{row.storeName}</TableCell>
                      <TableCell>{row.importDate}</TableCell>
                      <TableCell>{row.remainQuantity}</TableCell>
                      <TableCell>
                        <input
                          type="number"
                          value={real}
                          min={0}
                          style={{ width: 70, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                          onChange={e => handleRealChange(row.id, e.target.value)}
                          disabled={row.remainQuantity === 0 && hiddenRows.includes(row.id)}
                        />
                      </TableCell>
                      <TableCell>{diff}</TableCell>
                      <TableCell>
                        <Chip
                          label={isCheckMap[row.id] ? "Chưa kiểm" : "Đã kiểm"}
                          color={isCheckMap[row.id] ? "default" : "success"}
                          size="small"
                          icon={isCheckMap[row.id] ? <RadioButtonUnchecked color="disabled" /> : <CheckCircle color="success" />}
                          sx={{ fontWeight: 600, cursor: 'pointer', minWidth: 90 }}
                          onClick={() => handleIsCheckChangeLocal(row, !isCheckMap[row.id])}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mr: 1, minWidth: 70 }}
                          onClick={() => handleUpdateRemain(row)}
                          disabled={hiddenRows.includes(row.id)}
                        >
                          Update
                        </Button>
                        {row.remainQuantity === 0 && isCheckMap[row.id] === false && !hiddenRows.includes(row.id) && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleComplete(row)}
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default StocktakeLot; 