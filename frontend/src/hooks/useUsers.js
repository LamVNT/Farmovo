import { useState, useCallback } from "react";
import { userService } from "../services/userService";

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(
    async (filters = {}) => {
      setLoading(true);
      setError(null);
      try {
        const data = await userService.getUsersPaged({ page, size, ...filters });
        setUsers(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalItems(data.totalElements ?? data.totalItems ?? 0);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    },
    [page, size]
  );

  return {
    users,
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
    fetchUsers,
  };
} 