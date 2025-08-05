# Sample Data for Farmovo Project

This directory contains sample data for the Farmovo project database.

## Files

- `sample_data.sql` - Complete SQL script with sample data for all models
- `SAMPLE_DATA_README.md` - This documentation file

## Database Structure

The sample data includes 5 rows for each of the following models:

### Core Models
1. **Authorities** - Only ROLE_ADMIN and ROLE_STAFF roles
2. **Stores** - 5 different Farmovo store locations
3. **Categories** - Product categories (Vegetables, Dairy, Meat, Grains, Fruits)
4. **Customers** - Mix of regular customers and suppliers
5. **Zones** - Storage zones within stores
6. **Users** - Staff accounts with password "123" for all users

### Transaction Models
7. **Products** - Sample products with codes, names, and quantities
8. **Import Transactions** - Product import records from suppliers
9. **Import Transaction Details** - Detailed import line items
10. **Sale Transactions** - Customer purchase records
11. **Stocktakes** - Inventory counting records
12. **Stocktake Details** - Detailed stocktake line items

### Financial Models
13. **Debt Notes** - Customer debt records
14. **Change Status Logs** - Audit trail for status changes

### Utility Models
15. **Forgot Password** - Password reset OTP records

## User Accounts

All users have the password "123" (BCrypt encoded). Available accounts:

| Username | Role | Store | Email |
|----------|------|-------|-------|
| admin | ROLE_ADMIN | Main Store | admin@farmovo.com |
| staff1 | ROLE_STAFF | Main Store | staff1@farmovo.com |
| staff2 | ROLE_STAFF | North Branch | staff2@farmovo.com |
| manager | ROLE_STAFF | South Branch | manager@farmovo.com |
| cashier | ROLE_STAFF | Central Branch | cashier@farmovo.com |

## How to Use

### Option 1: Run the complete script
```sql
-- Execute the entire sample_data.sql file
\i sample_data.sql
```

### Option 2: Run sections individually
You can run specific sections of the script by copying and pasting them into your PostgreSQL client.

### Option 3: Clear existing data first (optional)
If you want to start fresh, uncomment the DELETE statements at the top of the script:

```sql
DELETE FROM debt_notes;
DELETE FROM stocktake_details;
DELETE FROM stocktakes;
DELETE FROM import_transaction_details;
DELETE FROM import_transactions;
DELETE FROM sale_transactions;
DELETE FROM products;
DELETE FROM zones;
DELETE FROM users;
DELETE FROM customers;
DELETE FROM categories;
DELETE FROM stores;
DELETE FROM authorities;
```

## Data Relationships

The sample data maintains proper relationships:

- Users are assigned to specific stores
- Products belong to categories and stores
- Import transactions link suppliers, staff, and stores
- Sale transactions link customers, staff, and stores
- Stocktakes are performed by staff at specific stores
- Debt notes are associated with customers and stores
- Zones are assigned to stores

## Notes

- All timestamps use `NOW()` for current date/time
- Monetary amounts are in VND (Vietnamese Dong)
- Product quantities are realistic for a retail environment
- Customer debt amounts reflect typical business scenarios
- All foreign key relationships are properly maintained

## Testing

After running the sample data, you can test the application with:

1. **Login**: Use any of the user accounts with password "123"
2. **Browse Products**: View the 5 sample products
3. **View Customers**: See customer and supplier data
4. **Check Transactions**: Review import and sale transactions
5. **Inventory**: Examine stocktake records

## Customization

You can modify the sample data by:
- Changing product names, prices, and quantities
- Adjusting customer information
- Modifying store details
- Adding more users or changing roles
- Updating transaction amounts and dates

Remember to maintain referential integrity when making changes. 