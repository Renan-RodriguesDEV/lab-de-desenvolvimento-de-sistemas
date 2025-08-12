

CREATE DATABASE IF NOT EXISTS mvc_nodejs;
USE mvc_nodejs;
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    age INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Inserir alguns dados de exemplo
INSERT INTO users (name, email, password, age) VALUES
('João Silva', 'joao@email.com', '$2a$10$example_hash_password', 30),
('Mariani Chan', 'mariani-chan@email.com', '$1a$10$example_hash_password', 25);
