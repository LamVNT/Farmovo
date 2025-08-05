# Use Case Specification: Store Management

## 1. Overview
The Store Management system allows administrators to create, view, update, and delete store information in the Farmovo system. Each store can contain multiple products, import/export transactions, inventory checks, and other system components.

## 2. Actors
- **Admin**: System administrator with full access to store management functionality
- **User**: Regular user who can view store information

## 3. Use Cases

### 3.1 UC-STM-001: View Store List
**Description**: Admin can view a list of all stores in the system

**Primary Actor**: Admin

**Preconditions**: 
- Admin is logged into the system
- There is at least one store in the system

**Main Flow**:
1. Admin accesses the Store Management page
2. System displays a list of all stores with information:
   - Serial Number
   - Store Name
   - Address
   - Description
   - Action buttons (Edit, Delete)
3. System supports pagination with options: 5, 10, 25, 50, 100 records/page
4. Admin can search stores by name

**Postconditions**: 
- Store list is displayed successfully
- Information is sorted by creation order

**Alternative Flows**:
- If no stores exist: Display "No data" message
- If there's an error: Display error message

### 3.2 UC-STM-002: Search Store
**Description**: Admin can search for stores by name

**Primary Actor**: Admin

**Preconditions**: 
- Admin has accessed the Store Management page
- There is store data in the system

**Main Flow**:
1. Admin enters search keyword in the search box
2. System performs real-time search by store name
3. Search results are displayed immediately
4. Search is case-insensitive

**Postconditions**: 
- Store list is filtered by search keyword

**Alternative Flows**:
- If no results found: Display "No stores found" message
- If search keyword is cleared: Display the complete list again

### 3.3 UC-STM-003: Add New Store
**Description**: Admin can create a new store in the system

**Primary Actor**: Admin

**Preconditions**: 
- Admin is logged into the system
- Admin has permission to create stores

**Main Flow**:
1. Admin clicks "Add New" button (+)
2. System displays add store dialog form
3. Admin enters information:
   - Store Name (required)
   - Address (required)
   - Description (optional)
4. Admin clicks "Add New"
5. System validates data
6. System saves store information
7. Dialog closes
8. Store list is updated

**Postconditions**: 
- New store is created successfully
- Information is saved to database
- Store list is refreshed

**Alternative Flows**:
- If store name already exists: Display error message "Store name already exists"
- If required information is missing: Display validation error message
- If system error occurs: Display general error message

### 3.4 UC-STM-004: Edit Store
**Description**: Admin can update information of an existing store

**Primary Actor**: Admin

**Preconditions**: 
- Admin has accessed the Store Management page
- There is at least one store in the list
- Admin has permission to edit stores

**Main Flow**:
1. Admin clicks "Edit" button (Edit icon) of the store to be modified
2. System displays dialog form with current store information
3. Admin modifies information:
   - Store Name (required)
   - Address (required)
   - Description (optional)
4. Admin clicks "Update"
5. System validates data
6. System updates store information
7. Dialog closes
8. Store list is updated

**Postconditions**: 
- Store information is updated successfully
- Data is saved to database
- Store list is refreshed

**Alternative Flows**:
- If new store name already exists (different ID): Display error message
- If required information is missing: Display validation error message
- If store doesn't exist: Display error message "Store not found"

### 3.5 UC-STM-005: Delete Store
**Description**: Admin can delete a store from the system

**Primary Actor**: Admin

**Preconditions**: 
- Admin has accessed the Store Management page
- There is at least one store in the list
- Admin has permission to delete stores

**Main Flow**:
1. Admin clicks "Delete" button (Delete icon) of the store to be deleted
2. System displays delete confirmation dialog
3. Admin confirms deletion
4. System checks constraints (related products, transactions, etc.)
5. System deletes the store
6. Confirmation dialog closes
7. Store list is updated

**Postconditions**: 
- Store is successfully deleted from the system
- Data is updated in database
- Store list is refreshed

**Alternative Flows**:
- If data constraints exist: Display message "Cannot delete store with related data"
- If store doesn't exist: Display error message "Store not found"
- If Admin cancels deletion: Dialog closes, no changes made

### 3.6 UC-STM-006: View Store Details
**Description**: Admin can view detailed information of a store

**Primary Actor**: Admin

**Preconditions**: 
- Admin has accessed the Store Management page
- There is at least one store in the list

**Main Flow**:
1. Admin clicks on store name in the list
2. System displays detailed store information:
   - Store ID
   - Store Name
   - Address
   - Description
   - Creation Date
   - Update Date
   - Created By

**Postconditions**: 
- Detailed store information is displayed

**Alternative Flows**:
- If store doesn't exist: Display error message "Store not found"

## 4. Data Structure

