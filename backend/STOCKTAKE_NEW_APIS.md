# Các API Mới Cho Chức Năng Stocktake

## 1. ImportTransactionDetailController (`/api/import-details`)

### 1.1. Lấy danh sách Zone có sản phẩm tồn kho
```
GET /api/import-details/zones-with-products
```
**Response:** `List<ZoneResponseDto>`
- Trả về danh sách Zone có sản phẩm còn tồn kho (remainQuantity > 0)

### 1.2. Lấy danh sách sản phẩm theo Zone
```
GET /api/import-details/products-by-zone?zoneId={zoneId}
```
**Parameters:**
- `zoneId` (String): ID của zone (ví dụ: "1", "2")

**Response:** `List<ProductResponseDto>`
- Trả về danh sách sản phẩm có trong zone đó với thông tin chi tiết

### 1.3. Lấy danh sách Zone của một sản phẩm
```
GET /api/import-details/zones-by-product?productId={productId}
```
**Parameters:**
- `productId` (Long): ID của sản phẩm

**Response:** `List<ZoneResponseDto>`
- Trả về danh sách Zone chứa sản phẩm đó

### 1.4. Lấy chi tiết sản phẩm theo Zone
```
GET /api/import-details/details-by-zone?zoneId={zoneId}
```
**Parameters:**
- `zoneId` (String): ID của zone

**Response:** `List<ZoneProductDetailDto>`
- Trả về chi tiết sản phẩm trong zone (bao gồm lô, hạn sử dụng)

### 1.5. Kiểm tra thiếu Zone khi kiểm kê
```
POST /api/import-details/check-missing-zones
```
**Request Body:** `List<StocktakeDetailDto>`
```json
[
  {
    "productId": 1,
    "zones_id": [1, 2],
    "remain": 100,
    "real": 95,
    "diff": -5,
    "note": "Thiếu 5 sản phẩm"
  }
]
```

**Response:** `List<MissingZoneDto>`
```json
[
  {
    "productId": 1,
    "productName": "Sản phẩm A",
    "missingZones": [
      {
        "id": 3,
        "zoneName": "Z_[1;3]",
        "zoneDescription": "Zone 1-3"
      }
    ],
    "checkedZones": [
      {
        "id": 1,
        "zoneName": "Z_[1;1]",
        "zoneDescription": "Zone 1-1"
      },
      {
        "id": 2,
        "zoneName": "Z_[1;2]",
        "zoneDescription": "Zone 1-2"
      }
    ],
    "totalRemainQuantity": 150
  }
]
```

## 2. StocktakeController (`/api/stocktakes`) - API Hỗ Trợ

### 2.1. Lấy danh sách Zone có sản phẩm tồn kho
```
GET /api/stocktakes/zones-with-products
```
**Response:** `List<ZoneResponseDto>`
- Tương tự như API 1.1

### 2.2. Lấy danh sách sản phẩm theo Zone
```
GET /api/stocktakes/products-by-zone?zoneId={zoneId}
```
**Response:** `List<ProductResponseDto>`
- Tương tự như API 1.2

### 2.3. Kiểm tra thiếu Zone khi kiểm kê
```
POST /api/stocktakes/check-missing-zones
```
**Response:** `List<MissingZoneDto>`
- Tương tự như API 1.5

## 3. Các DTO Mới

### 3.1. ZoneProductDetailDto
```java
{
  "importDetailId": 1,
  "productId": 1,
  "productName": "Sản phẩm A",
  "remainQuantity": 50,
  "expireDate": "2024-12-31T23:59:59",
  "zonesId": [1, 2],
  "zonesIdJson": "[1,2]"
}
```

### 3.2. MissingZoneDto
```java
{
  "productId": 1,
  "productName": "Sản phẩm A",
  "missingZones": [...], // Zones chưa kiểm kê
  "checkedZones": [...], // Zones đã kiểm kê
  "totalRemainQuantity": 150
}
```

## 4. Cách Sử Dụng

### 4.1. Flow tạo Stocktake mới:
1. Gọi `GET /api/stocktakes/zones-with-products` để lấy danh sách Zone có sản phẩm
2. Chọn Zone → Gọi `GET /api/stocktakes/products-by-zone?zoneId={zoneId}` để lấy sản phẩm
3. Nhập số lượng thực tế cho từng sản phẩm
4. Trước khi lưu → Gọi `POST /api/stocktakes/check-missing-zones` để kiểm tra thiếu Zone
5. Nếu có cảnh báo → Hiển thị cho user và cho phép bổ sung hoặc tiếp tục
6. Lưu Stocktake

### 4.2. Flow cập nhật Stocktake:
1. Load dữ liệu Stocktake hiện tại
2. Thực hiện tương tự như tạo mới
3. Gọi `PUT /api/stocktakes/{id}` để cập nhật

## 5. Lưu Ý Kỹ Thuật

- `zones_id` trong ImportTransactionDetail được lưu dưới dạng JSON string (ví dụ: "[1,2,3]")
- Có xử lý fallback cho trường hợp `zones_id` không phải JSON array
- Tất cả API đều chỉ trả về sản phẩm có `remainQuantity > 0`
- Logic kiểm tra thiếu Zone so sánh giữa zones thực tế và zones đã kiểm kê 