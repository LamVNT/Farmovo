# Setup Guide for Sample Data

## Problem Resolution

The error `LINE 1: ('PROD001', 'Fresh Tomatoes', 'Organic red tomatoes', 100, 1...` indicates that the database tables don't exist yet or there's a column mismatch.

## Step-by-Step Solution

### 1. First, Start Your Spring Boot Application

```bash
cd backend
mvn spring-boot:run
```

This will:
- Create the database tables automatically (using `ddl-auto: update`)
- Set up all the required columns and relationships

### 2. Wait for Application to Start

Make sure you see messages like:
```
Hibernate: create table authorities...
Hibernate: create table stores...
Hibernate: create table categories...
```

### 3. Run the Fixed Sample Data Script

Use the `sample_data_fixed.sql` file instead of the original:

```bash
# Connect to your PostgreSQL database
psql -h localhost -U admin -d farmovo

# Run the fixed script
\i sample_data_fixed.sql
```

Or if using pgAdmin:
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Load and execute `sample_data_fixed.sql`

### 4. Alternative: Use the Original Script

If you prefer to use the original `sample_data.sql`:

1. **First run your Spring Boot application** to create tables
2. **Then run the sample data script**

## Database Connection Details

Based on your `application.yml`:
- **Host**: localhost
- **Port**: 5432
- **Database**: farmovo
- **Username**: admin
- **Password**: 123123

## Verification

After running the script, verify the data was inserted:

```sql
-- Check if data exists
SELECT COUNT(*) FROM authorities;
SELECT COUNT(*) FROM stores;
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
```

You should see:
- `authorities`: 2 rows
- `stores`: 5 rows
- `categories`: 5 rows
- `customers`: 5 rows
- `users`: 5 rows
- `products`: 5 rows

## Common Issues and Solutions

### Issue 1: "Table doesn't exist"
**Solution**: Start your Spring Boot application first to create tables

### Issue 2: "Column doesn't exist"
**Solution**: Use the `sample_data_fixed.sql` which handles table existence checks

### Issue 3: "Sequence doesn't exist"
**Solution**: The fixed script includes sequence reset commands

### Issue 4: "Foreign key constraint violation"
**Solution**: The fixed script inserts data in the correct order to maintain relationships

## Testing the Setup

1. **Login to your application** with:
   - Username: `admin`
   - Password: `123`

2. **Check if data appears** in your frontend:
   - Products page should show 5 products
   - Customers page should show 5 customers
   - Users page should show 5 users

## If You Still Get Errors

1. **Check table structure**:
```sql
\d authorities
\d stores
\d categories
\d customers
\d users
\d products
```

2. **Check if tables exist**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

3. **Manual table creation** (if needed):
```sql
-- This should be done automatically by Spring Boot
-- Only use if you have issues with automatic creation
```

## Quick Fix Commands

If you need to start fresh:

```sql
-- Drop and recreate database (WARNING: This deletes everything)
DROP DATABASE IF EXISTS farmovo;
CREATE DATABASE farmovo;

-- Then restart your Spring Boot application
-- Then run the sample data script
``` 