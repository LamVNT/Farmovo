-- Sample Data for Farmovo Project
-- This script creates 5 rows of sample data for each model

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM debt_notes;
-- DELETE FROM stocktake_details;
-- DELETE FROM stocktakes;
-- DELETE FROM import_transaction_details;
-- DELETE FROM import_transactions;
-- DELETE FROM sale_transactions;
-- DELETE FROM products;
-- DELETE FROM zones;
-- DELETE FROM users;
-- DELETE FROM customers;
-- DELETE FROM categories;
-- DELETE FROM stores;
-- DELETE FROM authorities;

-- 1. AUTHORITIES (only ROLE_ADMIN and ROLE_STAFF)
INSERT INTO authorities (role, created_at, updated_at) VALUES
('ROLE_ADMIN', NOW(), NOW()),
('ROLE_STAFF', NOW(), NOW());

-- 2. STORES
INSERT INTO stores (store_name, store_description, store_address, created_at, updated_at) VALUES
('Farmovo Main Store', 'Main retail store for Farmovo products', '123 Main Street, Ho Chi Minh City', NOW(), NOW()),
('Farmovo North Branch', 'Northern branch specializing in fresh produce', '456 North Avenue, Hanoi', NOW(), NOW()),
('Farmovo South Branch', 'Southern branch with wide product variety', '789 South Road, Can Tho', NOW(), NOW()),
('Farmovo Central Branch', 'Central location for wholesale customers', '321 Central Boulevard, Da Nang', NOW(), NOW()),
('Farmovo Express Store', 'Quick service store for daily essentials', '654 Express Lane, Hai Phong', NOW(), NOW());

-- 3. CATEGORIES
INSERT INTO categories (category_name, category_description, created_at, updated_at) VALUES
('Fresh Vegetables', 'Fresh and organic vegetables from local farms', NOW(), NOW()),
('Dairy Products', 'Milk, cheese, yogurt and other dairy items', NOW(), NOW()),
('Meat & Poultry', 'Fresh meat, chicken, and other poultry products', NOW(), NOW()),
('Grains & Cereals', 'Rice, wheat, corn and other grain products', NOW(), NOW()),
('Fruits', 'Fresh fruits and dried fruits', NOW(), NOW());

-- 4. CUSTOMERS
INSERT INTO customers (customer_name, customer_email, customer_phone, customer_address, is_supplier, total_debt_amount, created_at, updated_at) VALUES
('Nguyen Van A', 'nguyenvana@email.com', '0901234567', '123 Customer Street, HCMC', false, 1500000.00, NOW(), NOW()),
('Tran Thi B', 'tranthib@email.com', '0901234568', '456 Customer Avenue, Hanoi', false, 2500000.00, NOW(), NOW()),
('Le Van C', 'levanc@email.com', '0901234569', '789 Customer Road, Da Nang', true, 0.00, NOW(), NOW()),
('Pham Thi D', 'phamthid@email.com', '0901234570', '321 Customer Lane, Can Tho', false, 800000.00, NOW(), NOW()),
('Hoang Van E', 'hoangvane@email.com', '0901234571', '654 Customer Boulevard, Hai Phong', true, 0.00, NOW(), NOW());

-- 5. ZONES
INSERT INTO zones (zone_name, zone_description, store_id, created_at, updated_at) VALUES
('Zone A - Fresh Produce', 'Area for fresh vegetables and fruits', 1, NOW(), NOW()),
('Zone B - Dairy Section', 'Refrigerated area for dairy products', 1, NOW(), NOW()),
('Zone C - Meat Section', 'Cold storage for meat and poultry', 2, NOW(), NOW()),
('Zone D - Grains Storage', 'Dry storage for grains and cereals', 3, NOW(), NOW()),
('Zone E - Express Items', 'Quick access area for daily essentials', 5, NOW(), NOW());

