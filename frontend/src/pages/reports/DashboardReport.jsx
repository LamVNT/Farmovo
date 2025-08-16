import React, { useContext, useEffect, useState } from 'react';
import { Card, Grid, Typography, Select, MenuItem, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MyContext } from '../../App';
import api from '../../services/axiosClient';
import { FaChartLine, FaBoxes } from 'react-icons/fa';

const DashboardReport = () => {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
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

  const BigCard = ({ title, icon, desc, onClick, color }) => (
    <Card
      sx={{
        p: 5,
        height: '100%',
        cursor: 'pointer',
        border: `2px solid ${color}`,
        borderRadius: 4,
        boxShadow: 3,
        transition: 'all 0.25s',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: 6,
          backgroundColor: `${color}10`,
        },
      }}
      onClick={onClick}
    >
      <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" textAlign="center">
        <Box mb={2}>{icon}</Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{desc}</Typography>
      </Box>
    </Card>
  );

  return (
    <Box p={3} sx={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={4} textAlign="center">
        <Typography variant="h4" fontWeight={700} color="primary.main">Báo cáo</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Tổng quan báo cáo tài chính và tồn kho theo từng kho
        </Typography>
      </Box>

      {/* Store filter */}
      {role === 'OWNER' && (
        <Box mb={4} textAlign="center">
          <Typography variant="subtitle1" mb={1}>Chọn kho</Typography>
          <Select
            value={selectedStore}
            onChange={handleStoreChange}
            displayEmpty
            sx={{ minWidth: 240, backgroundColor: 'white', borderRadius: 2 }}
          >
            <MenuItem value="">Tất cả kho</MenuItem>
            {stores.map(store => (
              <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
            ))}
          </Select>
        </Box>
      )}

      {/* Cards */}
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} sm={6} md={4}>
          <BigCard
            title="Tài chính"
            desc="Theo dõi doanh thu, thu chi theo ngày/ca"
            icon={<FaChartLine size={64} color="#1976d2" />}
            color="#1976d2"
            onClick={() => navigate('/reports/financial')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <BigCard
            title="Tồn kho"
            desc="Kiểm tra tồn kho và sản phẩm sắp hết hạn"
            icon={<FaBoxes size={64} color="#388e3c" />}
            color="#388e3c"
            onClick={() => navigate('/reports/inventory')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardReport;
