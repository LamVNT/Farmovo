# Tính năng Navigation từ Debt Note đến Transaction

## Mô tả
Tính năng này cho phép người dùng click vào `sourceId` trong dialog chi tiết debt note để chuyển sang trang chi tiết của sale transaction hoặc import transaction tương ứng.

## Cách hoạt động

### 1. Trong DebtDetailDialog
- Khi `fromSource` là `'SALE'` và có `sourceId`, `sourceId` sẽ hiển thị như một button có thể click
- Khi `fromSource` là `'PURCHASE'` và có `sourceId`, `sourceId` sẽ hiển thị như một button có thể click
- Các trường hợp khác, `sourceId` vẫn hiển thị như TextField thông thường

### 2. Navigation Logic
- Click vào button `sourceId` sẽ:
  - Nếu `fromSource === 'SALE'`: Chuyển đến `/sale/{sourceId}`
  - Nếu `fromSource === 'PURCHASE'`: Chuyển đến `/import/{sourceId}`
  - Đóng dialog debt detail hiện tại

### 3. Trang đích
- Khi truy cập `/sale/{id}`: Tự động mở dialog chi tiết sale transaction
- Khi truy cập `/import/{id}`: Tự động mở dialog chi tiết import transaction
- Khi đóng dialog, tự động chuyển về trang chính (`/sale` hoặc `/import`)

## Các file đã thay đổi

### Frontend
1. `frontend/src/components/debt/DebtDetailDialog.jsx`
   - Thêm `useNavigate` hook
   - Thêm `handleSourceIdClick` function
   - Thay đổi `sourceId` từ TextField thành Button có thể click
   - Cải thiện UI với tooltip và styling

2. `frontend/src/routes/index.jsx`
   - Thêm route `/sale/:id` cho sale transaction detail
   - Thêm route `/import/:id` cho import transaction detail

3. `frontend/src/pages/sale-transaction/index.jsx`
   - Thêm `useParams` và `useNavigate` hooks
   - Thêm logic tự động mở dialog khi có ID trong URL
   - Cập nhật dialog close handler để chuyển về trang chính

4. `frontend/src/pages/import-transaction/index.jsx`
   - Thêm `useParams` và `useNavigate` hooks
   - Thêm logic tự động mở dialog khi có ID trong URL
   - Cập nhật dialog close handler để chuyển về trang chính

## Backend
Backend đã có sẵn các API cần thiết:
- `GET /api/sale-transactions/{id}` - Lấy chi tiết sale transaction
- `GET /api/import-transaction/{id}` - Lấy chi tiết import transaction

## Cách sử dụng

1. Mở trang Debt Management
2. Chọn một khách hàng có debt notes
3. Click vào icon "Xem" (VisibilityIcon) của một debt note
4. Trong dialog chi tiết, nếu `sourceId` hiển thị như button (có màu xanh), click vào nó
5. Hệ thống sẽ chuyển sang trang chi tiết transaction tương ứng
6. Khi đóng dialog transaction, sẽ quay về trang chính

## Lưu ý
- Chỉ các debt note có `fromSource` là `'SALE'` hoặc `'PURCHASE'` mới có thể click
- Các debt note có `fromSource` khác (như `'MANUAL'`) sẽ hiển thị `sourceId` như TextField thông thường
- Navigation sẽ hoạt động ngay cả khi không có ID trong URL (từ trang chính) 