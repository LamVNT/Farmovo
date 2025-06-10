import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/eggs';

export const getEggs = async () => {
    try {
        const res = await axios.get(API_URL);
        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error('Lỗi khi gọi API getEggs:', error);
        return [];
    }
};

export const createEgg = async (egg) => {
    try {
        const res = await axios.post(API_URL, egg);
        return res.data;
    } catch (error) {
        console.error('Lỗi khi gọi API createEgg:', error);
        throw error; // Ném lỗi để component xử lý
    }
};