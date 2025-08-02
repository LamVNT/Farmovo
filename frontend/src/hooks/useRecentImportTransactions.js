import { useEffect, useState } from "react";
import api from "../services/axiosClient";

export default function useRecentImportTransactions(limit = 5) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/import-transaction/recent", { params: { limit } })
      .then(res => setData(res.data))
      .catch(() => setError("Không thể lấy dữ liệu giao dịch nhập gần nhất"))
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading, error };
} 