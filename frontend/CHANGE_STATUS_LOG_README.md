# Trang Lịch sử thay đổi trạng thái (Change Status Log)

## Mô tả
Trang này cho phép người dùng xem và quản lý lịch sử thay đổi trạng thái của các đối tượng trong hệ thống Farmovo.

## Tính năng chính

### 1. Xem danh sách logs
- Hiển thị danh sách các thay đổi trạng thái với thông tin chi tiết
- Phân trang với tùy chọn số dòng mỗi trang (5, 10, 25, 50)
- Sắp xếp theo thời gian tạo (mới nhất trước)

### 2. Bộ lọc nâng cao
- **Loại đối tượng**: Bán hàng, Nhập hàng, Kiểm kê, Ghi nợ, Khách hàng, Sản phẩm
- **ID đối tượng**: Tìm kiếm theo ID cụ thể
- **Trạng thái cũ/mới**: Lọc theo trạng thái trước và sau khi thay đổi
- **Mô tả**: Tìm kiếm trong nội dung mô tả
- **Khoảng thời gian**: Lọc theo ngày từ/đến

### 3. Xem chi tiết
- Dialog hiển thị thông tin chi tiết của log
- Thông tin cơ bản: ID, loại đối tượng, thời gian tạo
- Thông tin nguồn: Mã nguồn, loại nguồn
- Thay đổi trạng thái: Trạng thái cũ → Trạng thái mới
- Mô tả chi tiết

### 4. Điều hướng đến nguồn
- Nút "Xem nguồn" để chuyển đến trang chi tiết của đối tượng gốc
- Hỗ trợ điều hướng đến các trang: Bán hàng, Nhập hàng, Kiểm kê, v.v.

## Cấu trúc file

```
frontend/src/
├── services/
│   └── changeStatusLogService.js          # Service gọi API
├── hooks/
│   └── useChangeStatusLog.js              # Hook quản lý state và logic
├── components/
│   ├── ChangeStatusLogTable.jsx           # Bảng hiển thị danh sách
│   ├── ChangeStatusLogFilter.jsx          # Component bộ lọc
│   └── ChangeStatusLogDetailDialog.jsx    # Dialog chi tiết
├── pages/
│   └── change-status-log/
│       └── index.jsx                      # Trang chính
└── routes/
    └── index.jsx                          # Route configuration
```

## API Endpoints

### 1. Lấy danh sách logs
```
POST /api/change-statuslog/list-all
Body: ChangeStatusLogFilterRequestDTO
Params: page, size, sort
```

### 2. Lấy chi tiết log
```
GET /api/change-statuslog/{id}
```

### 3. Lấy thông tin source entity
```
GET /api/change-statuslog/{id}/source
```

## Cách sử dụng

### Truy cập trang
1. Đăng nhập vào hệ thống với quyền ADMIN
2. Vào menu "Lịch sử thay đổi" trong sidebar
3. Hoặc truy cập trực tiếp: `/change-status-log`

### Sử dụng bộ lọc
1. Click "Mở rộng" để hiển thị bộ lọc
2. Chọn các tiêu chí lọc mong muốn
3. Click "Áp dụng" để thực hiện lọc
4. Click "Xóa" để xóa tất cả bộ lọc

### Xem chi tiết
1. Click icon "👁️" trong cột "Thao tác" để xem chi tiết
2. Trong dialog chi tiết, có thể click "Xem nguồn" để chuyển đến đối tượng gốc

## Quyền truy cập
- Chỉ người dùng có role `ROLE_ADMIN` mới có thể truy cập trang này
- Được bảo vệ bởi `ProtectedRoute` component

## Responsive Design
- Hỗ trợ hiển thị trên desktop, tablet và mobile
- Bảng tự động điều chỉnh layout theo kích thước màn hình
- Bộ lọc có thể thu gọn/mở rộng để tiết kiệm không gian

## Tích hợp với hệ thống
- Sử dụng Material-UI components để đồng nhất với giao diện
- Tích hợp với hệ thống routing của React Router
- Sử dụng axios client đã cấu hình sẵn
- Hỗ trợ đa ngôn ngữ (hiện tại là tiếng Việt) 