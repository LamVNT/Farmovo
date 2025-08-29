# Hướng Dẫn Notification CRUD cho Customer, Product, Category và Zone

## Tổng quan

Đã thêm notification cho các thao tác CRUD (Create, Read, Update, Delete) của:
- **Customer** (Khách hàng)
- **Product** (Sản phẩm)
- **Category** (Danh mục)
- **Zone** (Khu vực)

## 1. Customer (Khách hàng)

### **Các Action đã được thêm Notification:**

#### **Tạo khách hàng mới (CREATE)**
```javascript
// Trong CustomerFormDialog.jsx
createCustomerNotification('create', form.name);
// Kết quả: "Đã tạo khách hàng: [tên khách hàng] bởi [tên user]"
```

#### **Cập nhật khách hàng (UPDATE)**
```javascript
// Trong CustomerFormDialog.jsx
createCustomerNotification('update', form.name);
// Kết quả: "Đã cập nhật khách hàng: [tên khách hàng] bởi [tên user]"
```

#### **Xóa khách hàng (DELETE)**
```javascript
// Trong index.jsx (Customer Management Page)
createCustomerNotification('delete', customerToDelete.name);
// Kết quả: "Đã xóa khách hàng: [tên khách hàng] bởi [tên user]"
```

### **Files đã được cập nhật:**
- `frontend/src/pages/customer/index.jsx`
- `frontend/src/components/customer/CustomerFormDialog.jsx`

---

## 2. Product (Sản phẩm)

### **Các Action đã được thêm Notification:**

#### **Tạo sản phẩm mới (CREATE)**
```javascript
// Trong index.jsx (Product Management Page)
createProductNotification('create', submitData.productName);
// Kết quả: "Đã tạo sản phẩm: [tên sản phẩm] bởi [tên user]"
```

#### **Cập nhật sản phẩm (UPDATE)**
```javascript
// Trong index.jsx (Product Management Page)
createProductNotification('update', submitData.productName);
// Kết quả: "Đã cập nhật sản phẩm: [tên sản phẩm] bởi [tên user]"
```

#### **Xóa sản phẩm (DELETE)**
```javascript
// Trong index.jsx (Product Management Page)
createProductNotification('delete', productToDelete.productName);
// Kết quả: "Đã xóa sản phẩm: [tên sản phẩm] bởi [tên user]"
```

### **Files đã được cập nhật:**
- `frontend/src/pages/product/index.jsx`

---

## 3. Category (Danh mục)

### **Các Action đã được thêm Notification:**

#### **Tạo danh mục mới (CREATE)**
```javascript
// Trong index.jsx (Category Management Page)
createCategoryNotification('create', form.name);
// Kết quả: "Đã tạo danh mục: [tên danh mục] bởi [tên user]"
```

#### **Cập nhật danh mục (UPDATE)**
```javascript
// Trong index.jsx (Category Management Page)
createCategoryNotification('update', form.name);
// Kết quả: "Đã cập nhật danh mục: [tên danh mục] bởi [tên user]"
```

#### **Xóa danh mục (DELETE)**
```javascript
// Trong index.jsx (Category Management Page)
createCategoryNotification('delete', categoryName);
// Kết quả: "Đã xóa danh mục: [tên danh mục] bởi [tên user]"
```

### **Files đã được cập nhật:**
- `frontend/src/pages/category/index.jsx`

---

## 4. Zone (Khu vực)

### **Các Action đã được thêm Notification:**

#### **Tạo khu vực mới (CREATE)**
```javascript
// Trong index.jsx (Zone Management Page)
createZoneNotification('create', submitForm.zoneName);
// Kết quả: "Đã tạo khu vực: [tên khu vực] bởi [tên user]"
```

#### **Cập nhật khu vực (UPDATE)**
```javascript
// Trong index.jsx (Zone Management Page)
createZoneNotification('update', submitForm.zoneName);
// Kết quả: "Đã cập nhật khu vực: [tên khu vực] bởi [tên user]"
```

#### **Xóa khu vực (DELETE)**
```javascript
// Trong index.jsx (Zone Management Page)
createZoneNotification('delete', zoneToDelete.zoneName);
// Kết quả: "Đã xóa khu vực: [tên khu vực] bởi [tên user]"
```

### **Files đã được cập nhật:**
- `frontend/src/pages/zone/index.jsx`

---

## 5. Backend Implementation

### **NotificationService Interface:**
```java
// Thêm các method mới
void createCategoryNotification(String action, String categoryName, Long storeId, Long userId);
void createZoneNotification(String action, String zoneName, Long storeId, Long userId);
```

### **NotificationServiceImpl:**
```java
@Override
public void createCategoryNotification(String action, String categoryName, Long storeId, Long userId) {
    // Logic tạo notification cho category
}

@Override
public void createZoneNotification(String action, String zoneName, Long storeId, Long userId) {
    // Logic tạo notification cho zone
}
```

### **NotificationController:**
```java
@PostMapping("/category")
public ResponseEntity<Map<String, Object>> createCategoryNotification(@RequestBody Map<String, Object> request)

@PostMapping("/zone")
public ResponseEntity<Map<String, Object>> createZoneNotification(@RequestBody Map<String, Object> request)
```

---

## 6. Frontend Implementation

### **NotificationContext:**
```javascript
const createCategoryNotification = useCallback(async (action, categoryName) => {
    // Logic tạo notification cho category
}, [user, selectedStore, loadNotifications]);

const createZoneNotification = useCallback(async (action, zoneName) => {
    // Logic tạo notification cho zone
}, [user, selectedStore, loadNotifications]);
```

