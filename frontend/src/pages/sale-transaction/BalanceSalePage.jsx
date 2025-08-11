import React, {useEffect, useState} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import AddSalePage from './AddSalePage';
import {getStocktakeDiff} from '../../services/stocktakeService';
import saleTransactionService from '../../services/saleTransactionService';
import { Button } from '@mui/material';

const BalanceSalePage = () => {
    const {stocktakeId} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [diffProducts, setDiffProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [nextCode, setNextCode] = useState('');
    const stocktakeCode = location.state?.stocktakeCode || '';

    useEffect(() => {
        saleTransactionService.getCreateFormData && saleTransactionService.getCreateFormData().then(data => {
            setBatches(data.products || []);
            setCustomers(data.customers || []);
        });
        saleTransactionService.getNextBalanceCode && saleTransactionService.getNextBalanceCode().then(setNextCode).catch(() => {});
    }, []);

    const khachLe = customers.find(c => c.name === 'Khách lẻ') || null;

    useEffect(() => {
        if (stocktakeId) {
            getStocktakeDiff(stocktakeId)
                .then((data) => {
                    setDiffProducts(data.map((d) => {
                        const batch = batches.find(b => b.batchCode === d.batchCode || b.name === d.batchCode);
                        const productCode = d.productCode || (batch ? batch.productCode : undefined);
                        return {
                            ...d,
                            id: d.importTransactionDetailId || d.id || (batch ? batch.id : null),
                            name: d.productName || d.name || (batch ? batch.productName : ''),
                            quantity: Math.abs(d.diff),
                            batchCode: d.batchCode || (batch ? batch.name : undefined),
                            zoneReal: d.zoneReal,
                            productName: d.productName || d.name || (batch ? batch.productName : ''),
                            productId: d.productId || (batch ? batch.proId : undefined),
                            proId: d.productId || (batch ? batch.proId : undefined),
                            productCode,
                            code: productCode,
                            unitSalePrice: batch ? batch.unitSalePrice : 0,
                            price: batch ? batch.unitSalePrice : 0,
                            total: (batch ? batch.unitSalePrice : 0) * Math.abs(d.diff)
                        };
                    }));
                })
                .finally(() => setLoading(false));
        }
    }, [stocktakeId, batches]);

    const handleSuccess = () => {
        navigate('/balance');
    };

    const handleSubmit = async (dto) => {
        // Bổ sung link Stocktake vào payload khi submit PCB
        const payload = {
            ...dto,
            saleTransactionNote: 'Cân bằng kho',
            status: 'WAITING_FOR_APPROVE',
            stocktakeId: Number(stocktakeId),
            name: nextCode || undefined
        };
        return saleTransactionService.createFromBalance(payload);
    };

    return loading ? (
        <div>Đang tải dữ liệu cân bằng kho...</div>
    ) : (
        <>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Phiếu Cân Bằng Kho</h2>
                {stocktakeId && (
                    <Button variant="outlined" color="secondary" onClick={() => navigate(`/stocktake/${stocktakeId}`)}>
                        Quay về kiểm kê {stocktakeCode ? `(${stocktakeCode})` : ''}
                    </Button>
                )}
            </div>
            <AddSalePage
                isBalanceStock
                initialProducts={diffProducts}
                initialNote="Cân bằng kho"
                initialCustomer={khachLe}
                onSuccess={handleSuccess}
                onSubmit={handleSubmit}
                initialCode={nextCode}
            />
        </>
    );
};

export default BalanceSalePage;
