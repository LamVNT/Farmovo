import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/eggs';

export const getEggs = async () => {
    const res = await axios.get(API_URL);
    return res.data;
};

export const createEgg = async (egg) => {
    const res = await axios.post(API_URL, egg);
    return res.data;
};
