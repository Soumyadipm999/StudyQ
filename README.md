# Smart Study Material Platform

A comprehensive, production-ready educational content management and delivery system built with React, TypeScript, and modern web technologies.

## 🎯 Overview

The Smart Study Material Platform is a secure, role-based educational system that enables seamless distribution of study materials from teachers to students with automated multi-channel delivery via email and WhatsApp.

## ✨ Key Features

### 🔐 Authentication & Security
- **Role-based access control** (Admin, Teacher, Student)
- **JWT-style authentication** with session management
- **Password security policies** with strength validation
- **Account lockout protection** against brute force attacks
- **Forced password change** for new users
- **Comprehensive audit logging** for compliance

### 👥 User Management
- **Admin-only user creation** (no self-registration)
- **Unique user ID generation** with role-based prefixes
- **Automated credential delivery** via email simulation
- **Academic progression tracking** for students
- **User status management** (active/inactive)

### 📚 Academic Structure
- **4-year program** with 8-semester structure
- **Semester-based access control** (students access current + previous semesters)
- **Academic year tracking** and material organization
- **Subject-based categorization** and filtering

### 📖 Material Management
- **File upload system** with type and size validation
- **Metadata tagging** (subject, semester, academic year, tags)
- **Search and filtering** capabilities
- **Download tracking** and analytics
- **Teacher-specific material management**

### 📧 Multi-Channel Delivery
- **Instant delivery** via email and/or WhatsApp
- **One-click material distribution** to students
- **Delivery status tracking** and history
- **Custom recipient information** support

### 📊 Analytics & Reporting
- **System-wide statistics** and metrics
- **User activity tracking** and audit trails
- **Material usage analytics** and download counts
- **Delivery success/failure reporting**

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive, modern UI design
- **Lucide React** for consistent iconography
- **Custom hooks** for API integration and state management

### Database Schema
- **MySQL-compatible** database structure
- **Normalized tables** with proper foreign key relationships
- **Indexes** for optimal query performance
- **Views** for common data access patterns

### API Design
- **RESTful endpoints** with consistent response formats
- **JWT authentication** with refresh token support
- **Role-based authorization** middleware
- **Comprehensive error handling** and validation

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- MySQL 8.0+ database server
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studyq-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Import the database schema
   mysql -u root -p < src/database/schema.sql
   ```

4. **Configure environment variables**
   ```bash
   # Create .env file with your configuration
   REACT_APP_API_URL=http://localhost:3001/api
   DATABASE_URL=mysql://user:password@localhost:3306/study_platform
   JWT_SECRET=your-super-secret-jwt-key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 👤 Default Users

The system comes with pre-configured demo accounts:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | admin | admin123 | System administrator with full access |
| Teacher | prof.smith | teacher123 | Sample teacher account |
| Student | john.doe | student123 | Sample student (Semester 3, Year 2024) |

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#2563EB) - Navigation, CTAs, links
- **Secondary**: Green (#059669) - Success states, confirmations
- **Accent**: Orange (#EA580C) - Warnings, highlights
- **Error**: Red (#DC2626) - Error states, destructive actions
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headings**: Inter font family with clear hierarchy
- **Body**: Optimized line spacing (150% for body, 120% for headings)
- **Code**: Monospace font for technical content

### Components
- **Responsive design** with mobile-first approach
- **Consistent spacing** using 8px grid system
- **Accessible forms** with proper labeling and validation
- **Interactive elements** with hover states and transitions

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/login          - User authentication
POST /api/auth/change-password - Password update
POST /api/auth/logout         - Session termination
POST /api/auth/refresh        - Token refresh
```

### User Management
```
GET    /api/users             - List all users (admin)
POST   /api/users             - Create new user (admin)
PUT    /api/users/:id         - Update user (admin)
DELETE /api/users/:id         - Delete user (admin)
POST   /api/users/:id/reset-password - Reset password (admin)
```

### Materials
```
GET    /api/materials         - List materials (filtered by role)
POST   /api/materials         - Upload material (teacher)
PUT    /api/materials/:id     - Update material (teacher)
DELETE /api/materials/:id     - Delete material (teacher)
```

### Delivery
```
POST   /api/delivery/send     - Send material to student
GET    /api/delivery/logs     - Delivery history
```

### Analytics
```
GET    /api/analytics/stats   - System statistics
GET    /api/analytics/users/:id - User analytics
```

## 🛡️ Security Features

### Authentication Security
- **Password hashing** using bcrypt with 12+ rounds
- **JWT tokens** with expiration and refresh mechanism
- **Session management** with automatic timeout
- **Account lockout** after failed login attempts

### Data Protection
- **Input validation** and sanitization on all endpoints
- **SQL injection prevention** through parameterized queries
- **XSS protection** with proper output encoding
- **CSRF protection** with token validation

### Access Control
- **Role-based permissions** enforced at API level
- **Resource ownership** validation for teachers/students
- **Academic progression** controls for material access
- **Audit logging** for all sensitive operations

## 📱 Mobile Responsiveness

The platform is fully responsive and optimized for:
- **Desktop** (1024px+): Full feature set with multi-column layouts
- **Tablet** (768px-1023px): Adapted layouts with touch-friendly controls
- **Mobile** (320px-767px): Streamlined interface with collapsible navigation

## 🔍 Testing

### Demo Scenarios
1. **Admin Workflow**: Create users, manage system settings, view audit logs
2. **Teacher Workflow**: Upload materials, manage content, view analytics
3. **Student Workflow**: Browse materials, request delivery, track history

### Test Data
- Pre-loaded sample materials across different semesters
- Simulated delivery logs and audit trail entries
- Various user types with different access levels

## 🚀 Deployment

### Production Checklist
- [ ] Update JWT secret keys
- [ ] Configure production database
- [ ] Set up email service integration
- [ ] Configure WhatsApp API
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures

### Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=production-secret-key
EMAIL_SERVICE_API_KEY=your-email-api-key
WHATSAPP_API_KEY=your-whatsapp-api-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation for endpoint details

---

**Built with ❤️ for educational institutions worldwide**