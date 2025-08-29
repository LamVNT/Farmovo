# Hướng Dẫn Notification cho Sale Transaction

## Cách sử dụng

### 1. Import Hook

```javascript
import { useNotification } from "../../contexts/NotificationContext";

const SaleTransactionPage = () => {
    const { createSaleTransactionNotification } = useNotification();
    // ... rest of component
};
```

### 2. Các Action đã được thêm Notification

#### **Tạo phiếu mới (CREATE)**
```javascript
// Tạo phiếu hoàn thành
createSaleTransactionNotification('create', transactionName, 'completed');
// Kết quả: "Đã tạo phiếu bán hàng: PB000044 bởi [tên user]"

// Tạo phiếu nháp
createSaleTransactionNotification('create', transactionName, 'draft');
// Kết quả: "Đã tạo phiếu bán hàng: PB000044 bởi [tên user]"

// Tạo phiếu cân bằng
createSaleTransactionNotification('create', transactionName, 'waiting_for_approve');
// Kết quả: "Đã tạo phiếu bán hàng: PCB000045 bởi [tên user]"
```

#### **Mở phiếu (DRAFT → WAITING_FOR_APPROVE)**
```javascript
createSaleTransactionNotification('status_change', transactionName, 'waiting_for_approve');
// Kết quả: "Đã chuyển trạng thái chờ xác nhận phiếu bán hàng: PB000044 bởi [tên user]"
```

#### **Đóng phiếu (WAITING_FOR_APPROVE → DRAFT)**
```javascript
createSaleTransactionNotification('status_change', transactionName, 'draft');
// Kết quả: "Đã chuyển trạng thái nháp phiếu bán hàng: PB000044 bởi [tên user]"
```

#### **Hoàn thành phiếu (DRAFT/WAITING_FOR_APPROVE → COMPLETED)**
```javascript
createSaleTransactionNotification('complete', transactionName, 'completed');
// Kết quả: "Đã hoàn thành phiếu bán hàng: PB000044 bởi [tên user]"
```

#### **Hủy phiếu (DRAFT/WAITING_FOR_APPROVE → CANCELLED)**
```javascript
createSaleTransactionNotification('cancel', transactionName, 'cancelled');
// Kết quả: "Đã chuyển trạng thái hủy phiếu bán hàng: PB000044 bởi [tên user]"
```

#### **Xóa phiếu (DELETE)**
```javascript
// Xóa phiếu đơn lẻ
createSaleTransactionNotification('delete', transactionName, 'deleted');
// Kết quả: "Đã xóa phiếu bán hàng: PB000044 bởi [tên user]"

// Xóa hàng loạt (tự động gọi cho từng phiếu)
// Không cần gọi thủ công, hệ thống tự động tạo notification
```

### 3. Các Handler Function đã được cập nhật

#### **Trong `index.jsx` (Sale Transaction List):**
- ✅ `handleOpenTransaction()` - Mở phiếu từ DRAFT
- ✅ `handleCloseTransaction()` - Đóng phiếu về DRAFT
- ✅ `handleComplete()` - Hoàn thành phiếu
- ✅ `handleCancel()` - Hủy phiếu
- ✅ `handleCloseTransactionMenu()` - Đóng phiếu từ menu
- ✅ `handleCompleteDraftTransactionMenu()` - Hoàn thành phiếu nháp
- ✅ `handleCompleteTransactionMenu()` - Hoàn thành phiếu chờ xác nhận
- ✅ `handleCancelTransactionMenu()` - Hủy phiếu từ menu
- ✅ `handleDelete()` - Xóa phiếu đơn lẻ
- ✅ `handleBulkDelete()` - Xóa phiếu hàng loạt

#### **Trong `useSaleTransaction.js` (Add/Edit Sale Page):**
- ✅ `handleConfirmSummary()` - Tạo phiếu mới (DRAFT/COMPLETE)
- ✅ `handleConfirmSummary()` - Tạo phiếu cân bằng (DRAFT/COMPLETE)

### 4. Bảng Mapping Trạng thái

