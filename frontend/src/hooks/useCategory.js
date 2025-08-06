import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/categoryService";

export default function useCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (form) => {
    const created = await createCategory(form);
    setCategories(prev => [...prev, created]);
    return created;
  };

  const handleUpdate = async (id, form) => {
    const updated = await updateCategory(id, form);
    setCategories(prev => prev.map(cat => (cat.id === id ? updated : cat)));
    return updated;
  };

  const handleDelete = async (id) => {
    await deleteCategory(id);
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    handleCreate,
    handleUpdate,
    handleDelete,
    setCategories,
  };
} 