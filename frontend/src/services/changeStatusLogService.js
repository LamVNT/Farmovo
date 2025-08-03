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
  }
};

export default changeStatusLogService; 