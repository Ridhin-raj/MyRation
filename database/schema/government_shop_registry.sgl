CREATE TABLE government_shop_regitry (
    regitry_id INT PRIMARY KEY AUTO_INCREMENT,
    shop_code VARCHAR(50) UNIQUE NOT NULL,
    license_number VARCHAR(59) UNIQUE NOT NULL,
    shop_name VARCHAR(100) NOT NULL,
    district VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    status ENUM('valid','suspended','cancelled') DEFAULT 'valid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);