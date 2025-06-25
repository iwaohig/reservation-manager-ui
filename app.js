// メイン管理アプリケーション
class ReservationManager {
    constructor(token, owner, repo) {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
        this.scheduleData = null;
        this.cronSchedules = [];
        this.editingIndex = -1;
    }

    async initialize() {
        try {
            await this.loadData();
            this.renderUI();
            this.updateScheduleDisplay();
            this.updateReservationDisplay();
            return true;
        } catch (error) {
            console.error('初期化エラー:', error);
            this.showAlert('データ読み込みエラー: ' + error.message, 'error');
            return false;
        }
    }

    async loadData() {
        // schedule.json読み込み
        const scheduleResponse = await fetch(
            `https://api.github.com/repos/${this.owner}/${this.repo}/contents/config/schedule.json`,
            {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!scheduleResponse.ok) {
            throw new Error('schedule.jsonの読み込みに失敗しました');
        }

        const scheduleFile = await scheduleResponse.json();
        const decodedContent = decodeURIComponent(escape(atob(scheduleFile.content)));
        this.scheduleData = JSON.parse(decodedContent);
        this.scheduleData._sha = scheduleFile.sha;

        // ワークフローファイル読み込み
        const workflowResponse = await fetch(
            `https://api.github.com/repos/${this.owner}/${this.repo}/contents/.github/workflows/two-stage-automation.yml`,
            {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!workflowResponse.ok) {
            throw new Error('ワークフローファイルの読み込みに失敗しました');
        }

        const workflowFile = await workflowResponse.json();
        const workflowContent = decodeURIComponent(escape(atob(workflowFile.content)));
        this.parseCronSchedules(workflowContent);
    }

    parseCronSchedules(yamlContent) {
        this.cronSchedules = [];
        const lines = yamlContent.split('\n');
        const cronRegex = /- cron:\s*'([^']+)'/;

        for (const line of lines) {
            const match = line.match(cronRegex);
            if (match) {
                this.cronSchedules.push(match[1]);
            }
        }
    }

    getNextExecutions() {
        const executions = [];
        const now = new Date();

        this.cronSchedules.forEach(cron => {
            try {
                const parts = cron.split(' ');
                const [minute, hour, day, month, dayOfWeek] = parts;
                const jstHour = (parseInt(hour) + 9) % 24;
                
                let description = '';
                if (dayOfWeek !== '*') {
                    const days = ['日', '月', '火', '水', '木', '金', '土'];
                    const dayNames = dayOfWeek.split(',').map(d => days[parseInt(d)]).join('・');
                    description = `毎週${dayNames}曜日`;
                } else if (day !== '*' && month !== '*') {
                    description = `${month}月${day}日`;
                } else if (day !== '*') {
                    description = `毎月${day}日`;
                }

                description += ` ${jstHour}:${minute.padStart(2, '0')} JST`;

                executions.push({
                    cron: cron,
                    description: description,
                    time: `${jstHour}:${minute.padStart(2, '0')}`
                });
            } catch (e) {
                console.error('Cron parse error:', e);
            }
        });

        return executions;
    }

    getTasksForDate(date) {
        if (!this.scheduleData || !this.scheduleData.reservations) return [];
        return this.scheduleData.reservations.filter(r => r.date === date && r.enabled);
    }

    renderUI() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="main-app">
                <div class="app-header">
                    <h2>📋 ${this.owner}/${this.repo}</h2>
                    <button class="btn btn-small btn-secondary" onclick="reservationManager.logout()">ログアウト</button>
                </div>

                <!-- 次回実行予定 -->
                <div class="section">
                    <h3><span class="icon">📅</span>次回実行予定</h3>
                    <div id="scheduleList">
                        <div class="loading"></div>
                    </div>
                </div>

                <!-- 予約一覧 -->
                <div class="section">
                    <h3><span class="icon">📋</span>予約一覧</h3>
                    <div id="reservationList">
                        <div class="loading"></div>
                    </div>
                </div>

                <!-- 新規追加ボタン -->
                <button class="fab" onclick="reservationManager.openAddModal()">+</button>

