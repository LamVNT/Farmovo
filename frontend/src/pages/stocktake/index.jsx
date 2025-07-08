import React, { useState, useEffect } from "react";
import StocktakeFormDialog from "../../components/stocktake/StocktakeFormDialog";
import { createStocktake, getStocktakeList } from "../../services/stocktakeService";
import { getProducts } from "../../services/productService"; // cần tạo nếu chưa có
import { getZones } from "../../services/zoneService"; // cần tạo nếu chưa có
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const StockTakePage = () => {
  const [stocktakes, setStocktakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [zones, setZones] = useState([]);

  useEffect(() => {
    getStocktakeList()
      .then(res => {
        setStocktakes(res.data);
      })
      .catch(err => {
        alert("Lỗi khi lấy danh sách phiếu kiểm kê!");
      })
      .finally(() => setLoading(false));
  }, []);

  // Lấy danh sách sản phẩm, zone khi mount
  useEffect(() => {
    getProducts().then(setProducts);
    getZones().then(setZones);
  }, []);

  const handleCreate = (rows) => {
    createStocktake({
      detail: JSON.stringify(rows),
      stocktakeNote: "Phiếu kiểm kê mới",
      storeId: 1, // hoặc lấy từ context
      status: "DRAFT",
      stocktakeDate: new Date().toISOString()
    }).then(() => {
      alert("Tạo phiếu kiểm kê thành công!");
      setOpenForm(false);
      // reload lại danh sách
      setLoading(true);
      getStocktakeList()
        .then(res => setStocktakes(res.data))
        .catch(() => alert("Lỗi khi reload danh sách!"))
        .finally(() => setLoading(false));
    }).catch(() => alert("Tạo phiếu kiểm kê thất bại!"));
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>StockTake (Kiểm kê kho)</h1>
      <p>Quản lý và theo dõi các phiếu kiểm kê kho trứng.</p>
      <Button variant="contained" onClick={() => setOpenForm(true)}>
        + Tạo phiếu kiểm kê mới
      </Button>
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: "100%", marginTop: 16 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ngày kiểm kê</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {stocktakes.map(st => (
              <tr key={st.id}>
                <td>{st.id}</td>
                <td>{new Date(st.stocktakeDate).toLocaleDateString()}</td>
                <td>{st.stocktakeNote}</td>
                <td>{st.status}</td>
                <td>
                  <Button onClick={() => navigate(`/stocktake/${st.id}`)}>
                    Xem chi tiết
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <StocktakeFormDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleCreate}
        products={products}
        zones={zones}
      />
    </div>
  );
};

export default StockTakePage; 