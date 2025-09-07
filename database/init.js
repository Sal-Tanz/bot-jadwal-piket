const bcrypt = require('bcryptjs');

module.exports = function(db) {
    // Initialize database tables
    db.serialize(() => {
        // Tabel admin
        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabel anggota piket
        db.run(`CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            is_active INTEGER DEFAULT 1,
            notifications_enabled INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabel jadwal piket
        db.run(`CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER,
            schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'date'
            schedule_value TEXT NOT NULL, -- day name or date
            time TEXT NOT NULL DEFAULT '08:00',
            is_recurring INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1,
            message_template TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_id) REFERENCES members (id)
        )`);

        // Tabel pesan template
        db.run(`CREATE TABLE IF NOT EXISTS message_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insert default admin jika belum ada
        db.get("SELECT COUNT(*) as count FROM admins", (err, row) => {
            if (row.count === 0) {
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                db.run("INSERT INTO admins (username, password) VALUES (?, ?)", 
                    ['admin', hashedPassword]);
            }
        });

        // Insert default message template
        db.get("SELECT COUNT(*) as count FROM message_templates", (err, row) => {
            if (row.count === 0) {
                const defaultMessage = `🔔 *Reminder Piket*

Halo {{name}}, ini adalah pengingat bahwa hari ini giliran piket Anda.

📅 Tanggal: {{date}}
⏰ Waktu: {{time}}

Terima kasih atas kerjasamanya! 🙏`;

                db.run("INSERT INTO message_templates (name, message, is_default) VALUES (?, ?, ?)", 
                    ['Default Template', defaultMessage, 1]);
            }
        });
    });
};
