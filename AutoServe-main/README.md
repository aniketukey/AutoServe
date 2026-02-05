# 🚗 AutoServe - Enterprise Vehicle Maintenance System

[![Java](https://img.shields.io/badge/Java-17%2B-orange)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-lightgrey)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**AutoServe** is a comprehensive, full-stack web application designed to digitize the operations of a multi-role automobile service center. It manages the entire service lifecycle—from customer appointment booking and Roadside Assistance (RSA) to job card execution, inventory management, and digital invoicing.

---

## 📖 Table of Contents
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Future Roadmap](#-future-roadmap)

---

## 🌟 Key Features

### 🏢 Operational Management
- **Role-Based Access Control (RBAC):** Secure access for Admins, Managers, Mechanics, and Customers using JWT.
- **Staff Hierarchy Enforcement:** Mechanics are assigned to specific Managers. The system strictly enforces that a Mechanic can only work on Job Cards supervised by their reporting Manager.
- **Inventory Management:** Real-time stock tracking with **Optimistic Locking** (`@Version`) to prevent concurrency issues (race conditions) during simultaneous sales.

### 🛠 Service Lifecycle
- **Smart Appointment Booking:** Customers can upload photos of vehicle issues during booking.
- **Job Card System:** The central hub linking Customers, Vehicles, Mechanics, and Parts.
- **Evidence Vault:** Managers upload "During Service" photos to prove damage/repairs to customers.
- **Historical Billing Integrity:** Uses a **Snapshot Pattern** to lock item prices at the moment of sale, ensuring past invoices remain accurate even if inventory prices change later.

### 🚑 Real-Time Features
- **Roadside Assistance (RSA):** SOS trigger fetches customer GPS coordinates via Browser Geolocation API.
- **Live Chat:** WebSocket (STOMP) enabled chat linking Customers directly to the Manager handling their Job Card.
- **Google Maps Integration:** Route calculation and garage location services.

### 💳 Finance
- **Digital Invoicing:** Automated bill generation (Parts + Labor + Tax).
- **Secure Payments:** Integrated **Razorpay** with backend signature verification to prevent payment fraud.

---

## 🏗 System Architecture
AutoServe follows a **Modular Monolithic** architecture, structured to allow easy migration to Microservices in the future.

- **Backend:** Spring Boot (Controller-Service-Repository pattern).
- **Frontend:** React.js with Material UI (MUI).
- **Security:** Spring Security with Stateless JWT Authentication.
- **Data:** MySQL with Soft Delete implementation for data retention.

---

## 🛠 Tech Stack

### Backend
* **Framework:** Spring Boot 3.3
* **Security:** Spring Security, JWT (JJWT)
* **Database:** MySQL 8.0, Spring Data JPA
* **Real-time:** Spring WebSocket (STOMP)
* **Validation:** Hibernate Validator
* **Mapping:** ModelMapper

### Frontend
* **Library:** React.js (Hooks & Functional Components)
* **UI Framework:** Material UI (MUI)
* **State Management:** Context API
* **HTTP Client:** Axios
* **Maps:** Google Maps JavaScript API

---

## 🗄 Database Schema
The system uses a **Single Table Strategy** for Users to optimize authentication performance.

| Entity | Description |
| :--- | :--- |
| **User** | Handles Admin, Manager, Mechanic, Customer. Uses Self-Referencing FK for hierarchy. |
| **JobCard** | The central entity linking Appointment (1:1), Staff, and Evidence. |
| **Inventory** | Master record of parts. |
| **JobCardItem** | Transactional record of parts used (Snapshots price/name). |
| **Invoice** | Stores final financial data and Razorpay transaction IDs. |

---

## 🚀 Installation & Setup

### Prerequisites
* Java Development Kit (JDK) 17 or higher
* Node.js & npm
* MySQL Server

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/AutoServe.git](https://github.com/yourusername/AutoServe.git)
cd AutoServe