-- 6. USERS (password: 123 for all users)
INSERT INTO users (full_name, username, password, status, email, phone, store_id, created_at, updated_at) VALUES
('Admin User', 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', true, 'admin@farmovo.com', '0901234001', 1, NOW(), NOW()),
('Staff User 1', 'staff1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', true, 'staff1@farmovo.com', '0901234002', 1, NOW(), NOW()),
('Staff User 2', 'staff2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', true, 'staff2@farmovo.com', '0901234003', 2, NOW(), NOW()),
('Manager User', 'manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', true, 'manager@farmovo.com', '0901234004', 3, NOW(), NOW()),
('Cashier User', 'cashier', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', true, 'cashier@farmovo.com', '0901234005', 4, NOW(), NOW());

-- 7. USER AUTHORITIES (assigning roles to users)
INSERT INTO user_authorities (user_id, authority_id) VALUES
(1, 1), -- admin has ROLE_ADMIN
(2, 2), -- staff1 has ROLE_STAFF
(3, 2), -- staff2 has ROLE_STAFF
(4, 2), -- manager has ROLE_STAFF
(5, 2); -- cashier has ROLE_STAFF

-- 8. PRODUCTS
INSERT INTO products (product_code, product_name, product_description, product_quantity, category_id, store_id, created_at, updated_at) VALUES
('PROD001', 'Fresh Tomatoes', 'Organic red tomatoes', 100, 1, 1, NOW(), NOW()),
('PROD002', 'Whole Milk', 'Fresh whole milk 1L', 50, 2, 1, NOW(), NOW()),
('PROD003', 'Chicken Breast', 'Fresh chicken breast 500g', 30, 3, 2, NOW(), NOW()),
('PROD004', 'Jasmine Rice', 'Premium jasmine rice 5kg', 80, 4, 3, NOW(), NOW()),
('PROD005', 'Fresh Apples', 'Red apples from local farms', 75, 5, 1, NOW(), NOW());

-- 9. IMPORT TRANSACTIONS
INSERT INTO import_transactions (import_date, total_amount, supplier_id, staff_id, store_id, created_at, updated_at) VALUES
('2024-01-15 08:00:00', 5000000.00, 3, 2, 1, NOW(), NOW()),
('2024-01-16 09:00:00', 3000000.00, 5, 3, 2, NOW(), NOW()),
('2024-01-17 10:00:00', 4000000.00, 3, 4, 3, NOW(), NOW()),
('2024-01-18 11:00:00', 2500000.00, 5, 5, 4, NOW(), NOW()),
('2024-01-19 12:00:00', 3500000.00, 3, 2, 5, NOW(), NOW());

-- 10. IMPORT TRANSACTION DETAILS
INSERT INTO import_transaction_details (quantity, unit_price, product_id, import_transaction_id, created_at, updated_at) VALUES
(50, 20000.00, 1, 1, NOW(), NOW()),
(25, 40000.00, 2, 1, NOW(), NOW()),
(20, 60000.00, 3, 2, NOW(), NOW()),
(40, 25000.00, 4, 3, NOW(), NOW()),
(30, 30000.00, 5, 4, NOW(), NOW());

-- 11. SALE TRANSACTIONS
INSERT INTO sale_transactions (sale_date, total_amount, customer_id, staff_id, store_id, created_at, updated_at) VALUES
('2024-01-20 14:00:00', 150000.00, 1, 2, 1, NOW(), NOW()),
('2024-01-21 15:00:00', 200000.00, 2, 3, 2, NOW(), NOW()),
('2024-01-22 16:00:00', 180000.00, 4, 4, 3, NOW(), NOW()),
('2024-01-23 17:00:00', 120000.00, 1, 5, 4, NOW(), NOW()),
('2024-01-24 18:00:00', 250000.00, 2, 2, 5, NOW(), NOW());

-- 12. STOCKTAKES
INSERT INTO stocktakes (stocktake_date, total_quantity, staff_id, store_id, created_at, updated_at) VALUES
('2024-01-25 08:00:00', 500, 2, 1, NOW(), NOW()),
('2024-01-26 09:00:00', 300, 3, 2, NOW(), NOW()),
('2024-01-27 10:00:00', 400, 4, 3, NOW(), NOW()),
('2024-01-28 11:00:00', 250, 5, 4, NOW(), NOW()),
('2024-01-29 12:00:00', 350, 2, 5, NOW(), NOW());

-- 13. STOCKTAKE DETAILS
INSERT INTO stocktake_details (expected_quantity, actual_quantity, product_id, stocktake_id, created_at, updated_at) VALUES
(100, 95, 1, 1, NOW(), NOW()),
(50, 48, 2, 1, NOW(), NOW()),
(30, 28, 3, 2, NOW(), NOW()),
(80, 82, 4, 3, NOW(), NOW()),
(75, 73, 5, 4, NOW(), NOW());

-- 14. DEBT NOTES
INSERT INTO debt_notes (debt_amount, debt_date, debt_type, debt_description, debt_evidences, from_source, source_id, customer_id, store_id, created_at, updated_at) VALUES
(500000.00, '2024-01-15 10:00:00', 'PURCHASE', 'Debt from product purchase', 'Invoice #INV001', 'SALE_TRANSACTION', 1, 1, 1, NOW(), NOW()),
(800000.00, '2024-01-16 11:00:00', 'PURCHASE', 'Debt from bulk order', 'Invoice #INV002', 'SALE_TRANSACTION', 2, 2, 2, NOW(), NOW()),
(300000.00, '2024-01-17 12:00:00', 'PURCHASE', 'Debt from daily purchase', 'Invoice #INV003', 'SALE_TRANSACTION', 3, 4, 3, NOW(), NOW()),
(400000.00, '2024-01-18 13:00:00', 'PURCHASE', 'Debt from weekend shopping', 'Invoice #INV004', 'SALE_TRANSACTION', 4, 1, 4, NOW(), NOW()),
(600000.00, '2024-01-19 14:00:00', 'PURCHASE', 'Debt from special order', 'Invoice #INV005', 'SALE_TRANSACTION', 5, 2, 5, NOW(), NOW());

-- 15. CHANGE STATUS LOGS
INSERT INTO change_status_logs (entity_type, entity_id, old_status, new_status, change_reason, changed_by, created_at, updated_at) VALUES
('PRODUCT', 1, 'ACTIVE', 'INACTIVE', 'Out of stock', 2, NOW(), NOW()),
('CUSTOMER', 1, 'ACTIVE', 'SUSPENDED', 'Payment overdue', 3, NOW(), NOW()),
('USER', 2, 'ACTIVE', 'INACTIVE', 'Temporary leave', 1, NOW(), NOW()),
('STORE', 1, 'ACTIVE', 'MAINTENANCE', 'Scheduled maintenance', 4, NOW(), NOW()),
('IMPORT_TRANSACTION', 1, 'PENDING', 'COMPLETED', 'Items received', 5, NOW(), NOW());

-- 16. FORGOT PASSWORD (optional - for password reset functionality)
INSERT INTO forgot_password (otp, expiry_time, user_id, created_at, updated_at) VALUES
('123456', '2024-01-30 10:00:00', 1, NOW(), NOW()),
('234567', '2024-01-30 11:00:00', 2, NOW(), NOW()),
('345678', '2024-01-30 12:00:00', 3, NOW(), NOW()),
('456789', '2024-01-30 13:00:00', 4, NOW(), NOW()),
('567890', '2024-01-30 14:00:00', 5, NOW(), NOW());

-- Update product quantities based on import transactions
UPDATE products SET product_quantity = product_quantity + 50 WHERE id = 1;
UPDATE products SET product_quantity = product_quantity + 25 WHERE id = 2;
UPDATE products SET product_quantity = product_quantity + 20 WHERE id = 3;
UPDATE products SET product_quantity = product_quantity + 40 WHERE id = 4;
UPDATE products SET product_quantity = product_quantity + 30 WHERE id = 5;

-- Update customer total debt amounts based on debt notes
UPDATE customers SET total_debt_amount = (
    SELECT COALESCE(SUM(debt_amount), 0) 
    FROM debt_notes 
    WHERE customer_id = customers.id
) WHERE id IN (1, 2, 4);

COMMIT; 