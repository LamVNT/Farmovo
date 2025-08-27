import { useEffect, useState } from "react";
import api from "../services/axiosClient";

export default function useStockByCategory(storeId = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = {};
    if (storeId) params.storeId = storeId;

    api.get("/reports/stock-by-category", { params })
      .then(res => setData(res.data))
      .catch(() => setError("Không thể lấy dữ liệu tồn kho theo nhóm"))
      .finally(() => setLoading(false));
  }, [storeId]);

  return { data, loading, error };
}