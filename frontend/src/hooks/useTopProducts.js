import { useEffect, useState } from "react";
import api from "../services/axiosClient";

export default function useTopProducts({ from, to, limit = 5, storeId = null }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);

    const params = { from, to, limit };
    if (storeId) params.storeId = storeId;

    api.get("/reports/top-products", { params })
      .then(res => setData(res.data))
      .catch(() => setError("Không thể lấy dữ liệu top sản phẩm"))
      .finally(() => setLoading(false));
  }, [from, to, limit, storeId]);

  return { data, loading, error };
}