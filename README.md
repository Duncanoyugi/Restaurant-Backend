# Restaurant Management System - Backend

A comprehensive backend API for a restaurant management system built with NestJS, TypeORM, and MSSQL.

## Overview

This backend provides RESTful APIs for managing multi-restaurant operations including:
- User authentication and authorization
- Restaurant management (multiple restaurants support)
- Menu management with categories
- Order processing (dine-in, takeaway, delivery)
- Table reservations
- Room/venue bookings (for full restaurant rentals)
- Delivery tracking with driver management
- Payment processing via Paystack
- Inventory and supplier management
- Reviews and ratings
- Push notifications and SMS
- Analytics and reporting

## Technology Stack

- **Framework**: NestJS
- **Database**: Microsoft SQL Server (MSSQL)
- **ORM**: TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer
- **Payment**: Paystack integration
- **OTP**: Custom OTP service
- **Push Notifications**: Firebase integration
- **SMS**: SMS gateway integration

---

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `Admin` | System administrator | Full system access |
| `Restaurant Owner` | Restaurant business owner | Their own restaurants |
| `Restaurant Staff` | Restaurant employees (chefs, waiters, etc.) | Assigned restaurants |
| `Customer` | End users | Own orders/reservations |
| `Driver` | Delivery drivers | Delivery assignments |

---

## Modules Overview

### 1. Authentication Module (`/auth`)
- User registration with email verification
- JWT login with access/refresh tokens
- Password reset with OTP
- Email verification

### 2. User Module (`/users`)
- User CRUD operations
- Search by name, email, phone, role, status
- Dashboard data retrieval
- Loyalty program info

### 3. Restaurant Module (`/restaurants`)
- Restaurant CRUD
- Staff management (`/restaurants/staff`)
- Shift scheduling (`/restaurants/shifts`)
- Staff assignments (`/restaurants/staff-assignments`)
- Driver assignments (`/restaurants/driver-assignments`)
- Find nearby restaurants
- Popular restaurants by city
- Restaurant statistics

### 4. Menu Module (`/menu`)
- Categories CRUD
- Menu items CRUD
- Bulk item creation
- Toggle availability
- Search and filtering
- Allergen filtering
- Featured items
- Price range calculation

### 5. Order Module (`/orders`)
- Order creation (dine-in, takeaway, delivery)
- Order status management
- Driver assignment
- Kitchen orders view
- Delivery orders view
- Order analytics
- Customer order cancellation
- Order status history

### 6. Reservation Module (`/reservations`)
- Table reservations
- Reservation status (Pending, Confirmed, Cancelled, Completed, No Show)
- Guest count tracking
- Special requests
- Deposit amounts

### 7. Room Module (`/rooms`)
- Room/venue management (for full restaurant rentals)
- Room bookings
- Availability checking
- Occupancy statistics
- Upcoming check-ins/check-outs

### 8. Delivery Module (`/delivery`)
- Vehicle information management
- Delivery tracking
- Real-time driver location updates
- Driver availability search
- Delivery estimates (distance/time)
- Driver statistics
- Performance analytics

### 9. Payment Module (`/payments`)
- Payment initialization via Paystack
- Payment verification
- Webhook handling
- Payment history
- Refund processing
- Invoice generation
- Restaurant payment tracking

### 10. Inventory Module (`/inventory`)
- Supplier management
- Inventory items CRUD
- Stock transactions (in/out)
- Stock adjustments
- Stock transfers
- Low stock alerts
- Expiring items tracking
- Inventory value calculation
- Category breakdown
- Stock movement reports
- Reorder suggestions

### 11. Review Module (`/reviews`)
- Customer reviews
- Rating system
- Reviews by restaurant/menu item/user

### 12. Location Module (`/location`)
- Country management
- State/Province management
- City management
- User address management
- Geographic hierarchy

### 13. Notification Module (`/notifications`)
- Push notifications
- In-app notifications
- Notification preferences

### 14. Analytics Module (`/analytics`)
- Activity logging
- Business metrics
- User behavior tracking

### 15. OTP Module (`/otp`)
- OTP generation
- OTP verification
- Email/SMS OTP support

