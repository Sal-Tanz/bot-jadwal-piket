const cron = require('node-cron');
const moment = require('moment');

module.exports = function(db, client, isClientReady) {
    // Cron job untuk mengirim pesan piket setiap menit
    const cronJob = cron.schedule('* * * * *', async () => {
        if (!isClientReady()) return;
        
        const now = moment();
        const currentTime = now.format('HH:mm');
        const currentDay = now.format('dddd').toLowerCase();
        const currentDate = now.format('YYYY-MM-DD');
        
        console.log(`Checking schedules at ${currentTime} on ${currentDay} (${currentDate})`);
        
        // Query untuk mencari jadwal yang harus dijalankan
        const sql = `
            SELECT s.*, m.name, m.phone, m.notifications_enabled
            FROM schedules s
            JOIN members m ON s.member_id = m.id
            WHERE s.is_active = 1 AND m.is_active = 1 AND m.notifications_enabled = 1 AND s.time = ?
            AND (
                (s.schedule_type = 'daily') OR
                (s.schedule_type = 'weekly' AND LOWER(s.schedule_value) = ?) OR
                (s.schedule_type = 'date' AND s.schedule_value = ?)
            )
        `;
        
        db.all(sql, [currentTime, currentDay, currentDate], async (err, schedules) => {
            if (err) {
                console.error('Database error:', err);
                return;
            }
            
            if (!schedules || schedules.length === 0) {
                return; // No schedules to process
            }
            
            console.log(`Found ${schedules.length} schedule(s) to process`);
            
            for (const schedule of schedules) {
                try {
                    let message = schedule.message_template;
                    
                    // Jika tidak ada template khusus, gunakan template default
                    if (!message) {
                        const defaultTemplate = await getDefaultTemplate(db);
                        message = defaultTemplate;
                    }
                    
                    // Replace template variables
                    message = message.replace(/{{name}}/g, schedule.name);
                    message = message.replace(/{{date}}/g, now.format('DD/MM/YYYY'));
                    message = message.replace(/{{time}}/g, currentTime);
                    
                    // Format phone number
                    const chatId = schedule.phone.includes('@') ? schedule.phone : `${schedule.phone}@c.us`;
                    
                    // Send message
                    await client.sendMessage(chatId, message);
                    
                    console.log(`✅ Pesan piket dikirim ke ${schedule.name} (${schedule.phone})`);
                    
                    // Jika jadwal tidak berulang dan tipe date, nonaktifkan
                    if (!schedule.is_recurring && schedule.schedule_type === 'date') {
                        db.run("UPDATE schedules SET is_active = 0 WHERE id = ?", [schedule.id], (err) => {
                            if (err) {
                                console.error(`Error deactivating schedule ${schedule.id}:`, err);
                            } else {
                                console.log(`Schedule ${schedule.id} deactivated (one-time date schedule)`);
                            }
                        });
                    }
                } catch (error) {
                    console.error(`❌ Gagal mengirim pesan ke ${schedule.name}:`, error.message);
                }
            }
        });
    });

    // Helper function to get default template
    function getDefaultTemplate(db) {
        return new Promise((resolve) => {
            db.get("SELECT message FROM message_templates WHERE is_default = 1", (err, row) => {
                if (err || !row) {
                    // Fallback message if no default template
                    resolve(`🔔 *Reminder Piket*

Halo {{name}}, ini adalah pengingat bahwa hari ini giliran piket Anda.

📅 Tanggal: {{date}}
⏰ Waktu: {{time}}

Terima kasih atas kerjasamanya! 🙏`);
                } else {
                    resolve(row.message);
                }
            });
        });
    }

    console.log('✅ Cron job for piket reminders started');
    
    return cronJob;
};
