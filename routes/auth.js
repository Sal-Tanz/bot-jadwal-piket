const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

module.exports = function(db) {
    // Login page
    router.get('/login', (req, res) => {
        if (req.session.adminId) {
            return res.redirect('/admin');
        }
        res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Login - Piket Scheduler Bot</title>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            </head>
            <body class="bg-gray-100 min-h-screen flex items-center justify-center">
                <div class="bg-white p-8 rounded-lg shadow-md w-96">
                    <h1 class="text-2xl font-bold text-center mb-6 text-gray-800">Login Admin</h1>
                    ${req.query.error ? '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">Username atau password salah!</div>' : ''}
                    <form action="/login" method="POST">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
                                Username
                            </label>
                            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                   id="username" name="username" type="text" placeholder="Username" required>
                        </div>
                        <div class="mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                                Password
                            </label>
                            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
                                   id="password" name="password" type="password" placeholder="Password" required>
                        </div>
                        <div class="flex items-center justify-between">
                            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" 
                                    type="submit">
                                Login
                            </button>
                        </div>
                    </form>
                    <div class="mt-4 text-center text-sm text-gray-600">
                        Default login: admin / admin123
                    </div>
                </div>
            </body>
            </html>
        `);
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
