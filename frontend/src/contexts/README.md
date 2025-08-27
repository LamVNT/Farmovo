# StoreSelectionContext Documentation

## Tổng quan

`StoreSelectionContext` là một React Context được thiết kế để quản lý việc chọn kho hàng (store) một cách toàn cục trong ứng dụng, đặc biệt cho các trang liên quan đến stocktake và balance.

## Vấn đề giải quyết

- **Owner/Admin** cần chọn kho trước khi thực hiện các thao tác stocktake
- **Staff** tự động sử dụng kho được gán
- Đảm bảo sự đồng nhất store selection giữa các trang: Create → Detail → Balance
- Tránh việc phải chọn lại kho khi chuyển trang

## Cách sử dụng

### 1. Setup Provider (đã setup trong App.jsx)

```jsx
import { StoreSelectionProvider } from './contexts/StoreSelectionContext';

function App() {
    return (
        <StoreSelectionProvider>
            {/* Your app components */}
        </StoreSelectionProvider>
    );
}
```

### 2. Sử dụng Hook trong Component

```jsx
import { useStoreForStocktake } from '../hooks/useStoreForStocktake';

const MyComponent = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.roles?.[0];
    const storeForStocktake = useStoreForStocktake(user, userRole);
    
    // Kiểm tra validation
    const validation = storeForStocktake.validateStoreSelection();
    if (!validation.isValid) {
        console.log(validation.message);
    }
    
    // Lấy store ID cho API calls
    const storeId = storeForStocktake.getStoreIdForAPI();
    
    return (
        <div>
            {storeForStocktake.shouldShowStoreSelector() && (
                <StoreSelector
                    user={user}
                    userRole={userRole}
                    onStoreChange={(storeId, storeObj) => {
                        // Handle store change
                    }}
                />
            )}
        </div>
    );
};
```

### 3. Sử dụng StoreSelector Component

```jsx
import StoreSelector from '../components/stocktake/StoreSelector';

// Enhanced version (default)
<StoreSelector
    user={user}
    userRole={userRole}
    onStoreChange={(storeId, storeObj) => {
        console.log('Store changed:', storeId, storeObj);
    }}
/>

// Simple version
<StoreSelector
    user={user}
    userRole={userRole}
    variant="simple"
    size="small"
    onStoreChange={(storeId, storeObj) => {
        console.log('Store changed:', storeId, storeObj);
    }}
/>
```

## API Reference

### useStoreForStocktake Hook

#### Returns:
- `currentStoreId`: ID của store hiện tại
- `currentStore`: Object store hiện tại
- `needsStoreSelection`: Boolean - có cần chọn store không
- `selectedStore`: Store được chọn (cho Owner/Admin)
- `selectedStoreId`: ID của store được chọn
- `selectStore(storeObj)`: Function để chọn store
- `isStoreSelected()`: Boolean - đã chọn store chưa
- `shouldShowStoreSelector()`: Boolean - có hiển thị selector không
- `validateStoreSelection()`: Object - kết quả validation
- `getStoreIdForAPI()`: Store ID để dùng cho API calls
- `getStoreDisplayName()`: Tên store để hiển thị

### StoreSelector Component Props

- `user`: User object
- `userRole`: User role string
- `onStoreChange`: Callback khi store thay đổi
- `disabled`: Boolean - disable selector
- `size`: 'small' | 'medium' - kích thước
- `variant`: 'enhanced' | 'simple' - kiểu hiển thị

## Luồng hoạt động

1. **Owner/Admin Login**: Context khởi tạo với store = null
2. **Vào Create Page**: Hiển thị StoreSelector, chọn store
3. **Store được lưu**: Vào localStorage và context
4. **Tạo Stocktake**: Sử dụng store đã chọn
5. **Chuyển Detail**: Auto-sync store từ stocktake detail
6. **Click Balance**: Chuyển với store context
7. **Balance Page**: Tự động có store, không cần chọn lại

## Lưu trữ

- **localStorage**: `owner_selected_store_id`, `owner_selected_store`
- **Context State**: Sync với localStorage
- **Staff Store**: `staff_store_id` (riêng biệt)

## Role Logic

- **OWNER/ROLE_OWNER/ADMIN/ROLE_ADMIN**: Cần chọn store, sử dụng context
- **STAFF/ROLE_STAFF**: Tự động dùng store được gán, không cần chọn
- **Khác**: Cần chọn store

## Best Practices

1. Luôn validate store selection trước khi thực hiện API calls
2. Sử dụng `getStoreIdForAPI()` thay vì truy cập trực tiếp
3. Kiểm tra `shouldShowStoreSelector()` trước khi hiển thị selector
4. Sử dụng `validateStoreSelection()` cho validation UI
5. Auto-sync store từ detail khi có thể

## Troubleshooting

### Store bị mất khi refresh
- Kiểm tra localStorage có được lưu không
- Đảm bảo Provider được wrap đúng cách

### Staff không thấy store
- Kiểm tra `staff_store_id` trong localStorage
- Kiểm tra user.store object

### Validation failed
- Kiểm tra user role mapping
- Đảm bảo store được chọn trước khi validate
