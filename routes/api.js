const express = require('express');
const router = express.Router();

module.exports = function(db, client, isClientReady) {
    // WhatsApp status API
    router.get('/whatsapp-status', (req, res) => {
        res.json({
            isReady: isClientReady,
            qrCode: global.qrCode || ''
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

    return router;
};
