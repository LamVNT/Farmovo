import { useEffect, useState } from "react";
import api from "../services/axiosClient";

// Dữ liệu mock cho trường hợp không lấy được từ API
const MOCK_DATA = {
  totalProducts: 120,
  totalCustomers: 80,
  totalSuppliers: 10,
  totalImportOrders: 50,
  totalExportOrders: 45,
  totalRevenue: 50000000,
  expiringLots: 5,
};

/**
 * Custom hook để lấy dữ liệu tổng quan cho Dashboard.
 * Nếu API không phản hồi, sẽ sử dụng dữ liệu mẫu.
 */
export default function useDashboardSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get("/dashboard/summary") // Gọi API để lấy dữ liệu tổng quan
      .then(res => {
        if (!cancelled) setSummary(res.data); // Cập nhật state nếu request không bị hủy
      })
      .catch(() => {
        // Nếu lỗi (chưa có API), trả về mock data
        if (!cancelled) setSummary(MOCK_DATA);
        setError("Không thể lấy dữ liệu thực, đang dùng dữ liệu mẫu.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; }; // Cleanup function để hủy request nếu component unmount
  }, []);

  return { summary, loading, error };
} 