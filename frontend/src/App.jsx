import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [eggs, setEggs] = useState([]);
    const [type, setType] = useState('');
    const [quantity, setQuantity] = useState('');

    const API_URL = import.meta.env.VITE_API_URL + '/eggs';

    const fetchEggs = async () => {
        try {
            const response = await axios.get(API_URL);
            setEggs(response.data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách trứng:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!type || !quantity) return;

        try {
            await axios.post(API_URL, {
                type,
                quantity: parseInt(quantity),
            });
            setType('');
            setQuantity('');
            fetchEggs(); // reload danh sách
        } catch (error) {
            console.error('Lỗi khi thêm trứng:', error);
        }
    };

    useEffect(() => {
        fetchEggs();
    }, []);

    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
            <h1>Farmovo - Quản lý Trứng</h1>

            <h2>📦 Danh sách trứng</h2>
            <ul>
                {eggs.map((egg) => (
                    <li key={egg.id}>
                        🥚 {egg.type} - {egg.quantity} quả
                    </li>
                ))}
            </ul>

            <h2>➕ Thêm trứng mới</h2>
            <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                <input
                    type="text"
                    placeholder="Loại trứng"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Số lượng"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    style={{ marginLeft: '1rem' }}
                />
                <button type="submit" style={{ marginLeft: '1rem' }}>
                    Lưu
                </button>
            </form>
        </div>
    );
}

export default App;
