import React, {useEffect, useState} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import AddSalePage from './AddSalePage';
import {getStocktakeDiff, getStocktakeDiffForBalance} from '../../services/stocktakeService';
import saleTransactionService from '../../services/saleTransactionService';
import { Button } from '@mui/material';
import { useStoreForStocktake } from '../../hooks/useStoreForStocktake';
import { useAuth } from '../../contexts/AuthorizationContext';

const BalanceSalePage = () => {
    const {stocktakeId} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isStaff } = useAuth(); // Sử dụng hook useAuth để kiểm tra role
    const [diffProducts, setDiffProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [nextCode, setNextCode] = useState('');
    const stocktakeCode = location.state?.stocktakeCode || '';

    // Get user info and store context
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.roles?.[0];
    const storeForStocktake = useStoreForStocktake(user, userRole);

    // Get store info from navigation state or context
    // Ưu tiên thông tin từ stocktake (stateStoreId) trước context
    const { storeId: stateStoreId, storeName: stateStoreName } = location.state || {};
    const currentStoreId = stateStoreId || storeForStocktake.currentStoreId;
    const currentStoreName = stateStoreName || storeForStocktake.getStoreDisplayName();

    useEffect(() => {
        saleTransactionService.getCreateFormData && saleTransactionService.getCreateFormData().then(data => {
            setBatches(data.products || []);
            setCustomers(data.customers || []);
        });
        saleTransactionService.getNextBalanceCode && saleTransactionService.getNextBalanceCode().then(setNextCode).catch(() => {});
    }, []);

    useEffect(() => {
        if (stocktakeId) {
            // Sử dụng API mới để lấy dữ liệu đã được chuyển đổi với đầy đủ thông tin giá
            getStocktakeDiffForBalance(stocktakeId)
                .then((data) => {
                    console.log('Stocktake diff for balance data:', data);
                    // Backend đã lọc chỉ lấy những item có diff âm (thiếu hàng), không cần lọc thêm
                    const shortageDiffs = Array.isArray(data) ? data : [];
                    setDiffProducts(shortageDiffs.map((d) => {
                        // Dữ liệu đã được chuyển đổi từ backend với đầy đủ thông tin
                        return {
                            id: d.id, // ImportTransactionDetail ID
                            proId: d.proId, // Product ID
                            productId: d.proId,
                            name: d.name || d.productName, // Mã lô hàng hoặc tên sản phẩm
                            productName: d.productName,
                            productCode: d.productCode,
                            code: d.productCode,
                            quantity: d.quantity, // Số lượng chênh lệch (đã là số dương)
                            remainQuantity: d.remainQuantity,
                            unitSalePrice: d.unitSalePrice || 0,
                            price: d.unitSalePrice || 0,
                            total: (d.unitSalePrice || 0) * (d.quantity || 0),
                            categoryName: d.categoryName,
                            storeName: d.storeName,
                            batchCode: d.batchCode || d.name,
                            zoneReal: d.zoneReal,
                            createAt: d.createAt,
                            expireDate: d.expireDate
                        };
                    }));
                })
                .catch((error) => {
                    console.error('Error loading stocktake diff for balance:', error);
                    // Fallback to old API if new one fails
                    return getStocktakeDiff(stocktakeId)
                        .then((data) => {
                            const shortageDiffs = Array.isArray(data) ? data.filter((d) => Number(d.diff) < 0) : [];
                            setDiffProducts(shortageDiffs.map((d) => {
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
                        });
                })
                .finally(() => setLoading(false));
        }
    }, [stocktakeId]);

    const handleSuccess = () => {
        // Nếu là Staff, chuyển về trang StockTake Detail
        if (isStaff()) {
            navigate(`/stocktake/${stocktakeId}`);
        } else {
            // Nếu là Admin/Owner, chuyển về trang danh sách phiếu cân bằng
            navigate('/balance');
        }
    };

    const handleSubmit = async (dto) => {
        // Yêu cầu người dùng chọn khách hàng (không mặc định Khách lẻ)
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
                initialCustomer={null}
                onSubmit={handleSubmit}
                initialCode={nextCode}
                customersProp={customers}
                lockedStoreId={currentStoreId}
                lockedStoreName={currentStoreName}
                fromStocktake={true}
                stocktakeId={stocktakeId}
            />
        </>
    );
};

export default BalanceSalePage;
