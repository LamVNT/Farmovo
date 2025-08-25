import React, { useEffect, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem, TablePagination, InputAdornment, Chip } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axiosClient';
import { FaBoxes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthorizationContext';

const toCSV = (rows) => {
  const header = ['category', 'productName', 'zones', 'remain'];
  const body = rows.map(r => [r.category, r.productName, (r.zones || []).join('|'), r.remain]).map(a => a.join(','));
  return [header.join(','), ...body].join('\n');
};

const RemainSummaryReport = () => {
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('remainDesc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Lấy storeId nếu là Staff
  const userStoreId = user && isStaff() ? user.storeId : null;

  useEffect(() => {
    setLoading(true);
    // Không truyền storeId parameter, để backend tự động xử lý phân quyền
    api.get('/reports/remain-summary')
      .then(res => setRaw(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Group theo product: gộp nhiều zone thành một dòng, zones: [zoneName1, zoneName2,...], remain: tổng
  const groupedRows = useMemo(() => {
    const map = new Map(); // key: category+productName => {category, productName, zones:Set, remain}
    for (const cat of raw || []) {
      for (const prod of cat.products || []) {
        const key = `${cat.category}__${prod.productName}`;
        if (!map.has(key)) map.set(key, { category: cat.category, productName: prod.productName, zones: new Set(), remain: 0 });
        const entry = map.get(key);
        if (Array.isArray(prod.zones) && prod.zones.length > 0) {
          for (const z of prod.zones) {
            entry.zones.add(z.zoneName || '-');
            entry.remain += Number(z.totalRemain || 0);
          }
        } else {
          entry.zones.add('-');
          entry.remain += Number(prod.totalRemain || 0);
        }
      }
    }
    return Array.from(map.values()).map(r => ({ ...r, zones: Array.from(r.zones) }));
  }, [raw]);

  const categories = useMemo(() => [''].concat(Array.from(new Set((raw || []).map(c => c.category)))), [raw]);

  const filteredSorted = useMemo(() => {
    let rows = [...groupedRows];
    if (categoryFilter) rows = rows.filter(r => r.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.productName.toLowerCase().includes(q) || r.zones.join(',').toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'remainAsc': rows.sort((a,b) => (a.remain||0) - (b.remain||0)); break;
      case 'category': rows.sort((a,b) => a.category.localeCompare(b.category) || a.productName.localeCompare(b.productName)); break;
      case 'product': rows.sort((a,b) => a.productName.localeCompare(b.productName)); break;
      default: rows.sort((a,b) => (b.remain||0) - (a.remain||0));
    }
    return rows;
  }, [groupedRows, categoryFilter, search, sortBy]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSorted.slice(start, start + rowsPerPage);
  }, [filteredSorted, page, rowsPerPage]);

  const handleExport = () => {
    try {
      const csv = toCSV(filteredSorted);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'remain_summary.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) { alert('Xuất CSV thất bại'); }
  };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 5 }}>
      <Box sx={{ maxWidth: 1300, mx: 'auto', p: 4, background: '#fff', borderRadius: 3, boxShadow: 3 }}>
        <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Quay lại</Button>
        <Typography variant="h5" fontWeight={700} mb={1}>
          <FaBoxes style={{ marginRight: 8 }} /> Báo cáo tồn kho tổng hợp
          {isStaff() && user?.storeName && (
            <Typography component="span" variant="h6" color="primary.main" sx={{ ml: 2 }}>
              - Kho: {user.storeName}
            </Typography>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Theo dõi số lượng tồn kho theo danh mục, sản phẩm và khu vực.</Typography>

        {/* Controls */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Danh mục</InputLabel>
            <Select value={categoryFilter} label="Danh mục" onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}>
              {categories.map(c => (
                <MenuItem key={c || 'all'} value={c}>{c || 'Tất cả'}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sắp xếp</InputLabel>
            <Select value={sortBy} label="Sắp xếp" onChange={e => setSortBy(e.target.value)}>
              <MenuItem value="remainDesc">Tồn giảm dần</MenuItem>
              <MenuItem value="remainAsc">Tồn tăng dần</MenuItem>
              <MenuItem value="category">Theo danh mục</MenuItem>
              <MenuItem value="product">Theo sản phẩm</MenuItem>
            </Select>
          </FormControl>
          <TextField
            placeholder="Tìm theo danh mục / sản phẩm / khu vực"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            size="small"
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ minWidth: 320 }}
          />
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Xuất CSV</Button>
        </Stack>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 560 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ background: '#f5f5f5' }}>
                <TableCell><b>Danh mục</b></TableCell>
                <TableCell><b>Sản phẩm</b></TableCell>
                <TableCell><b>Khu vực (Zone)</b></TableCell>
                <TableCell align="right"><b>Số lượng tồn (tổng)</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Đang tải...</TableCell></TableRow>
              ) : pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Không có dữ liệu</TableCell>
                </TableRow>
              ) : (
                pagedRows.map((r, idx) => (
                  <TableRow key={`${r.category}-${r.productName}-${idx}`} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.productName}</TableCell>
                    <TableCell>
                      {r.zones.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      ) : (
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                          {r.zones.slice(0, 3).map((z, i) => (
                            <Chip key={`${z}-${i}`} size="small" label={z} sx={{ height: 20 }} />
                          ))}
                          {r.zones.length > 3 && (
                            <Chip size="small" label={`+${r.zones.length - 3}`} sx={{ height: 20 }} />
                          )}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{r.remain}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredSorted.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Box>
    </Box>
  );
};

export default RemainSummaryReport;
