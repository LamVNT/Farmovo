import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import AddSalePage from './AddSalePage';
import {getStocktakeDiff} from '../../services/stocktakeService';
import saleTransactionService from '../../services/saleTransactionService';

const BalanceSalePage = () => {
    const {stocktakeId} = useParams();
    const navigate = useNavigate();
    const [diffProducts, setDiffProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState([]);

    useEffect(() => {
        saleTransactionService.getCreateFormData && saleTransactionService.getCreateFormData().then(data => {
            setBatches(data.products || []);
        });
    }, []);

    useEffect(() => {
        if (stocktakeId) {
            getStocktakeDiff(stocktakeId)
                .then((data) => {
                    setDiffProducts(data.map((d) => {
                        const batch = batches.find(b => b.batchCode === d.batchCode || b.name === d.batchCode);

                        return {
                            ...d,
                            id: d.importTransactionDetailId || d.id || null, // đảm bảo là Long hoặc null
                            name: d.productName || d.name || '',
                            quantity: Math.abs(d.diff),
                            batchCode: d.batchCode,
                            zoneReal: d.zoneReal,
                            productName: d.productName,
                            productId: d.productId,
                            unitSalePrice: batch ? batch.unitSalePrice : 0
                        };
                    }));
                })
                .finally(() => setLoading(false));
        }
    }, [stocktakeId, batches]);

    const handleSuccess = () => {
        navigate('/sale');
    };

    return loading ? (
        <div>Đang tải dữ liệu cân bằng kho...</div>
    ) : (
        <AddSalePage
            isBalanceStock
            initialProducts={diffProducts}
            initialNote="Cân bằng kho"
            initialCustomer={{id: null, name: 'Khách lẻ'}}
            onSuccess={handleSuccess}
            // Gọi đúng API saleTransactionService.createFromBalance
            onSubmit={saleTransactionService.createFromBalance}
        />
    );
};

export default BalanceSalePage;