### 16. Mailer Module
- Transactional emails
- Email logging
- Template-based emails

### 17. SMS Module (`/sms`)
- SMS sending
- OTP delivery via SMS

### 18. Push Notification Module
- Firebase push notifications

---

## API Endpoints Summary

### Public Endpoints (No Authentication Required)

```
GET  /restaurants              - List all restaurants
GET  /restaurants/default     - Get default restaurant
GET  /restaurants/:id         - Get restaurant details
GET  /restaurants/nearby      - Find nearby restaurants
GET  /menu/categories         - List categories
GET  /menu/categories/:id     - Get category
GET  /menu/items              - List menu items
GET  /menu/items/:id          - Get menu item
GET  /menu/restaurant/:id     - Get restaurant menu
GET  /menu/restaurant/:id/featured    - Featured items
GET  /menu/restaurant/:id/price-range  - Price range
GET  /menu/search             - Search menu items
GET  /menu/filter/allergens   - Filter by allergens
GET  /menu/featured           - Global featured items
GET  /rooms                   - List rooms
GET  /rooms/available         - Search available rooms
GET  /rooms/:id               - Get room details
```

### Authentication Endpoints

```
POST /auth/register          - Register new user
POST /auth/login             - User login
POST /auth/refresh           - Refresh access token
POST /auth/forgot-password   - Request password reset
POST /auth/reset-password    - Reset password
POST /otp/verify             - Verify OTP
```

### Protected Endpoints (Require JWT)

Most endpoints require authentication. Key protected endpoints include:

```
# Users
GET  /users                  - List all users (Admin only)
POST /users                  - Create user (Admin)
GET  /users/me/dashboard     - Get my dashboard
GET  /users/me/loyalty       - Get loyalty info

# Restaurants
POST /restaurants           - Create restaurant (Admin/Owner)
PATCH /restaurants/:id      - Update restaurant
DELETE /restaurants/:id    - Delete restaurant (Admin)
GET  /restaurants/:id/statistics - Restaurant statistics
POST /restaurants/staff     - Create staff
GET  /restaurants/staff/:id - Get staff details
POST /restaurants/shifts    - Create shift
GET  /restaurants/shifts/restaurant/:id - Get shifts

# Menu
POST /menu/categories       - Create category
PATCH /menu/categories/:id - Update category
DELETE /menu/categories/:id - Delete category
POST /menu/items            - Create menu item
POST /menu/items/bulk       - Bulk create items
PATCH /menu/items/:id       - Update item
PATCH /menu/items/:id/toggle-availability - Toggle availability
DELETE /menu/items/:id      - Delete item

# Orders
POST /orders                - Create order
GET  /orders                - List orders (filtered by role)
GET  /orders/:id            - Get order
GET  /orders/number/:num    - Get by order number
PATCH /orders/:id          - Update order
DELETE /orders/:id          - Delete order
PATCH /orders/:id/status   - Update order status
PATCH /orders/:id/assign-driver - Assign driver
GET  /orders/kitchen/orders - Kitchen orders
GET  /orders/delivery/orders - Delivery orders
GET  /orders/analytics/statistics - Order analytics
GET  /orders/user/my-orders - My orders
POST /orders/user/my-orders/:id/cancel - Cancel order

# Reservations
POST /reservations         - Create reservation
GET  /reservations         - List reservations
GET  /reservations/:id     - Get reservation
PATCH /reservations/:id    - Update reservation
PATCH /reservations/:id/status - Update status
POST /reservations/:id/cancel - Cancel reservation

# Room Bookings
POST /rooms/bookings       - Create booking
GET  /rooms/bookings       - List bookings
GET  /rooms/bookings/:id   - Get booking
PATCH /rooms/bookings/:id  - Update booking
POST /rooms/check-availability - Check availability
GET  /rooms/:id/occupancy  - Occupancy stats

# Delivery
POST /delivery/vehicle-info - Add vehicle info
GET  /delivery/vehicle-info/user/:id - Get vehicle
PUT  /delivery/vehicle-info/user/:id - Update vehicle
POST /delivery/tracking    - Create tracking
PUT  /delivery/tracking/location - Update location
GET  /delivery/tracking/order/:id - Get tracking
POST /delivery/assign      - Assign driver
GET  /delivery/drivers/available - Available drivers
POST /delivery/estimate   - Calculate estimate

# Payments
POST /payments/initialize - Initialize payment
POST /payments/verify      - Verify payment
POST /payments/webhook     - Paystack webhook
GET  /payments             - List payments (Admin)
GET  /payments/:id         - Get payment
GET  /payments/reference/:ref - Get by reference
GET  /payments/user/:id    - User payments
GET  /payments/my-payments - My payments
POST /payments/:id/refund - Initiate refund

# Inventory
POST /inventory/suppliers - Create supplier
GET  /inventory/suppliers  - List suppliers
POST /inventory/items     - Create item
GET  /inventory/items     - List items
POST /inventory/transactions - Create transaction
POST /inventory/adjust-stock - Adjust stock
POST /inventory/transfer-stock - Transfer stock
GET  /inventory/restaurant/:id/low-stock - Low stock
GET  /inventory/restaurant/:id/expiring - Expiring items
GET  /inventory/restaurant/:id/value - Inventory value

# Reviews
POST /reviews              - Create review
GET  /reviews              - List reviews
PATCH /reviews/:id         - Update review
DELETE /reviews/:id        - Delete review
```

