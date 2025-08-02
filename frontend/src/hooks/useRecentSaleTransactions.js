import { useEffect, useState } from "react";
import api from "../services/axiosClient";

export default function useRecentSaleTransactions(limit = 5) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/sale-transactions/recent", { params: { limit } })
      .then(res => setData(res.data))
      .catch(() => setError("Không thể lấy dữ liệu giao dịch xuất gần nhất"))
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading, error };
} 