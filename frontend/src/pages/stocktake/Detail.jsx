import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../../services/axiosClient";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();

const StockTakeDetailPage = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    axios.get(`/stocktakes/${id}`)
      .then(res => setDetail(res.data))
      .catch(() => alert("Không lấy được chi tiết phiếu kiểm kê!"));
  }, [id]);

  if (!detail) return <p>Đang tải chi tiết...</p>;

  // Parse detail JSON
  let details = [];
  try {
    details = JSON.parse(detail.detail);
  } catch {}

  return (
    <div>
      <h2>Chi tiết phiếu kiểm kê #{detail.id}</h2>
      <p>Ngày kiểm kê: {detail.stocktakeDate}</p>
      <p>Ghi chú: {detail.stocktakeNote}</p>
      <p>Trạng thái: {detail.status}</p>
      <Button variant="outlined" onClick={() => navigate("/stocktake")}>Quay lại danh sách</Button>
      <table border="1" cellPadding="8" style={{ width: "100%", marginTop: 16 }}>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Zone đã kiểm</th>
            <th>Thực tế</th>
            <th>Tồn kho hệ thống</th>
            <th>Chênh lệch</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, idx) => (
            <tr key={idx}>
              <td>{d.productId}</td>
              <td>{d.zones_id ? d.zones_id.join(", ") : ""}</td>
              <td>{d.real}</td>
              <td>{d.remain}</td>
              <td>{d.diff}</td>
              <td>{d.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockTakeDetailPage;