### 4.1 Store Entity
```java
@Entity
@Table(name = "stores")
public class Store extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "store_name", nullable = false, unique = true)
    private String storeName;
    
    @Column(name = "store_description")
    private String storeDescription;
    
    @Column(name = "store_address")
    private String storeAddress;
    
    // Relationships
    @OneToMany(mappedBy = "store")
    private List<Product> products;
    
    @OneToMany(mappedBy = "store")
    private List<ImportTransaction> importTransactions;
    
    @OneToMany(mappedBy = "store")
    private List<SaleTransaction> saleTransactions;
    
    @OneToMany(mappedBy = "store")
    private List<Stocktake> stocktakes;
    
    @OneToMany(mappedBy = "store")
    private List<DebtNote> debtNotes;
    
    @OneToMany(mappedBy = "store")
    private List<User> users;
    
    @OneToMany(mappedBy = "store")
    private List<Zone> zones;
}
```

### 4.2 StoreRequestDto
```java
public class StoreRequestDto {
    private Long id;
    private String storeName;
    private String storeDescription;
    private String storeAddress;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}
```

### 4.3 StoreResponseDto
```java
public class StoreResponseDto {
    private Long id;
    private String storeName;
    private String storeDescription;
    private String storeAddress;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}
```

## 5. API Endpoints

### 5.1 Get Store List
- **URL**: `GET /api/admin/storeList`
- **Description**: Get all stores in the system
- **Response**: `List<StoreResponseDto>`

### 5.2 Get Store by ID
- **URL**: `GET /api/store/{id}`
- **Description**: Get detailed store information by ID
- **Response**: `StoreResponseDto`

### 5.3 Create New Store
- **URL**: `POST /api/store`
- **Description**: Create a new store
- **Request Body**: `StoreRequestDto`
- **Response**: `StoreResponseDto`

### 5.4 Update Store
- **URL**: `PUT /api/store/{id}`
- **Description**: Update store information
- **Request Body**: `StoreRequestDto`
- **Response**: `StoreResponseDto`

### 5.5 Delete Store
- **URL**: `DELETE /api/store/{id}`
- **Description**: Delete store by ID
- **Response**: `200 OK` or `404 Not Found`

## 6. Business Rules

### 6.1 Validation Rules
- Store name is required and cannot be empty
- Store name must be unique in the system
- Store address is required
- Store description is optional

### 6.2 Authorization Rules
- Only Admin can create, edit, delete stores
- Regular users can only view store list

### 6.3 Data Integrity Rules
- Cannot delete store if there are related products, transactions, inventory checks, or other data
- When deleting a store, all related data must be handled first

## 7. Error Handling

### 7.1 Validation Errors
- **400 Bad Request**: Invalid input data
- **409 Conflict**: Store name already exists

### 7.2 Authorization Errors
- **401 Unauthorized**: Not logged in
- **403 Forbidden**: No access permission

### 7.3 Resource Errors
- **404 Not Found**: Store not found
- **500 Internal Server Error**: System error

## 8. UI/UX Requirements

### 8.1 Layout
- Use Material-UI DataGrid for list display
- Dialog form for add/edit store
- Responsive design for different devices

### 8.2 User Experience
- Real-time search
- Pagination with multiple options
- Clear success/error notifications
- Confirmation before deletion
- Loading states for operations

### 8.3 Accessibility
- Keyboard navigation support
- Alt text for icons
- Appropriate contrast ratio
- Screen reader friendly

## 9. Performance Requirements

### 9.1 Response Time
- Load store list: < 2 seconds
- Search: < 1 second
- Add/edit/delete: < 3 seconds

### 9.2 Scalability
- Support minimum 1000 stores
- Pagination for large lists
- Caching for frequently accessed data

## 10. Security Requirements

### 10.1 Authentication
- Login required for all operations
- JWT token validation

### 10.2 Authorization
- Role-based access control
- Admin role required for CRUD operations

### 10.3 Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection

## 11. Testing Requirements

### 11.1 Unit Tests
- Service layer testing
- Repository layer testing
- Validation testing

### 11.2 Integration Tests
- API endpoint testing
- Database integration testing

### 11.3 UI Tests
- Component testing
- User interaction testing
- Responsive design testing

## 12. Deployment Requirements

### 12.1 Environment
- Java 17+
- Spring Boot 3.x
- React 18+
- PostgreSQL database

### 12.2 Configuration
- Database connection settings
- JWT secret configuration
- CORS configuration
- Logging configuration

## 13. Maintenance and Support

### 13.1 Monitoring
- Application performance monitoring
- Error tracking and logging
- Database performance monitoring

### 13.2 Backup
- Database backup strategy
- Configuration backup
- Log file management

### 13.3 Documentation
- API documentation
- User manual
- Technical documentation 