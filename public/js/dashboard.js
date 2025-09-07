// Dashboard JavaScript Functions

// Tab functionality
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'members') loadMembers();
    if (tabName === 'schedules') loadSchedules();
}

// WhatsApp status check
function checkWhatsAppStatus() {
    fetch('/api/whatsapp-status')
        .then(response => response.json())
        .then(data => {
            const statusEl = document.getElementById('wa-status');
            const qrContainer = document.getElementById('qr-container');
            
            if (data.isReady) {
                statusEl.textContent = 'Connected';
                statusEl.className = 'px-3 py-1 rounded text-sm bg-green-500';
                qrContainer.innerHTML = '<p class="text-green-600 font-bold">✅ WhatsApp terhubung dan siap digunakan!</p>';
            } else if (data.qrCode) {
                statusEl.textContent = 'Waiting for QR Scan';
                statusEl.className = 'px-3 py-1 rounded text-sm bg-yellow-500';
                qrContainer.innerHTML = `
                    <p class="mb-4">Scan QR Code berikut dengan WhatsApp Anda:</p>
                    <img src="${data.qrCode}" alt="QR Code" class="mx-auto" style="max-width: 256px;">
                `;
            } else {
                statusEl.textContent = 'Initializing...';
                statusEl.className = 'px-3 py-1 rounded text-sm bg-gray-500';
                qrContainer.innerHTML = '<p>Menginisialisasi WhatsApp client...</p>';
            }
        })
        .catch(error => {
            console.error('Error checking WhatsApp status:', error);
        });
}

// Members functions
function loadMembers() {
    fetch('/api/members')
        .then(response => response.json())
        .then(members => {
            const tbody = document.getElementById('members-list');
            tbody.innerHTML = '';
            
            members.forEach(member => {
                // Escape member data for onclick attribute
                const memberData = JSON.stringify(member).replace(/'/g, "\\'");

                tbody.innerHTML += `
                    <tr class="border-b">
                        <td class="px-4 py-2">${member.name}</td>
                        <td class="px-4 py-2">${member.phone}</td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-1 rounded text-sm ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${member.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-1 rounded text-sm ${member.notifications_enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                                ${member.notifications_enabled ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </td>
                        <td class="px-4 py-2">
                            <button onclick='toggleMemberStatus(${memberData})' class="bg-yellow-500 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm mr-1">Toggle Status</button>
                            <button onclick='toggleMemberNotifications(${memberData})' class="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-1">Toggle Notif</button>
                            <button onclick="deleteMember(${member.id})" class="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-sm">Hapus</button>
                        </td>
                    </tr>
                `;
            });
            
            // Update schedule member options
            const memberSelect = document.getElementById('schedule-member');
            if (memberSelect) {
                memberSelect.innerHTML = '<option value="">Pilih Anggota</option>';
                members.forEach(member => {
                    memberSelect.innerHTML += `<option value="${member.id}">${member.name}</option>`;
                });
            }
        })
        .catch(error => {
            console.error('Error loading members:', error);
        });
}

function showAddMemberForm() {
    document.getElementById('add-member-form').classList.remove('hidden');
}

function hideAddMemberForm() {
    document.getElementById('add-member-form').classList.add('hidden');
    document.getElementById('member-name').value = '';
    document.getElementById('member-phone').value = '';
}

function addMember(event) {
    event.preventDefault();
    const name = document.getElementById('member-name').value;
    const phone = document.getElementById('member-phone').value;

    fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            alert('Anggota berhasil ditambahkan!');
            hideAddMemberForm();
            loadMembers();
        }
    })
    .catch(error => {
        console.error('Error adding member:', error);
        alert('Terjadi kesalahan saat menambahkan anggota');
    });
}

function toggleMemberStatus(member) {
    if (confirm('Toggle status aktif anggota ini?')) {
        const newStatus = !member.is_active;

        fetch(`/api/members/${member.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: member.name,
                phone: member.phone,
                is_active: newStatus,
                notifications_enabled: member.notifications_enabled
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                alert('Status anggota berhasil diupdate!');
                loadMembers();
            }
        })
        .catch(error => {
            console.error('Error toggling member status:', error);
            alert('Terjadi kesalahan saat mengupdate status');
        });
    }
}

function toggleMemberNotifications(member) {
    if (confirm('Toggle notifikasi anggota ini?')) {
        const newNotificationStatus = !member.notifications_enabled;

        fetch(`/api/members/${member.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: member.name,
                phone: member.phone,
                is_active: member.is_active,
                notifications_enabled: newNotificationStatus
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                alert('Notifikasi anggota berhasil diupdate!');
                loadMembers();
            }
        })
        .catch(error => {
            console.error('Error toggling member notifications:', error);
            alert('Terjadi kesalahan saat mengupdate notifikasi');
        });
    }
}

