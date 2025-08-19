import { useState, useEffect, useCallback } from 'react';
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

  const fetchLogs = useCallback(async (filterRequest = {}, pageable = { page: 0, size: 25 }) => {
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
  }, []);

  const getLogById = useCallback(async (id) => {
    try {
      const response = await changeStatusLogService.getById(id);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Có lỗi xảy ra khi tải chi tiết log');
    }
  }, []);

  const getSourceEntity = useCallback(async (id) => {
    try {
      const response = await changeStatusLogService.getSourceEntity(id);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin source');
    }
  }, []);
  
  const getLatestLogsForEachSource = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await changeStatusLogService.getLatestLogsForEachSource();
      console.log('Latest logs API Response:', response.data);
      
      setLogs(response.data || []);
      setPagination({
        page: 0,
        size: response.data?.length || 0,
        totalElements: response.data?.length || 0,
        totalPages: 1
      });
    } catch (err) {
      console.error('Error fetching latest logs:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
      setLogs([]);
      setPagination({
        page: 0,
        size: 0,
        totalElements: 0,
        totalPages: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  const getLatestLogsForEachSourceByModel = useCallback(async (modelName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await changeStatusLogService.getLatestLogsForEachSourceByModel(modelName);
      console.log('Latest logs by model API Response:', response.data);
      
      setLogs(response.data || []);
      setPagination({
        page: 0,
        size: response.data?.length || 0,
        totalElements: response.data?.length || 0,
        totalPages: 1
      });
    } catch (err) {
      console.error('Error fetching latest logs by model:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
      setLogs([]);
      setPagination({
        page: 0,
        size: 0,
        totalElements: 0,
        totalPages: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((newPage) => {
    fetchLogs({}, { page: newPage, size: pagination.size });
  }, [fetchLogs, pagination.size]);

  const handleFilterChange = useCallback((newFilters) => {
    fetchLogs(newFilters, { page: 0, size: pagination.size });
  }, [fetchLogs, pagination.size]);

  const handleSizeChange = useCallback((newSize) => {
    fetchLogs({}, { page: 0, size: newSize });
  }, [fetchLogs]);

  // Không tự động fetch khi khởi tạo, để trang component quản lý

  return {
    logs,
    loading,
    error,
    pagination,
    fetchLogs,
    getLogById,
    getSourceEntity,
    getLatestLogsForEachSource,
    getLatestLogsForEachSourceByModel,
    handlePageChange,
    handleFilterChange,
    handleSizeChange
  };
};

export default useChangeStatusLog; 