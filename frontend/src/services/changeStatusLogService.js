import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}`;

const changeStatusLogService = {
  // Lấy danh sách logs với filter và pagination
  getLogs: async (filterRequest, pageable) => {
    try {
      console.log('Calling API:', `${API_URL}/change-statuslog/list-all`);
      console.log('Filter request:', filterRequest);
      console.log('Pageable params:', pageable);
      
      const response = await axios.post(`${API_URL}/change-statuslog/list-all`, filterRequest, {
        params: pageable,
        withCredentials: true
      });
      
      console.log('API Response:', response.data);
      return response;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Lấy chi tiết log theo ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/change-statuslog/${id}`, {
        withCredentials: true
      });
      return response;
    } catch (error) {
      console.error('Error getting log by ID:', error);
      throw error;
    }
  },

  // Lấy thông tin source entity
  getSourceEntity: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/change-statuslog/${id}/source`, {
        withCredentials: true
      });
      return response;
    } catch (error) {
      console.error('Error getting source entity:', error);
      throw error;
    }
  },
  
  // Lấy bản ghi mới nhất cho mỗi mã nguồn
  getLatestLogsForEachSource: async () => {
    try {
      const response = await axios.get(`${API_URL}/change-statuslog/latest-each-source`, {
        withCredentials: true
      });
      return response;
    } catch (error) {
      console.error('Error getting latest logs for each source:', error);
      throw error;
    }
  },
  
  // Lấy bản ghi mới nhất cho mỗi mã nguồn theo modelName
  getLatestLogsForEachSourceByModel: async (modelName) => {
    try {
      const response = await axios.get(`${API_URL}/change-statuslog/latest-each-source/${modelName}`, {
        withCredentials: true
      });
      return response;
    } catch (error) {
      console.error('Error getting latest logs for each source by model:', error);
      throw error;
    }
  },

  // Lấy tất cả bản ghi thay đổi của một mã nguồn cụ thể
  getLogsByModel: async (modelName, modelId) => {
    try {
      const response = await axios.post(`${API_URL}/change-statuslog/by-model`, {
        modelName: modelName,
        modelId: modelId
      }, {
        withCredentials: true
      });
      return response;
    } catch (error) {
      console.error('Error getting logs by model:', error);
      throw error;
    }
  }
};

export default changeStatusLogService; 