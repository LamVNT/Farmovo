import { useEffect, useState } from "react";
import api from "../services/axiosClient";

export default function useRevenueTrend({ type = "day", from, to, storeId = null }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);

    const params = { type, from, to };
    if (storeId) params.storeId = storeId;

    api.get("/reports/revenue-trend", { params })
      .then(res => setData(res.data))
      .catch(() => setError("Không thể lấy dữ liệu doanh thu"))
      .finally(() => setLoading(false));
  }, [type, from, to, storeId]);

  return { data, loading, error };
}