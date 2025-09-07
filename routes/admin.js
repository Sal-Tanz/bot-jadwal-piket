const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Admin dashboard
router.get('/', (req, res) => {
    // Read the dashboard HTML file
    const dashboardPath = path.join(__dirname, '..', 'views', 'dashboard.html');
    
    if (fs.existsSync(dashboardPath)) {
        const dashboard = fs.readFileSync(dashboardPath, 'utf8');
        res.send(dashboard);
    } else {
        // Fallback inline dashboard
        res.send(getDashboardHTML());
    }
});

function getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Piket Scheduler Bot</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .tab-button.active { background-color: #3B82F6; color: white; }
    </style>
</head>
<body class="bg-gray-100">
    <nav class="bg-blue-600 text-white p-4">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold">Piket Scheduler Bot - Admin Panel</h1>
            <div class="space-x-4">
                <span id="wa-status" class="px-3 py-1 rounded text-sm bg-red-500">Disconnected</span>
                <a href="/logout" class="bg-red-500 hover:bg-red-700 px-4 py-2 rounded">Logout</a>
            </div>
        </div>
    </nav>

    <div class="container mx-auto mt-8 px-4">
        <!-- Tab Navigation -->
        <div class="flex space-x-1 mb-6">
            <button class="tab-button active px-4 py-2 rounded" onclick="showTab('whatsapp')">WhatsApp Status</button>
            <button class="tab-button px-4 py-2 rounded" onclick="showTab('members')">Anggota Piket</button>
            <button class="tab-button px-4 py-2 rounded" onclick="showTab('schedules')">Jadwal Piket</button>
            <button class="tab-button px-4 py-2 rounded" onclick="showTab('test')">Test Pesan</button>
        </div>

        <!-- WhatsApp Status Tab -->
        <div id="whatsapp-tab" class="tab-content active">
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-bold mb-4">Status WhatsApp</h2>
                <div id="qr-container" class="text-center">
                    <p>Memuat status WhatsApp...</p>
                </div>
            </div>
        </div>

        <!-- Members Tab -->
        <div id="members-tab" class="tab-content">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Anggota Piket</h2>
                    <button onclick="showAddMemberForm()" class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Tambah Anggota
                    </button>
                </div>
                
                <!-- Add Member Form -->
                <div id="add-member-form" class="mb-6 p-4 border rounded hidden">
                    <h3 class="font-bold mb-4">Tambah Anggota Baru</h3>
                    <form onsubmit="addMember(event)">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <input type="text" id="member-name" placeholder="Nama Anggota" required class="border rounded px-3 py-2">
                            <input type="text" id="member-phone" placeholder="Nomor WhatsApp (628xxx)" required class="border rounded px-3 py-2">
                        </div>
                        <div class="flex space-x-2">
                            <button type="submit" class="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded">Simpan</button>
                            <button type="button" onclick="hideAddMemberForm()" class="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded">Batal</button>
                        </div>
                    </form>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full table-auto">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left">Nama</th>
                                <th class="px-4 py-2 text-left">No. WhatsApp</th>
                                <th class="px-4 py-2 text-left">Status</th>
                                <th class="px-4 py-2 text-left">Notifikasi</th>
                                <th class="px-4 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="members-list">
                            <!-- Members will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Schedules Tab -->
        <div id="schedules-tab" class="tab-content">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Jadwal Piket</h2>
                    <button onclick="showAddScheduleForm()" class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Tambah Jadwal
                    </button>
                </div>

                <!-- Add Schedule Form -->
                <div id="add-schedule-form" class="mb-6 p-4 border rounded hidden">
                    <h3 class="font-bold mb-4">Tambah Jadwal Baru</h3>
                    <form onsubmit="addSchedule(event)">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <select id="schedule-member" required class="border rounded px-3 py-2">
                                <option value="">Pilih Anggota</option>
                            </select>
                            <select id="schedule-type" required class="border rounded px-3 py-2" onchange="updateScheduleValueField()">
                                <option value="">Pilih Tipe Jadwal</option>
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="date">Tanggal Tertentu</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div id="schedule-value-container">
                                <input type="text" id="schedule-value" placeholder="Nilai Jadwal" required class="border rounded px-3 py-2 w-full">
                            </div>
                            <input type="time" id="schedule-time" required class="border rounded px-3 py-2" value="08:00">
                        </div>
                        <div class="mb-4">
                            <label class="flex items-center">
                                <input type="checkbox" id="schedule-recurring" checked class="mr-2">
                                Jadwal Berulang
                            </label>
                        </div>
                        <div class="mb-4">
                            <textarea id="schedule-message" placeholder="Template Pesan (Opsional - kosongkan untuk menggunakan template default)" 
                                      class="border rounded px-3 py-2 w-full h-24"></textarea>
                            <small class="text-gray-600">Gunakan {{name}}, {{date}}, {{time}} untuk placeholder</small>
                        </div>
                        <div class="flex space-x-2">
                            <button type="submit" class="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded">Simpan</button>
                            <button type="button" onclick="hideAddScheduleForm()" class="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded">Batal</button>
                        </div>
                    </form>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full table-auto">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left">Anggota</th>
                                <th class="px-4 py-2 text-left">Tipe</th>
                                <th class="px-4 py-2 text-left">Jadwal</th>
                                <th class="px-4 py-2 text-left">Waktu</th>
                                <th class="px-4 py-2 text-left">Berulang</th>
                                <th class="px-4 py-2 text-left">Status</th>
                                <th class="px-4 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="schedules-list">
                            <!-- Schedules will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Test Message Tab -->
        <div id="test-tab" class="tab-content">
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-bold mb-4">Test Pesan</h2>
                <form onsubmit="sendTestMessage(event)">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nomor WhatsApp</label>
                        <input type="text" id="test-phone" placeholder="628xxx" required class="border rounded px-3 py-2 w-full">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Pesan</label>
                        <textarea id="test-message" placeholder="Tulis pesan test..." required 
                                  class="border rounded px-3 py-2 w-full h-32"></textarea>
                    </div>
                    <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Kirim Test Pesan
                    </button>
                </form>
            </div>
        </div>
    </div>

    <script src="/js/dashboard.js"></script>
</body>
</html>
    `;
}

module.exports = router;