| **Trạng thái Backend** | **Tiếng Việt** | **Ví dụ** |
|------------------------|----------------|------------|
| `draft` | **chuyển trạng thái nháp** | "Đã chuyển trạng thái nháp phiếu bán hàng: PB000044" |
| `waiting_for_approve` | **chuyển trạng thái chờ xác nhận** | "Đã chuyển trạng thái chờ xác nhận phiếu bán hàng: PB000044" |
| `completed` | **hoàn thành** | "Đã hoàn thành phiếu bán hàng: PB000044" |
| `cancelled` | **chuyển trạng thái hủy** | "Đã chuyển trạng thái hủy phiếu bán hàng: PB000044" |
| `open` / `opened` | **chuyển trạng thái mở** | "Đã chuyển trạng thái mở phiếu bán hàng: PB000044" |
| `closed` / `close` | **chuyển trạng thái đóng** | "Đã chuyển trạng thái đóng phiếu bán hàng: PB000044" |
| `deleted` | **xóa** | "Đã xóa phiếu bán hàng: PB000044" |

### 5. Bảng Mapping Action

| **Action** | **Tiếng Việt** | **Ví dụ** |
|------------|----------------|------------|
| `create` | **tạo** | "Đã tạo phiếu bán hàng: PB000044" |
| `delete` | **xóa** | "Đã xóa phiếu bán hàng: PB000044" |
| `update` | **cập nhật** | "Đã cập nhật phiếu bán hàng: PB000044" |
| `complete` | **hoàn thành** | "Đã hoàn thành phiếu bán hàng: PB000044" |
| `cancel` | **chuyển trạng thái hủy** | "Đã chuyển trạng thái hủy phiếu bán hàng: PB000044" |
| `status_change` | **chuyển trạng thái [trạng thái]** | "Đã chuyển trạng thái nháp phiếu bán hàng: PB000044" |

### 6. Kết quả hiển thị

**Trước đây:**
```
Không có notification
```

**Bây giờ:**
```
✅ "Đã tạo phiếu bán hàng: PB000044 bởi [tên user]"
✅ "Đã chuyển trạng thái chờ xác nhận phiếu bán hàng: PB000044 bởi [tên user]"
✅ "Đã chuyển trạng thái nháp phiếu bán hàng: PB000044 bởi [tên user]"
✅ "Đã hoàn thành phiếu bán hàng: PB000044 bởi [tên user]"
✅ "Đã chuyển trạng thái hủy phiếu bán hàng: PB000044 bởi [tên user]"
✅ "Đã xóa phiếu bán hàng: PB000044 bởi [tên user]"
```

### 7. Lưu ý

- **Backend cần restart** để áp dụng thay đổi
- **Frontend cần refresh** để sử dụng logic mới
- Tất cả notification về thay đổi trạng thái sẽ hiển thị format mới với "chuyển trạng thái" rõ ràng
- Icon và màu sắc sẽ thay đổi theo loại thao tác
- Notification sẽ được lưu vào database và hiển thị real-time

### 8. So sánh với Import Transaction

| **Feature** | **Import Transaction** | **Sale Transaction** |
|-------------|------------------------|----------------------|
| **Status Change** | ✅ Đã có | ✅ Đã có |
| **Create** | ✅ Đã có | ✅ Đã có |
| **Complete** | ✅ Đã có | ✅ Đã có |
| **Cancel** | ✅ Đã có | ✅ Đã có |
| **Delete** | ✅ Đã có | ✅ Đã có |

### 9. Bước tiếp theo

1. ✅ **Đã thêm notification cho việc tạo phiếu mới** trong `useSaleTransaction.js`
2. ✅ **Đã thêm notification cho việc xóa phiếu** trong `index.jsx`
3. **Test tất cả các action** để đảm bảo notification hoạt động đúng
4. **Restart backend** để áp dụng thay đổi
5. **Refresh frontend** để sử dụng logic mới

### 10. Cách Test

1. **Tạo phiếu mới**: Vào trang "Bán hàng" → Tạo phiếu mới → Hoàn thành
2. **Thay đổi trạng thái**: Vào danh sách phiếu → Thực hiện các action (mở, đóng, hoàn thành, hủy)
3. **Xóa phiếu**: Vào danh sách phiếu → Xóa phiếu đơn lẻ hoặc hàng loạt
4. **Kiểm tra notification**: Nhìn vào icon notification ở header → Xem danh sách notification

### 11. Troubleshooting

- **Notification không hiển thị**: Kiểm tra console browser, restart backend
- **Lỗi 500**: Kiểm tra log backend, đảm bảo database có bảng notifications
- **Icon không thay đổi**: Kiểm tra action và newStatus parameter có đúng không
