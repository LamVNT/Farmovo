import React, { useContext, useEffect, useState } from 'react';
import { Card, Grid, Typography, Select, MenuItem, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MyContext } from '../../App';
import api from '../../services/axiosClient';
import { FaBoxOpen, FaExclamationTriangle, FaClock, FaExchangeAlt } from 'react-icons/fa';

const DashboardReport = () => {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    // Lấy role và danh sách kho từ context hoặc API
    if (context.user) {
      setRole(context.user.role);
      if (context.user.role === 'OWNER') {
        api.get('/stores').then(res => setStores(res.data));
      } else {
        setSelectedStore(context.user.storeId);
      }
    }
  }, [context.user]);

  const handleStoreChange = (e) => {
    setSelectedStore(e.target.value);
  };

  // Card cấu hình
  const reportCards = [
    {
      title: 'Tồn kho tổng hợp',
      icon: <FaBoxOpen size={28} color="#1976d2" />,
      link: '/reports/remain-summary',
      desc: 'Xem tồn kho tổng hợp theo danh mục, sản phẩm, zone.'
    },
    {
      title: 'Nhập xuất kho',
      icon: <FaExchangeAlt size={28} color="#388e3c" />,
      link: '/reports/inout-summary',
      desc: 'Theo dõi số lượng nhập, xuất, tồn cuối mỗi ngày.'
    },
    {
      title: 'Sản phẩm sai lệch',
      icon: <FaExclamationTriangle size={28} color="#fbc02d" />,
      link: '/reports/stocktake-diff',
      desc: 'Kiểm tra các sản phẩm có chênh lệch khi kiểm kho.'
    },
    {
      title: 'Lô sắp hết hạn',
      icon: <FaClock size={28} color="#d32f2f" />,
      link: '/reports/expiring-lots',
      desc: 'Danh sách lô sản phẩm sắp hết hạn sử dụng.'
    }
  ];

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={700} mb={2}>Báo cáo tổng hợp</Typography>
      <Typography variant="body1" mb={3} color="text.secondary">
        Chọn loại báo cáo bạn muốn xem hoặc lọc theo kho (nếu có quyền).
      </Typography>
      {role === 'OWNER' && (
        <Box mb={3}>
          <Typography variant="subtitle1" mb={1}>Chọn kho</Typography>
          <Select
            value={selectedStore}
            onChange={handleStoreChange}
            displayEmpty
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Tất cả kho</MenuItem>
            {stores.map(store => (
              <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
            ))}
          </Select>
        </Box>
      )}
      {role === 'STAFF' && (
        <Box mb={3}>
          <Typography variant="subtitle1">Kho: {context.user?.storeName || '---'}</Typography>
        </Box>
      )}
      <Grid container spacing={3}>
        {reportCards.map(card => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.title}>
            <Card sx={{ p: 3, cursor: 'pointer', height: '100%' }} onClick={() => navigate(card.link)}>
              <Box display="flex" alignItems="center" mb={2}>
                {card.icon}
                <Typography variant="h6" ml={2}>{card.title}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">{card.desc}</Typography>
              <Button variant="text" sx={{ mt: 2 }} onClick={() => navigate(card.link)}>
                Xem chi tiết
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardReport; 