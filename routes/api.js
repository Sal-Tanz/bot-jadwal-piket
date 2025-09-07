const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

module.exports = function(db, client, getWaStatus) {
    // WhatsApp status API
    router.get('/whatsapp-status', (req, res) => {
        const { isClientReady, qrCode } = getWaStatus();
        res.json({
            isReady: isClientReady,
            qrCode: qrCode || ''
        });
    });

    // Stats API
    router.get('/stats', (req, res) => {
        const sql = `
            SELECT
              (SELECT COUNT(*) FROM members) as totalMembers,
              (SELECT COUNT(*) FROM members WHERE is_active = 1) as activeMembers,
              (SELECT COUNT(*) FROM schedules) as totalSchedules,
              (SELECT COUNT(*) FROM schedules WHERE is_active = 1) as activeSchedules
        `;
        db.get(sql, (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Gagal mengambil statistik' });
            }
            res.json(row);
        });
    });

    // Members API
    router.get('/members', (req, res) => {
        db.all("SELECT * FROM members ORDER BY name", (err, members) => {
            res.json(members || []);
        });
    });

    router.post('/members', (req, res) => {
        const { name, phone } = req.body;
        
        db.run("INSERT INTO members (name, phone) VALUES (?, ?)", 
            [name, phone], function(err) {
                if (err) {
                    return res.status(400).json({ error: 'Nomor telepon sudah terdaftar' });
                }
                res.json({ id: this.lastID, message: 'Anggota berhasil ditambahkan' });
            });
    });

    router.put('/members/:id', (req, res) => {
        const { id } = req.params;
        const { name, phone, is_active, notifications_enabled } = req.body;
        
        db.run("UPDATE members SET name = ?, phone = ?, is_active = ?, notifications_enabled = ? WHERE id = ?", 
            [name, phone, is_active ? 1 : 0, notifications_enabled ? 1 : 0, id], (err) => {
                if (err) {
                    return res.status(400).json({ error: 'Gagal mengupdate anggota' });
                }
                res.json({ message: 'Anggota berhasil diupdate' });
            });
    });

    router.delete('/members/:id', (req, res) => {
        const { id } = req.params;
        
        db.run("DELETE FROM members WHERE id = ?", [id], (err) => {
            if (err) {
                return res.status(400).json({ error: 'Gagal menghapus anggota' });
            }
            res.json({ message: 'Anggota berhasil dihapus' });
        });
    });

    // Schedules API
    router.get('/schedules', (req, res) => {
        const sql = `
            SELECT s.*, m.name as member_name, m.phone 
            FROM schedules s 
            LEFT JOIN members m ON s.member_id = m.id 
            ORDER BY s.created_at DESC
        `;
        
        db.all(sql, (err, schedules) => {
            res.json(schedules || []);
        });
    });

    router.post('/schedules', (req, res) => {
        const { member_id, schedule_type, schedule_value, time, is_recurring, message_template } = req.body;
        
        db.run(`INSERT INTO schedules 
                (member_id, schedule_type, schedule_value, time, is_recurring, message_template) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
            [member_id, schedule_type, schedule_value, time, is_recurring ? 1 : 0, message_template], 
            function(err) {
                if (err) {
                    return res.status(400).json({ error: 'Gagal menambahkan jadwal' });
                }
                res.json({ id: this.lastID, message: 'Jadwal berhasil ditambahkan' });
            });
    });

    router.put('/schedules/:id', (req, res) => {
        const { id } = req.params;
        const { member_id, schedule_type, schedule_value, time, is_recurring, is_active, message_template } = req.body;
        
        db.run(`UPDATE schedules SET 
                member_id = ?, schedule_type = ?, schedule_value = ?, time = ?, 
                is_recurring = ?, is_active = ?, message_template = ? 
                WHERE id = ?`, 
            [member_id, schedule_type, schedule_value, time, 
             is_recurring ? 1 : 0, is_active ? 1 : 0, message_template, id], (err) => {
                if (err) {
                    return res.status(400).json({ error: 'Gagal mengupdate jadwal' });
                }
                res.json({ message: 'Jadwal berhasil diupdate' });
            });
    });

    router.delete('/schedules/:id', (req, res) => {
        const { id } = req.params;
        
        db.run("DELETE FROM schedules WHERE id = ?", [id], (err) => {
            if (err) {
                return res.status(400).json({ error: 'Gagal menghapus jadwal' });
            }
            res.json({ message: 'Jadwal berhasil dihapus' });
        });
    });

    // Message Templates API
    router.get('/templates', (req, res) => {
        db.all("SELECT * FROM message_templates ORDER BY name", (err, templates) => {
            res.json(templates || []);
        });
    });

    // Test message API
    router.post('/test-message', async (req, res) => {
        const { phone, message } = req.body;
        const { isClientReady } = getWaStatus();
        
        if (!isClientReady) {
            return res.status(400).json({ error: 'WhatsApp client belum siap' });
        }
        
        try {
            const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
            await client.sendMessage(chatId, message);
            res.json({ message: 'Pesan test berhasil dikirim' });
        } catch (error) {
            res.status(400).json({ error: 'Gagal mengirim pesan: ' + error.message });
        }
    });

    // Admin credentials API
    router.put('/admin/credentials', (req, res) => {
        if (!req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { currentPassword, newUsername, newPassword } = req.body;
        const adminId = req.session.adminId;

        db.get("SELECT * FROM admins WHERE id = ?", [adminId], (err, admin) => {
            if (err || !admin) {
                return res.status(500).json({ error: 'Gagal mengambil data admin.' });
            }

            if (!bcrypt.compareSync(currentPassword, admin.password)) {
                return res.status(401).json({ error: 'Password saat ini salah.' });
            }

            let queryParts = [];
            let params = [];

            if (newUsername) {
                queryParts.push("username = ?");
                params.push(newUsername);
            }

            if (newPassword) {
                queryParts.push("password = ?");
                const hashedPassword = bcrypt.hashSync(newPassword, 10);
                params.push(hashedPassword);
            }

            if (queryParts.length === 0) {
                return res.status(400).json({ error: 'Tidak ada data yang diubah.' });
            }

            params.push(adminId);
            const sql = `UPDATE admins SET ${queryParts.join(', ')} WHERE id = ?`;

            db.run(sql, params, function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed: admins.username')) {
                        return res.status(400).json({ error: 'Username tersebut sudah digunakan.' });
                    }
                    return res.status(500).json({ error: 'Gagal memperbarui kredensial.' });
                }
                res.json({ message: 'Kredensial berhasil diperbarui.' });
            });
        });
    });

    return router;
};
