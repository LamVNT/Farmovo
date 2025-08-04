import { useState, useEffect, useCallback } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/categoryService";

export default function useCategory() {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [searchText, setSearchText] = useState("");
  const [useSmartSearch, setUseSmartSearch] = useState(true);

  const fetchCategories = useCallback(async (pageArg = page, sizeArg = size, searchArg = searchText) => {
    setLoading(true);
    try {
      const params = {
        page: pageArg,
        size: sizeArg,
        name: useSmartSearch && total <= 100 ? undefined : searchArg, // ❗ dùng search BE nếu cần
      };
      const data = await getCategories(params);
      setCategories(data.content || []);
      setTotal(data.totalElements || 0);
      if (data.totalElements <= 100 && useSmartSearch) {
        setAllCategories(data.content || []); // dùng cho filter FE
      }
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText, useSmartSearch, total]);

  useEffect(() => {
    fetchCategories();
  }, [page, size, searchText, fetchCategories]);

  const handleCreate = async (form) => {
    const created = await createCategory(form);
    fetchCategories(0, size, searchText);
    return created;
  };

  const handleUpdate = async (id, form) => {
    const updated = await updateCategory(id, form);
    fetchCategories(page, size, searchText);
    return updated;
  };

  const handleDelete = async (id) => {
    await deleteCategory(id);
    fetchCategories(page, size, searchText);
  };

  return {
    categories,
    allCategories,
    total,
    loading,
    error,
    fetchCategories,
    handleCreate,
    handleUpdate,
    handleDelete,
    setCategories,
    page,
    setPage,
    size,
    setSize,
    searchText,
    setSearchText,
    useSmartSearch,
    setUseSmartSearch
  };
} 