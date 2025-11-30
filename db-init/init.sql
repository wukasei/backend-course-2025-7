CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    photo_path VARCHAR(255)
);

INSERT INTO items (name, description, photo_path) VALUES 
('Laptop', 'Gaming laptop', ''),
('Mouse', 'Wireless mouse', '');