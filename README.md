# 🚀 Farmovo - Egg Warehouse Management System

Welcome to **Farmovo**, a comprehensive Egg Warehouse Management System! This open-source project provides a powerful and flexible solution for managing egg warehouse operations, from inventory tracking to sales management and financial reporting.

## 📋 Introduction

The Farmovo system helps warehouse staff efficiently manage all aspects of egg warehouse operations. Whether you're tracking inventory, processing sales transactions, managing imports, or handling debt management, Farmovo provides a robust framework for comprehensive warehouse control and administration.

## ✨ Key Features

- **🔄 Dynamic Inventory Management**: Effortlessly track and manage egg inventory with real-time stock updates and automated stocktake processes
- **💰 Sales Transaction Management**: Create, view, and update sale transactions with support for customer management and payment processing
- **📦 Import Transaction Control**: Manage all goods entering the warehouse with detailed tracking and supplier management
- **📊 Comprehensive Reporting**: Generate detailed reports with Excel and PDF export capabilities for inventory, sales, and financial data
- **🔐 Role-Based Authorization**: Implement custom roles and permissions for users, ensuring secure access control across the system
- **📱 Responsive Web Interface**: Modern, mobile-friendly interface built with React and Material-UI for optimal user experience
- **🗄️ Robust Data Management**: Leverage PostgreSQL for reliable and efficient data storage with Spring Boot backend
- **📈 Real-time Analytics**: Dashboard with charts and visualizations for business insights and decision making

## 🛠️ Tech Stack

This project is built using the following technologies:

- **Java 21**: The primary programming language for the backend services
- **Spring Boot 3.5.0**: A powerful framework for building enterprise-grade backend applications
- **React 19**: A modern JavaScript library for building interactive user interfaces
- **Vite**: A fast build tool and development server for modern web development
- **PostgreSQL**: A reliable and efficient relational database management system
- **Material-UI**: A comprehensive React component library for beautiful, accessible interfaces
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development

## 📚 Documentation

For comprehensive instructions and guides on using Farmovo, check out our detailed documentation in the project files and API specifications.

## 🚀 Getting Started

To start using Farmovo, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Farmovo.git
cd Farmovo
```

### 2. Backend Setup
```bash
cd backend
# Ensure you have Java 21 and Maven installed
mvn clean install
mvn spring-boot:run
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Database Configuration
- Set up PostgreSQL database
- Configure database connection in `application-local.yml`
- Run database migrations if needed

## 🏗️ System Architecture

The Farmovo system consists of several key modules:

- **Dashboard**: Overview of warehouse operations with key metrics and charts
- **Inventory Management**: Stock tracking, stocktake processes, and balance management
- **Sales Management**: Customer management, sale transactions, and payment processing
- **Import Management**: Supplier management and goods import tracking
- **Debt Management**: Financial tracking and debt note management
- **User Management**: Staff accounts and role-based access control
- **Reporting**: Comprehensive data export and analytics

## 🔧 Configuration

The system supports multiple deployment configurations:
- `application-local.yml` - Local development
- `application-azure.yml` - Azure cloud deployment
- `application-prod.yml` - Production environment
- `application-azure-docker.yml` - Dockerized Azure deployment

## 📊 Use Cases

Farmovo supports comprehensive warehouse operations including:

- **Manage Sale Transactions**: Create, view, update, complete, and cancel sales with export capabilities
- **Manage Stocktake**: Inventory counting, discrepancy tracking, and automated import/balance generation
- **Manage Debts**: Debtor tracking, debt note management, and transaction-based debt creation
- **Balance Management**: Real-time inventory balance tracking and management

## 🤝 Contributing

We welcome contributions to Farmovo! Please feel free to submit issues, feature requests, or pull requests to help improve the system.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Contributors

Meet the amazing people who created this project:

- **Development Team**: Backend and frontend development
- **UI/UX Designers**: User interface and experience design
- **Database Architects**: Data modeling and optimization
- **DevOps Engineers**: Deployment and infrastructure management

---

**Farmovo** - Empowering efficient egg warehouse management through technology! 🥚🏭
