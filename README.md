# AI-Driven Multi-Tiered Drug Inventory and Supplier Reliability Ecosystem

## Overview
In the pharmaceutical industry, supply chain inefficiencies—specifically medication stockouts, drug expirations, and unreliable supplier delivery timelines—pose a significant risk to healthcare delivery. Traditional inventory systems are reactive, often failing to account for supplier performance variability and seasonal demand shifts.

This project is a smart, full-stack **Drug Inventory and Supply Chain Tracking System**. The core innovation lies in shifting from manual record-keeping to an automated predictive model that optimizes procurement based on supplier reliability and demand forecasting.

## Key Objectives
- Minimize human error in drug procurement.
- Reduce financial loss due to drug expiration.
- Ensure a seamless flow of essential medicines from multiple suppliers to hospitals and pharmacies.
- Optimize procurement based on supplier reliability and demand forecasting.

## System Methodology
The proposed system utilizes a multi-user architecture (Admin and Pharmacist/Staff) integrated with a centralized MySQL relational database to ensure ACID compliance for sensitive medical data.

### 1. Inventory Intelligence
The system employs **Machine Learning algorithms** (Regression and Time-Series Analysis) to forecast inventory depletion and set **dynamic reorder levels**.

### 2. Supplier Optimization
A unique **Performance Grading Engine** is implemented to analyze historical delivery data. By comparing delivery lead times and cost-per-unit across multiple vendors, the system identifies the most reliable source for critical medications, mitigating the risk of "late delivery" disruptions.

### 3. Full-Stack Implementation
- **Frontend**: Real-time visualization of stock health and supplier risk scores.
- **Backend/Core Logic**: Secure authentication, business logic for automated bidding and procurement, and supplier performance benchmarking.
- **ML Integration**: Demand forecasting and anomaly detection for supply chain leakages.

## Technology Stack
- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express, JavaScript (ES6+)
- **Database**: MySQL
- **Machine Learning**: Python, FastAPI

## Core Logic & Features
- **Supplier Performance Benchmarking**: Assesses and ranks suppliers based on historical reliability, delivery timelines, and costs.
- **Automated Stock Replenishment**: Triggers procurement and dynamic reorder processes automatically based on ML-driven depletion levels.
- **Demand Forecasting**: Time-Series Analysis to predict future drug demands, specifically handling seasonal shifts.
- **Anomaly Detection**: Identifies supply chain leakages, unusual delays, or unnatural inventory shrinkage.

---
*This ecosystem merges robust full-stack architecture with ML-based predictive analytics for enhanced transparency and resilience in the pharmaceutical supply chain.*
