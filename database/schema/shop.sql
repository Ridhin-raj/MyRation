CREATE TABLE shops (
    shop_id INT PRIMARY KEY AUTO_INCREMENT,
    registry_id INT UNIQUE NOT NULL,
    shop_code VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registry_id) REFERENCES government_shop_regitry(regitry_id)
);