---

## Database Entities

### User Entity
- id, name, email, phone, password
- emailVerified, profileImage, active
- status (active, inactive, suspended, pending_verification)
- resetToken, verificationToken
- roleId
- Driver fields: isOnline, isAvailable, currentLatitude, currentLongitude, averageRating, totalDeliveries

### UserRole Entity
- id, name, description, permissions

### Restaurant Entity
- id, name, description, email, phone
- streetAddress, zipCode, latitude, longitude
- logoUrl, coverImageUrl
- openingTime, closingTime, active
- averageRating, ownerId, cityId

### MenuItem Entity
- id, name, description, price
- imageUrl, categoryId, restaurantId
- isAvailable, isFeatured
- preparationTime, allergens

### Category Entity
- id, name, description, restaurantId

### Order Entity
- id, orderNumber, restaurantId, userId
- driverId, tableId, deliveryAddressId
- orderType (dine-in, takeaway, delivery)
- paymentId, statusId
- totalPrice, discount, deliveryFee, taxAmount, finalPrice
- comment, estimatedDeliveryTime, actualDeliveryTime, scheduledTime

### OrderItem Entity
- id, orderId, menuItemId, quantity, price, comment

### OrderStatus Entity
- id, orderId, statusId, changedAt, changedBy

### StatusCatalog Entity
- id, name, description

### Reservation Entity
- id, reservationNumber, userId, restaurantId, tableId
- reservationType (table, full_restaurant)
- reservationDate, reservationTime
- guestCount, specialRequest, status
- paymentId, depositAmount

### Table Entity
- id, restaurantId, tableNumber, capacity

### Room Entity
- id, name, description, restaurantId
- capacity, pricePerHour, amenities

### RoomBooking Entity
- id, bookingNumber, userId, roomId, restaurantId
- checkInDate, checkOutDate
- guestCount, status, totalPrice, paymentId

### Delivery Entity
- id, orderId, driverId, status
- currentLatitude, currentLongitude
- estimatedArrival

### VehicleInfo Entity
- id, userId, vehicleType, licensePlate, model, color, year

### DeliveryTracking Entity
- id, orderId, driverId
- latitude, longitude, timestamp, status

### Payment Entity
- id, userId, orderId, reservationId, roomBookingId
- amount, currency, status
- paymentMethod, reference

### Invoice Entity
- id, paymentId, invoiceNumber, amount, status

### InventoryItem Entity
- id, name, description, SKU
- quantity, unit, reorderLevel
- expiryDate, purchasePrice, sellingPrice
- category, restaurantId, supplierId

### Supplier Entity
- id, name, email, phone, address, contactPerson

### StockTransaction Entity
- id, inventoryItemId, type, quantity, reason, userId, createdAt

### Review Entity
- id, rating, comment, userId, restaurantId, menuItemId, orderId

### Address Entity
- id, userId, cityId, streetAddress, zipCode, latitude, longitude

### City Entity
- id, name, stateId, countryId

