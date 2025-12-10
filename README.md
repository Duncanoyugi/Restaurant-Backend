# Restaurant Management System - Backend

A comprehensive backend API for a restaurant management system built with NestJS, TypeORM, and MSSQL.

## Overview

This backend provides RESTful APIs for managing restaurant operations including user authentication, menu management, order processing, inventory tracking, delivery management, analytics, and more.

## Technology Stack

- **Framework**: NestJS
- **Database**: MSSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer
- **Payment**: Paystack integration
- **OTP**: Custom OTP service
- **Push Notifications**: Firebase integration

## Features

### Core Modules

#### 🔐 Authentication & Authorization
- User registration with email verification
- JWT-based authentication
- Role-based access control (Admin, Staff, Driver, Customer)
- Password reset with OTP
- Refresh token mechanism

#### 👥 User Management
- Multi-role user system
- Profile management
- User status tracking

#### 🍽️ Menu Management
- Category-based menu organization
- Menu item CRUD operations
- Bulk menu operations

#### 📋 Order Management
- Order creation and tracking
- Order status management
- Kitchen order processing
- Delivery assignment

#### 📍 Location Management
- Address management
- City/State/Country hierarchy

#### 📦 Inventory Management
- Stock tracking
- Supplier management
- Stock transactions and adjustments

#### 🚚 Delivery Management
- Driver assignment
- Delivery tracking
- Vehicle management
- Delivery estimates

#### 💳 Payment Processing
- Paystack integration
- Invoice generation
- Payment verification

#### 📊 Analytics
- Business metrics tracking
- User behavior analytics
- Activity logging

#### 🔔 Notifications
- Push notifications
- Email notifications
- In-app notifications

#### 📧 Email Service
- Template-based emails
- Email logging
- Welcome and verification emails

#### 🔢 OTP Service
- OTP generation and verification
- Email and SMS OTP support

## API Documentation

The API is fully documented using Swagger. When running the application, visit `/api` to access the interactive API documentation.

### Base URL
```
http://localhost:3000
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MSSQL Server
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Database
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=restaurant_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Paystack
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public

# Other configs...
```

3. Run database migrations:
```bash
npm run migration:run
```

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## Database Schema

The application uses TypeORM entities with the following main entities:

- **User**: User accounts with roles
- **Menu**: Menu items and categories
- **Order**: Customer orders
- **Inventory**: Stock items and suppliers
- **Delivery**: Delivery tracking
- **Payment**: Payment transactions
- **Analytics**: Business metrics
- **Notification**: System notifications

## Key Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Verify email with OTP
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with OTP
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile

### Menu Management
- `GET /menu` - Get menu items
- `POST /menu` - Create menu item (Admin/Staff)
- `PUT /menu/:id` - Update menu item
- `DELETE /menu/:id` - Delete menu item

### Order Management
- `POST /order` - Create order
- `GET /order` - Get orders (filtered by role)
- `PUT /order/:id/status` - Update order status
- `POST /order/:id/assign-driver` - Assign driver to order

### Inventory
- `GET /inventory` - Get inventory items
- `POST /inventory` - Add inventory item
- `PUT /inventory/:id` - Update inventory item
- `POST /inventory/:id/adjust` - Adjust stock levels

### Delivery
- `GET /delivery` - Get deliveries
- `POST /delivery/track` - Create delivery tracking
- `PUT /delivery/:id/status` - Update delivery status

## Development

### Available Scripts
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint

### Database Operations
- `npm run migration:generate` - Generate migration from entity changes
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm run start:prod
```

## Security Features

- JWT authentication with refresh tokens
- Role-based access control
- Input validation with class-validator
- SQL injection prevention with TypeORM
- CORS configuration
- Rate limiting (can be added)
- Helmet for security headers

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update API documentation
4. Ensure all tests pass before submitting PR

## License

This project is licensed under the UNLICENSED license.