function deleteMember(id) {
    if (confirm('Yakin ingin menghapus anggota ini?')) {
        fetch(`/api/members/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert('Anggota berhasil dihapus!');
                loadMembers();
            })
            .catch(error => {
                console.error('Error deleting member:', error);
                alert('Terjadi kesalahan saat menghapus anggota');
            });
    }
}

// Schedule functions
function loadSchedules() {
    fetch('/api/schedules')
        .then(response => response.json())
        .then(schedules => {
            const tbody = document.getElementById('schedules-list');
            tbody.innerHTML = '';
            
            schedules.forEach(schedule => {
                let scheduleDisplay = '';
                if (schedule.schedule_type === 'daily') {
                    scheduleDisplay = 'Setiap Hari';
                } else if (schedule.schedule_type === 'weekly') {
                    scheduleDisplay = capitalizeFirst(schedule.schedule_value);
                } else if (schedule.schedule_type === 'date') {
                    scheduleDisplay = formatDate(schedule.schedule_value);
                }

                tbody.innerHTML += `
                    <tr class="border-b">
                        <td class="px-4 py-2">${schedule.member_name || 'N/A'}</td>
                        <td class="px-4 py-2">${capitalizeFirst(schedule.schedule_type)}</td>
                        <td class="px-4 py-2">${scheduleDisplay}</td>
                        <td class="px-4 py-2">${schedule.time}</td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-1 rounded text-sm ${schedule.is_recurring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                ${schedule.is_recurring ? 'Ya' : 'Sekali'}
                            </span>
                        </td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-1 rounded text-sm ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${schedule.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </td>
                        <td class="px-4 py-2">
                            <button onclick="toggleSchedule(${schedule.id})" class="bg-yellow-500 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm mr-1">Toggle</button>
                            <button onclick="deleteSchedule(${schedule.id})" class="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-sm">Hapus</button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error('Error loading schedules:', error);
        });
}

function showAddScheduleForm() {
    document.getElementById('add-schedule-form').classList.remove('hidden');
    loadMembers(); // Ensure member options are loaded
}

function hideAddScheduleForm() {
    document.getElementById('add-schedule-form').classList.add('hidden');
    // Reset form
    document.getElementById('schedule-member').value = '';
    document.getElementById('schedule-type').value = '';
    document.getElementById('schedule-value').value = '';
    document.getElementById('schedule-time').value = '08:00';
    document.getElementById('schedule-recurring').checked = true;
    document.getElementById('schedule-message').value = '';
    updateScheduleValueField();
}

function updateScheduleValueField() {
    const type = document.getElementById('schedule-type').value;
    const valueContainer = document.getElementById('schedule-value-container');
    
    if (type === 'daily') {
        valueContainer.innerHTML = '<input type="hidden" id="schedule-value" value="daily">';
    } else if (type === 'weekly') {
        valueContainer.innerHTML = `
            <select id="schedule-value" required class="border rounded px-3 py-2 w-full">
                <option value="">Pilih Hari</option>
                <option value="monday">Senin</option>
                <option value="tuesday">Selasa</option>
                <option value="wednesday">Rabu</option>
                <option value="thursday">Kamis</option>
                <option value="friday">Jumat</option>
                <option value="saturday">Sabtu</option>
                <option value="sunday">Minggu</option>
            </select>
        `;
    } else if (type === 'date') {
        const today = new Date().toISOString().split('T')[0];
        valueContainer.innerHTML = `<input type="date" id="schedule-value" required class="border rounded px-3 py-2 w-full" min="${today}">`;
    } else {
        valueContainer.innerHTML = '<input type="text" id="schedule-value" placeholder="Nilai Jadwal" required class="border rounded px-3 py-2 w-full">';
    }
}

function addSchedule(event) {
    event.preventDefault();
    const member_id = document.getElementById('schedule-member').value;
    const schedule_type = document.getElementById('schedule-type').value;
    const schedule_value = document.getElementById('schedule-value').value;
    const time = document.getElementById('schedule-time').value;
    const is_recurring = document.getElementById('schedule-recurring').checked;
    const message_template = document.getElementById('schedule-message').value;

    fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            member_id,
            schedule_type,
            schedule_value,
            time,
            is_recurring,
            message_template
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            alert('Jadwal berhasil ditambahkan!');
            hideAddScheduleForm();
            loadSchedules();
        }
    })
    .catch(error => {
        console.error('Error adding schedule:', error);
        alert('Terjadi kesalahan saat menambahkan jadwal');
    });
}

function toggleSchedule(id) {
    if (confirm('Toggle status aktif jadwal ini?')) {
        fetch('/api/schedules')
            .then(response => response.json())
            .then(schedules => {
                const schedule = schedules.find(s => s.id === id);
                if (schedule) {
                    const newStatus = !schedule.is_active;
                    fetch(`/api/schedules/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            member_id: schedule.member_id,
                            schedule_type: schedule.schedule_type,
                            schedule_value: schedule.schedule_value,
                            time: schedule.time,
                            is_recurring: schedule.is_recurring,
                            is_active: newStatus,
                            message_template: schedule.message_template
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        alert('Status jadwal berhasil diupdate!');
                        loadSchedules();
                    });
                }
            });
    }
}

function deleteSchedule(id) {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
        fetch(`/api/schedules/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert('Jadwal berhasil dihapus!');
                loadSchedules();
            })
            .catch(error => {
                console.error('Error deleting schedule:', error);
                alert('Terjadi kesalahan saat menghapus jadwal');
            });
    }
}

// Test message function
function sendTestMessage(event) {
    event.preventDefault();
    const phone = document.getElementById('test-phone').value;
    const message = document.getElementById('test-message').value;

    fetch('/api/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            alert('Pesan test berhasil dikirim!');
            document.getElementById('test-phone').value = '';
            document.getElementById('test-message').value = '';
        }
    })
    .catch(error => {
        console.error('Error sending test message:', error);
        alert('Terjadi kesalahan saat mengirim pesan test');
    });
}

// Helper functions
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    checkWhatsAppStatus();
    setInterval(checkWhatsAppStatus, 5000); // Check every 5 seconds
    loadMembers();
    
    // Store qrCode globally for whatsapp status updates
    window.qrCodeGlobal = '';
});
