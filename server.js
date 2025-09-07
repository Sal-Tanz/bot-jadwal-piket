const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cron = require('node-cron');
const QRCode = require('qrcode');
const moment = require('moment');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'piket-bot-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 jam
}));

// Database setup
const db = new sqlite3.Database('piket_bot.db');

// Initialize database
require('./database/init')(db);

// WhatsApp Client setup
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let qrCode = '';
let isClientReady = false;

client.on('qr', async (qr) => {
    console.log('QR Code received');
    qrCode = await QRCode.toDataURL(qr);
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    isClientReady = true;
    qrCode = '';
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    isClientReady = false;
});

// Initialize WhatsApp client
client.initialize();

// Middleware untuk autentikasi
function requireAuth(req, res, next) {
    if (req.session.adminId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Import routes
const authRoutes = require('./routes/auth')(db);
const apiRoutes = require('./routes/api')(db, client, isClientReady);
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/', authRoutes);
app.use('/api', requireAuth, apiRoutes);
app.use('/admin', requireAuth, adminRoutes);

// Cron job untuk mengirim pesan piket
const cronJob = require('./services/cronJob')(db, client, () => isClientReady);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Default login: admin / admin123');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close();
    client.destroy();
    process.exit(0);
});
