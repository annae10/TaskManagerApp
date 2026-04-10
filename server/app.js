const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

const JWT_SECRET = "secret_key";
const SALT_ROUNDS = 10;

let users = [];        // { _id, email, passwordHash }
let tasks = [];        // { _id, userId, title, description, completed, completedAt, createdAt }

(async () => {
    const hashed = await bcrypt.hash("123456", SALT_ROUNDS);
    const demoUser = {
        _id: crypto.randomUUID(),
        email: "demo@example.com",
        passwordHash: hashed
    };
    users.push(demoUser);

    tasks.push({
        _id: crypto.randomUUID(),
        userId: demoUser._id,
        title: "Task1",
        description: "Description1",
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    });
    tasks.push({
        _id: crypto.randomUUID(),
        userId: demoUser._id,
        title: "Task2",
        description: "Description2",
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
    });
})();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    console.log("Authorization header:", authHeader);
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Token error:", err.message);
            return res.sendStatus(403);
        }
        req.user = user; // { id, email }
        next();
    });
};

app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email и пароль обязательны" });
    if (users.find(u => u.email === email)) return res.status(400).json({ message: "Пользователь уже существует" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = { _id: crypto.randomUUID(), email, passwordHash };
    users.push(newUser);

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: newUser._id, email: newUser.email } });
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: "Неверные учётные данные" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Неверные учётные данные" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user._id, email: user.email } });
});

app.get("/api/tasks", authenticateToken, (req, res) => {
    const userTasks = tasks.filter(t => t.userId === req.user.id);
    res.send(userTasks);
});

app.post("/api/tasks", authenticateToken, async (req, res) => {
    const { title, description } = req.body;
    const newTask = {
        _id: crypto.randomUUID(),
        userId: req.user.id,
        title: title || "Новая задача",
        description: description || "",
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    res.send(newTask);
});
app.put("/api/tasks", authenticateToken, (req, res) => {
    const index = tasks.findIndex(t => t._id === req.body._id && t.userId === req.user.id);
    if (index === -1) return res.status(404).send("Задача не найдена");
    tasks[index] = { ...tasks[index], ...req.body };
    res.send(tasks[index]);
});

app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
    const index = tasks.findIndex(t => t._id === req.params.id && t.userId === req.user.id);
    if (index === -1) return res.status(404).send("Задача не найдена");
    const deleted = tasks.splice(index, 1)[0];
    res.send(deleted);
});

app.listen(3000, () => console.log("Сервер запущен на http://localhost:3000"));