### State Entity
- id, name, countryId

### Country Entity
- id, name, code

### Notification Entity
- id, userId, title, message, type, read, createdAt

### ActivityLog Entity
- id, userId, action, entityType, entityId, details, timestamp

### BusinessMetrics Entity
- id, restaurantId, date, revenue, orders, customers

### UserBehavior Entity
- id, userId, action, details, timestamp

---

## Database Relationships

```
User (1) ─────< (N) Order
User (1) ─────< (N) Delivery
User (1) ─────< (N) Reservation
User (1) ─────< (N) Review
User (1) ─────< (N) Address
User (1) ──< RestaurantStaff (1) ──< Restaurant
User (1) ──< DriverAssignment (1) ──< Restaurant

Restaurant (1) ─────< (N) MenuItem
Restaurant (1) ─────< (N) Room
Restaurant (1) ─────< (N) Table
Restaurant (1) ─────< (N) Order
Restaurant (1) ─────< (N) InventoryItem
Restaurant (1) ─────< (N) Review

MenuItem (N) ─────< (N) OrderItem
MenuItem (N) ─────< (N) Review

Order (1) ─────< (N) OrderItem
Order (1) ──< Payment (1)
Order (1) ──< Delivery (1)
Order (1) ─────< (N) DeliveryTracking

Reservation (1) ──< Payment (1)
Reservation (1) ──< Table (1)

RoomBooking (1) ──< Payment (1)
```

---

## Security

- JWT-based authentication with access/refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Email verification required before account activation
- OTP verification for password reset and sensitive operations
- Input validation with class-validator
- SQL injection prevention with TypeORM parameterized queries

---

## Integration Points

### Paystack
- Payment initialization
- Payment verification
- Webhook handling for payment events
- Refund processing

### Email Service (Nodemailer)
- Welcome emails
- Email verification
- Password reset
- Order notifications

### SMS Service
- OTP delivery
- Order status notifications

### Push Notifications (Firebase)
- Order status updates
- Promotion notifications
- Reservation reminders

---

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=restaurant_db

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRATION=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Paystack
PAYSTACK_SECRET_KEY=your_secret_key
PAYSTACK_PUBLIC_KEY=your_public_key

# Frontend
FRONTEND_URL=http://localhost:5174

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Microsoft SQL Server
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Run database migrations:
```bash
npm run migration:run
```

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
API Documentation (Swagger) at `http://localhost:3000/api`

---

## Available Scripts

```bash
npm run start:dev        # Start development server with hot reload
npm run build           # Build for production
npm run start:prod      # Start production server
npm run migration:run   # Run pending migrations
npm run lint            # Run ESLint
```

---

## File Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── auth/                   # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── dto/
│   │   ├── strategies/
│   │   ├── decorators/
│   │   └── guards/
│   ├── user/                   # User management
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── restaurant/             # Restaurant management
│   ├── menu/                   # Menu management
│   ├── order/                  # Order management
│   ├── reservation/            # Table reservations
│   ├── room/                   # Room bookings
│   ├── delivery/               # Delivery tracking
│   ├── payment/                # Payment processing
│   ├── inventory/              # Stock management
│   ├── review/                 # Reviews
│   ├── location/               # Geographic data
│   ├── notification/           # Notifications
│   ├── analytics/              # Analytics
│   ├── otp/                    # OTP verification
│   ├── mailer/                 # Email service
│   ├── sms/                    # SMS service
│   ├── push-notification/      # Push notifications
│   └── database/               # Database configuration
```

---

## Seeders

The system includes seeders for initial data:
- User roles (Admin, Restaurant Owner, Restaurant Staff, Customer, Driver)
- Default restaurants
- Menu categories and items
- Rooms
- Order status catalog
- Location data (countries, states, cities)

---

## Common Query Parameters

Many endpoints support pagination and filtering:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number | 1 |
| `limit` | Items per page | 20 |
| `search` | Search term | - |
| `restaurantId` | Filter by restaurant | - |
| `userId` | Filter by user | - |
| `status` | Filter by status | - |
| `startDate` | Start date for filtering | - |
| `endDate` | End date for filtering | - |

---

## License

UNLICENSED
