import React, { useEffect, useState } from 'react';
import { getEggs, createEgg } from '../services/eggService';

const EggTest = () => {
    const [eggs, setEggs] = useState([]);
    const [type, setType] = useState('');
    const [quantity, setQuantity] = useState('');

    const fetchEggs = async () => {
        try {
            const data = await getEggs();
            setEggs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách trứng:', error);
            setEggs([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!type || !quantity) return;

        await createEgg({ type, quantity: parseInt(quantity) });
        setType('');
        setQuantity('');
        fetchEggs();
    };

    useEffect(() => {
        fetchEggs();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Danh sách Trứng</h2>
            <ul>
                {Array.isArray(eggs) && eggs.length > 0 ? (
                    eggs.map((egg) => (
                        <li key={egg.id}>
                            {egg.type} - {egg.quantity} quả
                        </li>
                    ))
                ) : (
                    <li>Không có dữ liệu trứng</li>
                )}
            </ul>

            <h3>Thêm Trứng Mới</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Loại trứng"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Số lượng"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />
                <button type="submit">Thêm</button>
            </form>
        </div>
    );
};

export default EggTest;