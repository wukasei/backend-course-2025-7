SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
SET SESSION collation_connection = 'utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    photo_path VARCHAR(255)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

TRUNCATE TABLE items;

SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
SET SESSION collation_connection = 'utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    photo_path VARCHAR(255)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

TRUNCATE TABLE items;

INSERT INTO items (id, name, description, photo_path) VALUES 
(1, 'Wooden Sword', 'A simple wooden sword. Suitable for early fights with mobs.', 'cache/1.png'),
(3, 'Golden Apple', 'A tasty apple with a golden sheen. Restores health.', 'cache/3.png'),
(4, 'Obsidian Block', 'A durable block for construction and portals to the Nether.', 'cache/4.jpg'),
(5, 'Torch', 'A source of light that wards off mobs and illuminates dark places.', 'cache/5.jpg'),
(6, 'TNT Block', 'An explosive block activated by fire or redstone.', 'cache/6.png'),
(7, 'Bow', 'A long-range weapon that allows you to attack mobs from a safe distance.', 'cache/7.png'),
(8, 'Cookie', 'An edible item that restores a small amount of health.', 'cache/8.jpg'),
(9, 'rararra', 'Simple grass. Can become', '');