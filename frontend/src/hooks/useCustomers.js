import { useState, useCallback } from "react";
import { customerService } from "../services/customerService";

export default function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomersPaged({ page, size, ...filters });
      setCustomers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalElements ?? data.totalItems ?? 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  return {
    customers,
    page,
    size,
    totalPages,
    totalItems,
    loading,
    error,
    setPage: (p) => setPage(p),
    setSize: (s) => { setSize(s); setPage(0); },
    fetchCustomers,
  };
} 