### **notificationService.js:**
```javascript
createCategoryNotification: async (action, categoryName, storeId, userId) => {
    // API call đến backend
},

createZoneNotification: async (action, zoneName, storeId, userId) => {
    // API call đến backend
}
```

---

## 7. Kết quả hiển thị

### **Customer:**
```
✅ "Đã tạo khách hàng: Nguyễn Văn A bởi [tên user]"
✅ "Đã cập nhật khách hàng: Nguyễn Văn A bởi [tên user]"
✅ "Đã xóa khách hàng: Nguyễn Văn A bởi [tên user]"
```

### **Product:**
```
✅ "Đã tạo sản phẩm: Gạo ST25 bởi [tên user]"
✅ "Đã cập nhật sản phẩm: Gạo ST25 bởi [tên user]"
✅ "Đã xóa sản phẩm: Gạo ST25 bởi [tên user]"
```

### **Category:**
```
✅ "Đã tạo danh mục: Thực phẩm bởi [tên user]"
✅ "Đã cập nhật danh mục: Thực phẩm bởi [tên user]"
✅ "Đã xóa danh mục: Thực phẩm bởi [tên user]"
```

### **Zone:**
```
✅ "Đã tạo khu vực: Khu A bởi [tên user]"
✅ "Đã cập nhật khu vực: Khu A bởi [tên user]"
✅ "Đã xóa khu vực: Khu A bởi [tên user]"
```

---

## 8. Bảng Mapping Action

| **Action** | **Tiếng Việt** | **Icon** | **Màu sắc** |
|------------|----------------|----------|--------------|
| `create` | **tạo** | ✅ | Xanh lá (SUCCESS) |
| `update` | **cập nhật** | ℹ️ | Xanh dương (INFO) |
| `delete` | **xóa** | ⚠️ | Vàng (WARNING) |

---

## 9. Lưu ý quan trọng

### **Backend:**
- Cần restart backend để áp dụng thay đổi
- Đảm bảo database có bảng notifications
- Kiểm tra log để debug nếu có lỗi

### **Frontend:**
- Cần refresh frontend để sử dụng logic mới
- Đảm bảo user đã đăng nhập và có selectedStore
- Kiểm tra console browser để debug nếu có lỗi

### **Database:**
- Notification sẽ được lưu vào bảng `notifications`
- Mỗi notification sẽ có `category` tương ứng (CUSTOMER, PRODUCT, CATEGORY, ZONE)
- Mỗi notification sẽ có `type` dựa trên action (SUCCESS, INFO, WARNING)

---

## 10. Cách Test

### **Customer:**
1. Vào trang "Quản lý khách hàng"
2. Thêm khách hàng mới → Kiểm tra notification
3. Sửa thông tin khách hàng → Kiểm tra notification
4. Xóa khách hàng → Kiểm tra notification

### **Product:**
1. Vào trang "Quản lý sản phẩm"
2. Thêm sản phẩm mới → Kiểm tra notification
3. Sửa thông tin sản phẩm → Kiểm tra notification
4. Xóa sản phẩm → Kiểm tra notification

### **Category:**
1. Vào trang "Quản lý danh mục"
2. Thêm danh mục mới → Kiểm tra notification
3. Sửa tên danh mục → Kiểm tra notification
4. Xóa danh mục → Kiểm tra notification

### **Zone:**
1. Vào trang "Quản lý khu vực"
2. Thêm khu vực mới → Kiểm tra notification
3. Sửa thông tin khu vực → Kiểm tra notification
4. Xóa khu vực → Kiểm tra notification

---

## 11. Troubleshooting

### **Notification không hiển thị:**
- Kiểm tra console browser
- Kiểm tra log backend
- Đảm bảo user đã đăng nhập
- Đảm bảo có selectedStore

### **Lỗi 500:**
- Kiểm tra log backend
- Đảm bảo database có bảng notifications
- Kiểm tra các field bắt buộc

### **Icon không thay đổi:**
- Kiểm tra action parameter có đúng không
- Kiểm tra logic mapping trong NotificationContext

---

## 12. Bước tiếp theo

1. ✅ **Đã thêm notification cho Customer CRUD**
2. ✅ **Đã thêm notification cho Product CRUD**
3. ✅ **Đã thêm notification cho Category CRUD**
4. ✅ **Đã thêm notification cho Zone CRUD**
5. **Test tất cả các action** để đảm bảo notification hoạt động đúng
6. **Restart backend** để áp dụng thay đổi
7. **Refresh frontend** để sử dụng logic mới

---

## 13. So sánh với các Entity khác

| **Entity** | **Status Change** | **Create** | **Update** | **Delete** |
|------------|-------------------|------------|------------|------------|
| **Import Transaction** | ✅ Đã có | ✅ Đã có | ❌ Chưa có | ✅ Đã có |
| **Sale Transaction** | ✅ Đã có | ✅ Đã có | ❌ Chưa có | ✅ Đã có |
| **Customer** | ❌ Chưa có | ✅ Đã có | ✅ Đã có | ✅ Đã có |
| **Product** | ❌ Chưa có | ✅ Đã có | ✅ Đã có | ✅ Đã có |
| **Category** | ❌ Chưa có | ✅ Đã có | ✅ Đã có | ✅ Đã có |
| **Zone** | ❌ Chưa có | ✅ Đã có | ✅ Đã có | ✅ Đã có |

---

**Tài liệu này đã được cập nhật lần cuối:** [Ngày hiện tại]
**Phiên bản:** 1.0
**Trạng thái:** Hoàn thành ✅