                <!-- 編集モーダル -->
                <div id="editModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="reservationManager.closeModal()">&times;</span>
                        <h3>予約編集</h3>
                        <form id="editForm">
                            <div class="input-group">
                                <label for="editDate">実行日</label>
                                <input type="date" id="editDate" required>
                            </div>
                            <div class="input-group">
                                <label for="editReservationId">予約ID</label>
                                <input type="text" id="editReservationId" required>
                            </div>
                            <div class="input-group">
                                <label for="editDays">延長日数</label>
                                <input type="number" id="editDays" min="1" max="7" value="1" required>
                            </div>
                            <div class="input-group">
                                <label for="editNote">メモ</label>
                                <input type="text" id="editNote" placeholder="任意">
                            </div>
                            <div class="input-group">
                                <label>
                                    <input type="checkbox" id="editEnabled" checked>
                                    有効にする
                                </label>
                            </div>
                            <div style="display: flex; gap: 10px; margin-top: 20px;">
                                <button type="submit" class="btn">保存</button>
                                <button type="button" class="btn btn-secondary" onclick="reservationManager.closeModal()">キャンセル</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // フォーム送信イベント
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReservation();
        });

        // モーダル外クリックで閉じる
        window.onclick = (event) => {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                this.closeModal();
            }
        };
    }

    updateScheduleDisplay() {
        const container = document.getElementById('scheduleList');
        const executions = this.getNextExecutions();
        
        if (executions.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="icon">📅</div>スケジュールがありません</div>';
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        container.innerHTML = executions.map((exec, index) => {
            const tasks = this.getTasksForDate(today).concat(this.getTasksForDate(tomorrow));
            const isNext = index === 0;
            
            return `
                <div class="schedule-item ${isNext ? 'next' : ''}">
                    <div class="schedule-time">${exec.description}</div>
                    ${isNext && tasks.length > 0 ? `
                        <div class="schedule-tasks">
                            ${tasks.map(t => `
                                <span class="task-badge ${t.enabled ? 'active' : ''}">
                                    予約ID: ${t.reservation_id}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    updateReservationDisplay() {
        const container = document.getElementById('reservationList');
        
        if (!this.scheduleData || !this.scheduleData.reservations || this.scheduleData.reservations.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="icon">📋</div>予約がありません</div>';
            return;
        }

        container.innerHTML = this.scheduleData.reservations.map((reservation, index) => `
            <div class="reservation-card ${reservation.enabled ? 'enabled' : ''}">
                <div class="reservation-header">
                    <div>
                        <div class="reservation-date">${reservation.date}</div>
                        <div class="reservation-id">ID: ${reservation.reservation_id}</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" ${reservation.enabled ? 'checked' : ''} 
                               onchange="reservationManager.toggleReservation(${index})">
                        <span class="slider"></span>
                    </label>
                </div>
                <div>延長: ${reservation.days}日</div>
                ${reservation.note ? `<div style="color: #6c757d; font-size: 14px; margin-top: 5px;">${reservation.note}</div>` : ''}
                <div class="reservation-actions">
                    <button class="btn btn-small" onclick="reservationManager.editReservation(${index})">編集</button>
                    <button class="btn btn-small btn-danger" onclick="reservationManager.deleteReservation(${index})">削除</button>
                </div>
            </div>
        `).join('');
    }

    async toggleReservation(index) {
        this.scheduleData.reservations[index].enabled = !this.scheduleData.reservations[index].enabled;
        await this.saveScheduleData();
    }

    editReservation(index) {
        this.editingIndex = index;
        const reservation = this.scheduleData.reservations[index];
        
        document.getElementById('editDate').value = reservation.date;
        document.getElementById('editReservationId').value = reservation.reservation_id;
        document.getElementById('editDays').value = reservation.days;
        document.getElementById('editNote').value = reservation.note || '';
        document.getElementById('editEnabled').checked = reservation.enabled;
        
        document.getElementById('editModal').style.display = 'block';
    }

    openAddModal() {
        this.editingIndex = -1;
        document.getElementById('editForm').reset();
        document.getElementById('editDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('editModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    async deleteReservation(index) {
        if (!confirm('この予約を削除しますか？')) return;
        
        this.scheduleData.reservations.splice(index, 1);
        await this.saveScheduleData();
    }

    async saveReservation() {
        const formData = {
            date: document.getElementById('editDate').value,
            reservation_id: document.getElementById('editReservationId').value,
            action: 'extend',
            days: parseInt(document.getElementById('editDays').value),
            enabled: document.getElementById('editEnabled').checked,
            note: document.getElementById('editNote').value
        };

        if (this.editingIndex === -1) {
            this.scheduleData.reservations.push(formData);
        } else {
            this.scheduleData.reservations[this.editingIndex] = formData;
        }

        await this.saveScheduleData();
        this.closeModal();
    }

    async saveScheduleData() {
        try {
            const jsonString = JSON.stringify(this.scheduleData, null, 2);
            const content = btoa(unescape(encodeURIComponent(jsonString)));
            
            const response = await fetch(
                `https://api.github.com/repos/${this.owner}/${this.repo}/contents/config/schedule.json`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: 'Update schedule.json via reservation manager UI',
                        content: content,
                        sha: this.scheduleData._sha
                    })
                }
            );

            if (!response.ok) {
                throw new Error('保存に失敗しました');
            }

            const result = await response.json();
            this.scheduleData._sha = result.content.sha;
            
            this.updateScheduleDisplay();
            this.updateReservationDisplay();
            this.showAlert('保存しました', 'success');
        } catch (error) {
            this.showAlert('保存エラー: ' + error.message, 'error');
        }
    }

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        document.body.insertBefore(alert, document.body.firstChild);
        
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    logout() {
        localStorage.removeItem('github_auth_token');
        localStorage.removeItem('github_repo_owner');
        localStorage.removeItem('github_repo_name');
        location.reload();
    }
}