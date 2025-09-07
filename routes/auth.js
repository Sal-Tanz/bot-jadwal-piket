const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const router = express.Router();

module.exports = function(db) {
    // Login page
    router.get('/login', (req, res) => {
        if (req.session.adminId) {
            return res.redirect('/admin');
        }

        const loginPath = path.join(__dirname, '..', 'views', 'login.html');
        let loginHtml = fs.readFileSync(loginPath, 'utf8');

        if (req.query.error) {
            const errorHtml = '<div class="bg-red-500 bg-opacity-50 border border-red-700 text-white px-4 py-3 rounded mb-6 text-center">Username atau password salah!</div>';
            loginHtml = loginHtml.replace('<div id="error-container"></div>', errorHtml);
        }

        res.send(loginHtml);
    });

    // Login handler
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        
        db.get("SELECT * FROM admins WHERE username = ?", [username], (err, admin) => {
            if (err || !admin || !bcrypt.compareSync(password, admin.password)) {
                return res.redirect('/login?error=1');
            }
            
            req.session.adminId = admin.id;
            res.redirect('/admin');
        });
    });

    // Logout
    router.get('/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    });

    // Root redirect
    router.get('/', (req, res) => {
        if (req.session.adminId) {
            res.redirect('/admin');
        } else {
            res.redirect('/login');
        }
    });

    return router;
};
