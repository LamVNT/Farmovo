import { useState, useEffect } from 'react';
import changeStatusLogService from '../services/changeStatusLogService';

const useChangeStatusLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    totalElements: 0,
    totalPages: 0
  });

  const fetchLogs = async (filterRequest = {}, pageable = { page: 0, size: 25 }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await changeStatusLogService.getLogs(filterRequest, pageable);
      console.log('API Response:', response.data);
      
      // Xử lý response an toàn - cấu trúc từ PageResponse
      const data = response.data;
      const content = data?.content || [];
      
      setLogs(content);
      setPagination({
        page: data?.pageNumber || 0,
        size: data?.pageSize || 25,
        totalElements: data?.totalElements || 0,
        totalPages: data?.totalPages || 0
      });
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
      // Set default values khi có lỗi
      setLogs([]);
      setPagination({
        page: 0,
        size: 25,
        totalElements: 0,
        totalPages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getLogById = async (id) => {
    try {
      const response = await changeStatusLogService.getById(id);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Có lỗi xảy ra khi tải chi tiết log');
    }
  };

  const getSourceEntity = async (id) => {
    try {
      const response = await changeStatusLogService.getSourceEntity(id);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin source');
    }
  };

  const handlePageChange = (newPage) => {
    fetchLogs({}, { page: newPage, size: pagination.size });
  };

  const handleFilterChange = (newFilters) => {
    fetchLogs(newFilters, { page: 0, size: pagination.size });
  };

  const handleSizeChange = (newSize) => {
    fetchLogs({}, { page: 0, size: newSize });
  };

  // Không tự động fetch khi khởi tạo, để trang component quản lý

  return {
    logs,
    loading,
    error,
    pagination,
    fetchLogs,
    getLogById,
    getSourceEntity,
    handlePageChange,
    handleFilterChange,
    handleSizeChange
  };
};

export default useChangeStatusLog; 