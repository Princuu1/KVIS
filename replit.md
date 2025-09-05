# Student Attendance & Automation App

## Overview

A comprehensive student attendance management application built with modern web technologies. The system provides automated attendance tracking through face recognition and geofencing, manual attendance marking, real-time chat functionality, and academic management features including calendar events, exam scheduling, and syllabus tracking. The application combines a React-based frontend with an Express.js backend, utilizing PostgreSQL for data persistence and WebSocket for real-time communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend uses React with TypeScript, built with Vite for optimal development and build performance. The application follows a component-based architecture with:
- **UI Framework**: shadcn/ui components built on Radix UI primitives for consistent design
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Real-time Communication**: WebSocket client integration for chat functionality
- **Face Recognition**: face-api.js (TensorFlow.js) for browser-based facial recognition
- **Geolocation**: Native browser Geolocation API for campus boundary verification

### Backend Architecture
The backend is built on Node.js with Express, featuring:
- **API Structure**: RESTful endpoints with Express.js middleware
- **Authentication**: JWT-based authentication with httpOnly cookies
- **WebSocket Server**: Real-time chat functionality using native WebSocket
- **File Handling**: Multer middleware for ID photo uploads
- **Password Security**: bcrypt for password hashing
- **Middleware Pipeline**: Custom logging, error handling, and authentication middleware

### Database Design
PostgreSQL database managed through Drizzle ORM with the following core entities:
- **Users**: Student profiles with face descriptors and contact information
- **Attendance Records**: Timestamped entries with status, location, and verification method
- **Calendar Events**: Academic calendar with events, holidays, and exam dates
- **Exam Schedule**: Structured exam timing and location information
- **Syllabus Items**: Course content tracking with completion status
- **Chat Messages**: Real-time messaging with room-based organization

### Security Implementation
- JWT tokens stored in secure, httpOnly cookies
- Password hashing with bcrypt
- Face recognition data stored as Float32 arrays in JSON format
- CORS configuration for client-server communication
- Input validation and sanitization
- Protected route authentication middleware

### Real-time Features
WebSocket implementation for:
- Live chat messaging in general room
- Online user count tracking
- Message broadcasting to connected clients
- Automatic reconnection handling

### Mobile-First Design
Responsive design approach with:
- Tailwind CSS breakpoint system
- Mobile-optimized navigation with bottom tabs
- Touch-friendly interface elements
- Progressive web app capabilities

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database via DATABASE_URL environment variable
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database operations with migrations

### UI and Styling Libraries
- **Radix UI**: Comprehensive primitive component library
- **shadcn/ui**: Pre-built component system
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Authentication and Security
- **JWT**: JSON Web Token implementation
- **bcrypt**: Password hashing library
- **Multer**: File upload handling middleware

### Real-time and Communication
- **WebSocket**: Native WebSocket for real-time chat
- **TanStack React Query**: Server state management and caching

### AI and Machine Learning
- **face-api.js**: TensorFlow.js-based face recognition
- **TensorFlow.js**: Machine learning model execution in browser

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast JavaScript bundler for production builds

### Email and Notifications
- **Nodemailer**: SMTP email sending (configured but not fully implemented in current codebase)

### File Storage and Assets
- Local file system storage for uploaded ID photos
- Static asset serving through Express middleware

### Environment Configuration
- Environment variables for database connection
- JWT secret configuration
- Development vs production environment handling