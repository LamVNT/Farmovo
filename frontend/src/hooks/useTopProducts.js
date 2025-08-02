import { useEffect, useState } from "react";
import api from "../services/axiosClient";

export default function useTopProducts({ from, to, limit = 5 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    api.get("/reports/top-products", { params: { from, to, limit } })
      .then(res => setData(res.data))
      .catch(() => setError("Không thể lấy dữ liệu top sản phẩm"))
      .finally(() => setLoading(false));
  }, [from, to, limit]);

  return { data, loading, error };
} 