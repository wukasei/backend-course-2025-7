const { Command } = require("commander");
const express = require("express");
const path = require("path");
const files = require("fs"); 
const fs = require("fs").promises; 
const multer = require('multer');
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require('cors');
const db = require('./db');

const program = new Command;

program
    .requiredOption('-h, --host <host>','server host')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <cache>', 'server cache');

program.parse(process.argv);
const options = program.opts(); 

const app = express();
app.use(cors());


if (!files.existsSync(options.cache)) {
    files.mkdirSync(options.cache, { recursive: true });
    console.log(`Directory ${options.cache} created`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, options.cache); 
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, Date.now() + ext); 
  }
});
const upload = multer({ storage: storage });

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const swaggerDefinition = {
    openapi: '3.0.0',
    info: { title: 'Inventory API', version: '1.0.0', description: 'API для управління інвентарем' },
    servers: [{ url: `http://127.0.0.1:${options.port}` }],
};
const swaggerSpec = swaggerJsdoc({
    definition: swaggerDefinition,
    apis: ['./index.js'],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.static(__dirname)); 


/**
 * @swagger
 * /:
 *   get:
 *     summary: Головна сторінка сервера
 *     description: Повертає HTML файл index.html
 *     responses:
 *       200:
 *         description: HTML сторінка успішно отримана
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Файл не знайдено
 */

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * @swagger
 * /RegisterForm.html:
 *   get:
 *     summary: Сторінка форми реєстрації предмету
 *     responses:
 *       200:
 *         description: HTML форма успішно отримана
 */
/**
 * @swagger
 * /SearchForm.html:
 *   get:
 *     summary: Сторінка форми пошуку предмету
 *     responses:
 *       200:
 *         description: HTML форма успішно отримана
 */
app.get('/RegisterForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'RegisterForm.html'));
});
app.get('/SearchForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'SearchForm.html'));
});

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Повертає список всіх предметів інвентарю
 *     responses:
 *       200:
 *         description: Список предметів успішно отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 */

app.get('/inventory', async (req, res) => {
    try {
        const [inventory] = await db.query('SELECT id, name, description FROM items');
        res.json(inventory);
    } catch (e) {
        console.error("DB List Error:", e);
        res.status(500).json({ error: "Failed to fetch inventory list" });
    }
});

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Повертає предмет за ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID предмету
 *     responses:
 *       200:
 *         description: Предмет знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 photo:
 *                   type: string
 *                   description: Посилання на фото предмету (якщо є)
 *       404:
 *         description: Предмет не знайдено
 */
app.get('/inventory/:id', async (req, res) => {
    const id = req.params.id;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
        const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Item not found" });
        }
        
        const item = rows[0];
        const response = {
            id: item.id,
            name: item.name,
            description: item.description,
            photo: item.photo_path ? `/inventory/${item.id}/photo` : null
        };

        res.json(response);

    } catch (e) {
        console.error("DB Item Get Error:", e);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @swagger
 * /inventory/{id}/photo:
 *   get:
 *     summary: Повертає фото предмету за ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID предмету
 *     responses:
 *       200:
 *         description: Фото успішно отримано
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Фото не знайдено
 */
app.get('/inventory/:id/photo', async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query('SELECT photo_path FROM items WHERE id = ?', [id]);
        
        if (rows.length === 0 || !rows[0].photo_path) {
            return res.status(404).send("Item or photo path not found in DB");
        }
        const dbPhotoPath = rows[0].photo_path;
        const photoPath = path.resolve(dbPhotoPath.replace(/\\/g, '/'));
        await fs.access(photoPath); 

        res.sendFile(photoPath);
        
    } catch (e) {
        console.error("Photo serving error:", e);
        res.status(404).send("Photo file not found on server.");
    }
});

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Оновлює дані предмету (name, description)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID предмету
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Предмет оновлено успішно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Неправильні дані або ID
 *       404:
 *         description: Предмет не знайдено
 */
app.put('/inventory/:id', async (req, res) => {
    const id = req.params.id;
    const { name, description } = req.body;

    if (!id || isNaN(id) || (!name && !description)) {
        return res.status(400).json({ error: "Invalid ID or missing update data." });
    }

    try {
        const [existingItemRows] = await db.query('SELECT name, description FROM items WHERE id = ?', [id]);
        if (existingItemRows.length === 0) {
            return res.status(404).json({ error: "Item not found." });
        }
        
        const existingItem = existingItemRows[0];
        const newName = name || existingItem.name;
        const newDesc = description || existingItem.description;

        const sql = 'UPDATE items SET name = ?, description = ? WHERE id = ?';
        await db.query(sql, [newName, newDesc, id]);
        
        res.status(200).json({ 
            id: Number(id), 
            name: newName, 
            description: newDesc 
        });

    } catch (e) {
        console.error("DB PUT Data Error:", e);
        res.status(500).json({ error: "Server error during data update." });
    }
});

