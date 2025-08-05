import { useState, useCallback } from "react";
import { getDebtNotesByCustomerId, getTotalDebtByCustomerId } from "../services/debtService";

export default function useDebtNotes() {
  const [debtNotes, setDebtNotes] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDebtNotes = useCallback(async (customerId, filters = {}) => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDebtNotesByCustomerId(customerId, page, size, filters);
      setDebtNotes(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalItems || 0);

      // totalDebt riêng endpoint
      try {
        const td = await getTotalDebtByCustomerId(customerId);
        setTotalDebt(td || 0);
      } catch (e) {
        console.error("Failed get total debt", e);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  return {
    debtNotes,
    totalDebt,
    page,
    size,
    totalPages,
    totalItems,
    loading,
    error,
    setPage: (p) => setPage(p),
    setSize: (s) => {
      setSize(s);
      setPage(0);
    },
    fetchDebtNotes,
  };
} 