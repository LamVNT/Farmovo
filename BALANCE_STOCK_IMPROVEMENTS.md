# Cải Tiến Luồng Tạo Phiếu Cân Bằng Kho

## Tổng Quan
Đã cải tiến luồng tạo phiếu cân bằng kho để lấy đầy đủ dữ liệu bao gồm đơn giá, thành tiền, tổng tiền hàng và số tiền đã trả tự động từ hệ thống.

## Các Thay Đổi Chính

### 1. Backend Changes

#### 1.1 BalanceStockService Interface
**File:** `backend/src/main/java/com/farmovo/backend/services/BalanceStockService.java`
- Thêm method mới: `convertStocktakeDetailToProductSale(List<StocktakeDetailDto> stocktakeDetails)`
- Method này chuyển đổi dữ liệu từ `StocktakeDetailDto` thành `ProductSaleResponseDto` với đầy đủ thông tin giá

#### 1.2 BalanceStockServiceImpl
**File:** `backend/src/main/java/com/farmovo/backend/services/impl/BalanceStockServiceImpl.java`
- Implement method `convertStocktakeDetailToProductSale()`
- Logic chuyển đổi:
  - **CHỈ XỬ LÝ DIFF ÂM**: Lọc chỉ lấy các item có diff < 0 (thiếu hàng) cho phiếu cân bằng
  - Lấy thông tin `ImportTransactionDetail` dựa trên ID hoặc batchCode
  - Trích xuất đầy đủ thông tin: unitSalePrice, productName, productCode, categoryName, storeName
  - Tính toán quantity từ diff (lấy giá trị tuyệt đối của diff âm)
  - Fallback về Product nếu không tìm thấy ImportTransactionDetail
  - Xử lý exception và log lỗi

#### 1.3 ReportController
**File:** `backend/src/main/java/com/farmovo/backend/controller/ReportController.java`
- Thêm 2 endpoint mới:
  - `GET /api/reports/stocktake-diff-for-balance?stocktakeId={id}`
  - `GET /api/reports/stocktake-diff-for-balance/{stocktakeId}`
- Endpoint trả về `List<ProductSaleResponseDto>` thay vì `List<StocktakeDetailDto>`

### 2. Frontend Changes

#### 2.1 StocktakeService
**File:** `frontend/src/services/stocktakeService.js`
- Thêm function: `getStocktakeDiffForBalance(stocktakeId)`
- Gọi API endpoint mới để lấy dữ liệu đã được chuyển đổi

#### 2.2 BalanceSalePage
**File:** `frontend/src/pages/sale-transaction/BalanceSalePage.jsx`
- Cập nhật logic load dữ liệu:
  - Sử dụng `getStocktakeDiffForBalance()` thay vì `getStocktakeDiff()`
  - **KHÔNG CẦN LỌC**: Backend đã lọc chỉ lấy diff âm (thiếu hàng)
  - Dữ liệu trả về đã có đầy đủ thông tin giá và tính toán
  - Fallback về API cũ nếu API mới thất bại (vẫn lọc diff < 0)
- Mapping dữ liệu đơn giản hơn vì backend đã xử lý

#### 2.3 AddSalePage
**File:** `frontend/src/pages/sale-transaction/AddSalePage.jsx`
- Cập nhật cột "Đơn giá":
  - Đối với phiếu cân bằng kho: hiển thị read-only, không cho phép chỉnh sửa
  - Đối với phiếu bán thường: vẫn cho phép chỉnh sửa như cũ
- Đảm bảo hiển thị đúng giá trị `unitSalePrice` từ hệ thống

### 3. Testing

#### 3.1 Unit Tests
**File:** `backend/src/test/java/com/farmovo/backend/services/impl/BalanceStockServiceImplTest.java`
- Test cases cho method `convertStocktakeDetailToProductSale()`:
  - Test với dữ liệu hợp lệ (diff âm)
  - Test với diff = 0 (không có chênh lệch) - không trả về item nào
  - Test với diff dương (dư hàng) - không trả về item nào
  - Test với diff = null
  - Test khi không tìm thấy ImportTransactionDetail
  - Test fallback về Product
  - Test với nhiều items (chỉ diff âm)
  - Test với mix diff âm/dương/0 - chỉ trả về diff âm

## Lợi Ích Đạt Được

### 1. Tự Động Hóa Dữ Liệu
- **Đơn giá**: Tự động lấy từ `ImportTransactionDetail.unitSalePrice`
- **Thành tiền**: Tự động tính = đơn giá × số lượng chênh lệch
- **Tổng tiền hàng**: Tự động tính tổng tất cả thành tiền
- **Số tiền đã trả**: Mặc định = tổng tiền hàng (phiếu cân bằng thường được trả hết)

### 2. Đảm Bảo Tính Chính Xác
- Lấy giá từ lô hàng thực tế thay vì nhập thủ công
- Giảm thiểu sai sót do nhập liệu
- Đồng bộ với dữ liệu tồn kho

### 3. Cải Thiện UX
- Không cần nhập đơn giá thủ công
- Hiển thị đầy đủ thông tin ngay từ đầu
- Giao diện rõ ràng với các trường read-only cho phiếu cân bằng

### 4. Tính Nhất Quán
- Sử dụng cùng logic tính toán với các phiếu bán khác
- Đảm bảo format hiển thị thống nhất
- Xử lý exception và fallback hợp lý

## Luồng Hoạt Động Mới

1. **Tạo Phiếu Cân Bằng**:
   - User click "Tạo Phiếu Cân Bằng" từ stocktake detail
   - Frontend gọi `/api/reports/stocktake-diff-for-balance/{stocktakeId}`
   - Backend chuyển đổi `StocktakeDetailDto` → `ProductSaleResponseDto`
   - Frontend hiển thị với đầy đủ thông tin giá

2. **Hiển Thị Dữ Liệu**:
   - Đơn giá: hiển thị read-only từ `unitSalePrice`
   - Số lượng: từ `Math.abs(diff)`
   - Thành tiền: tự động tính
   - Tổng tiền: tự động tính tổng

3. **Lưu Phiếu**:
   - Dữ liệu đã đầy đủ, không cần xử lý thêm
   - Gọi API `/api/sale-transactions/save-from-balance`
   - Tạo phiếu với status `WAITING_FOR_APPROVE`

## Backward Compatibility
- Giữ nguyên API cũ `/api/reports/stocktake-diff` để không ảnh hưởng các tính năng khác
- Frontend có fallback về API cũ nếu API mới thất bại
- Không thay đổi cấu trúc database hiện tại

## Kết Luận
Các cải tiến này đã giải quyết được vấn đề thiếu thông tin giá trong phiếu cân bằng kho, tự động hóa việc tính toán và cải thiện trải nghiệm người dùng đáng kể.
