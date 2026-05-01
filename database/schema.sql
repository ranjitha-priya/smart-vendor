CREATE DATABASE IF NOT EXISTS smart_vendor;
USE smart_vendor;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'pharmacist') DEFAULT 'pharmacist',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  password VARCHAR(255),
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reliability_score FLOAT DEFAULT 0.0,
  security_score FLOAT DEFAULT 0.0,
  average_lead_time_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drugs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  critical_threshold INT DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drug_id INT NOT NULL,
  batch_number VARCHAR(100),
  quantity_in_stock INT DEFAULT 0,
  expiration_date DATE,
  supplier_id INT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drug_id INT NOT NULL,
  supplier_id INT NOT NULL,
  ordered_by INT NOT NULL,
  quantity INT NOT NULL,
  status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMP NULL,
  delivery_date TIMESTAMP NULL,
  unit_price DECIMAL(10,2) DEFAULT 0.00,
  quality_rating INT DEFAULT 5,
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (ordered_by) REFERENCES users(id)
);
