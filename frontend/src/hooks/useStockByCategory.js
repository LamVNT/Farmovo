import { useEffect, useState } from "react";
import api from "../services/axiosClient";

export default function useStockByCategory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/reports/stock-by-category")
      .then(res => setData(res.data))
      .catch(() => setError("Không thể lấy dữ liệu tồn kho theo nhóm"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
} 