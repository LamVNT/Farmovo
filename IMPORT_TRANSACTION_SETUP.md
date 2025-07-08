# Hướng dẫn kết nối Import Transaction Frontend - Backend

## Tổng quan
Đã hoàn thành việc kết nối frontend và backend cho module Import Transaction với các tính năng:
- Hiển thị danh sách phiếu nhập hàng từ database
- Tạo phiếu nhập hàng mới
- Tìm kiếm và lọc phiếu nhập hàng
- Hiển thị chi tiết phiếu nhập hàng

## Cấu hình Backend

### 1. CORS Configuration
Backend đã được cấu hình CORS để cho phép frontend (port 5173) truy cập:
```java
registry.addMapping("/api/**")
    .allowedOrigins("http://localhost:5173")
    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    .allowedHeaders("*")
    .allowCredentials(true);
```

### 2. API Endpoints
- `GET /api/importtransaction/list-all` - Lấy danh sách tất cả phiếu nhập hàng
- `GET /api/importtransaction/create-form-data` - Lấy dữ liệu form tạo phiếu nhập hàng
- `POST /api/importtransaction` - Tạo phiếu nhập hàng mới
- `GET /api/importtransaction/{id}` - Lấy chi tiết phiếu nhập hàng theo ID
- `GET /api/importtransaction/filter` - Lọc phiếu nhập hàng theo tham số

### 3. DTOs đã được cập nhật
- `ImportTransactionResponseDto` - Thêm `supplierName`
- `CreateImportTransactionRequestDto.DetailDto` - Thêm `zones_id`

## Cấu hình Frontend

### 1. API Client
Đã cấu hình axios client với base URL: `http://localhost:8080/api`

### 2. Service Layer
`importTransactionService.js` cung cấp các method:
- `listAll()` - Lấy danh sách phiếu nhập hàng
- `getCreateFormData()` - Lấy dữ liệu form
- `create(dto)` - Tạo phiếu nhập hàng mới
- `getById(id)` - Lấy chi tiết theo ID
- `filterByParams(params)` - Lọc theo tham số

### 3. Components đã được cập nhật
- `ImportTransactionPage` - Trang danh sách phiếu nhập hàng
- `ImportPage` - Trang tạo phiếu nhập hàng mới

## Cách chạy và test

### 1. Khởi động Backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend sẽ chạy trên port 8080

### 2. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ chạy trên port 5173

### 3. Test các tính năng

#### Test hiển thị danh sách:
1. Truy cập `http://localhost:5173/import-transaction`
2. Kiểm tra danh sách phiếu nhập hàng được load từ database
3. Test tìm kiếm theo tên phiếu hoặc nhà cung cấp

#### Test tạo phiếu nhập hàng:
1. Click "Nhập hàng" từ trang danh sách
2. Tìm kiếm và chọn sản phẩm
3. Nhập số lượng và giá
4. Click "Lưu tạm" hoặc "Hoàn thành"

#### Test API trực tiếp:
```bash
# Lấy danh sách phiếu nhập hàng
curl http://localhost:8080/api/importtransaction/list-all

# Lấy dữ liệu form
curl http://localhost:8080/api/importtransaction/create-form-data
```

## Lưu ý quan trọng

1. **Database**: Đảm bảo PostgreSQL đang chạy và có dữ liệu trong các bảng:
   - `import_transactions`
   - `import_transaction_details`
   - `products`
   - `customers`
   - `zones`

2. **Authentication**: Hiện tại chưa có authentication, có thể cần thêm JWT token nếu cần

3. **Validation**: Cần thêm validation cho dữ liệu đầu vào

4. **Error Handling**: Đã có basic error handling, có thể cần cải thiện thêm

## Troubleshooting

### Lỗi CORS:
- Kiểm tra CORS config trong backend
- Đảm bảo frontend đang chạy trên port 5173

### Lỗi kết nối database:
- Kiểm tra PostgreSQL connection string trong `application.yml`
- Đảm bảo database `farmovo` đã được tạo

### Lỗi API:
- Kiểm tra logs của backend
- Đảm bảo tất cả dependencies đã được install 