/**
 * @swagger
 * /inventory/{id}/photo:
 *   put:
 *     summary: Оновлює фото предмету (через Multer)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Фото оновлено успішно
 *       404:
 *         description: Предмет не знайдено
 */
app.put('/inventory/:id/photo', upload.single('photo'), async (req, res) => {
    const id = req.params.id;

    if (!id || isNaN(id)) {
        if (req.file) { await fs.unlink(req.file.path).catch(console.error); }
        return res.status(400).json({ error: "Invalid ID format or ID is missing" });
    }
 
    if (!req.file) {
        return res.status(400).json({ error: "Photo file is required." });
    }

    const photoPath = req.file.path.replace(/\\/g, '/'); 
    
    try {
        const [existingItemRows] = await db.query('SELECT id FROM items WHERE id = ?', [id]);
        if (existingItemRows.length === 0) {
            await fs.unlink(req.file.path).catch(console.error);
            return res.status(404).json({ error: "Item not found." });
        }

        const sql = 'UPDATE items SET photo_path = ? WHERE id = ?';
        await db.query(sql, [photoPath, id]);

        res.status(200).json({ 
            message: "Photo updated successfully", 
            photo_path: photoPath 
        });

    } catch (e) {
        console.error("DB PUT Photo Error:", e);
        await fs.unlink(req.file.path).catch(console.error); 
        res.status(500).json({ error: "Server error during photo update." });
    }
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Додає новий предмет
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               inventory_name:
 *                 type: string
 *               description:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Предмет додано успішно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 photo:
 *                   type: string
 *       400:
 *         description: Неправильні дані
 */

app.post('/register', upload.single('photo'), async (req, res) => {
    const name = req.body.inventory_name;
    const description = req.body.description || "";
    let photoPath = '';

    if (req.file) {
        photoPath = req.file.path.replace(/\\/g, '/'); 
    }
    
    if (!name) {
        return res.status(400).json({ error: 'Name field is required' });
    }

    try {
        const sql = 'INSERT INTO items (name, description, photo_path) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [name, description, photoPath]);
        const newId = result.insertId;
        
        const response = { 
            id: newId, 
            name, 
            description, 
            photo: photoPath ? `/inventory/${newId}/photo` : null 
        };
        res.status(201).json(response);
        
    } catch (e) {
        console.error("Помилка SQL при реєстрації:", e);
        if (req.file) {
             await fs.unlink(req.file.path).catch(err => console.error("Could not delete file:", err));
        }
        res.status(500).json({ error: 'Database insertion failed' });
    }
});

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Пошук предмету за ID (через URL-параметри)
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID предмету
 *     responses:
 *       200:
 *         description: Предмет знайдено
 *       404:
 *         description: Предмет не знайдено
 */
app.get('/search', async (req, res) => {
    const id = parseInt(req.query.id); 
    
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid or missing ID format.' });
    }
    
    try {
        const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Item not found.' });
        }
        
        const item = rows[0];
        const response = {
            id: item.id,
            name: item.name,
            description: item.description,
            photo: item.photo_path ? `/inventory/${item.id}/photo` : null
        };

        res.json(response);
        
    } catch (e) {
        console.error('Search DB Error:', e);
        res.status(500).json({ error: 'Server error during search.' });
    }
});


/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Видаляє предмет за ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Предмет видалено успішно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Предмет успішно видалено
 *       404:
 *         description: Предмет не знайдено
 *       400:
 *         description: Неправильний формат ID
 */
app.delete('/inventory/:id', async (req, res) => {
    const id = req.params.id;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format or ID is missing" });
    }

    try {
        const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Item not found" });
        }
        res.status(200).json({ message: "Предмет успішно видалено" });

    } catch (error) {
        console.error("DB DELETE Error:", error);
        res.status(500).json({ error: "Database operation failed" });
    }
});


app.listen(Number(options.port), options.host || "0.0.0.0", () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
  console.log(`Swagger docs at http://${options.host}:${options.port}/docs`);
});