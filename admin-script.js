// 后台管理脚本
class AdminManager {
    constructor() {
        this.confessions = [];
        this.currentSearch = '';
        this.init();
    }

    // 初始化
    init() {
        this.checkAuth();
        this.loadData();
        this.bindEvents();
        this.updateStats();
        this.renderTable();
        this.updateSystemInfo();
    }

    // 检查认证状态
    checkAuth() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
        const currentTime = new Date().getTime();
        
        // 检查是否在30分钟内登录
        const timeDiff = currentTime - loginTime;
        const isExpired = timeDiff > 30 * 60 * 1000; // 30分钟过期

        if (!isLoggedIn || isExpired) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('loginTime');
            window.location.href = 'admin.html';
            return;
        }

        // 更新最后登录时间
        localStorage.setItem('loginTime', currentTime.toString());
    }

    // 加载数据
    loadData() {
        try {
            const saved = localStorage.getItem('confessions');
            this.confessions = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载数据失败:', error);
            this.confessions = [];
        }
    }

    // 绑定事件
    bindEvents() {
        // 搜索输入框事件
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.renderTable();
        });

        // 回车搜索
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchConfessions();
            }
        });
    }

    // 更新统计信息
    updateStats() {
        const totalConfessions = this.confessions.length;
        const loveCount = this.confessions.filter(c => c.type === 'love').length;
        const friendshipCount = this.confessions.filter(c => c.type === 'friendship').length;
        const totalLikes = this.confessions.reduce((sum, c) => sum + (c.likes || 0), 0);

        document.getElementById('totalConfessions').textContent = totalConfessions;
        document.getElementById('loveCount').textContent = loveCount;
        document.getElementById('friendshipCount').textContent = friendshipCount;
        document.getElementById('totalLikes').textContent = totalLikes;
    }

    // 渲染表格
    renderTable() {
        const tbody = document.getElementById('confessionsTableBody');
        
        // 过滤数据
        let filteredConfessions = this.confessions;
        if (this.currentSearch.trim()) {
            const searchTerm = this.currentSearch.toLowerCase();
            filteredConfessions = this.confessions.filter(c => 
                c.to.toLowerCase().includes(searchTerm) ||
                c.from.toLowerCase().includes(searchTerm) ||
                c.content.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredConfessions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                        <p style="color: #888; font-size: 1.2rem;">没有找到匹配的表白数据</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredConfessions.map(confession => `
            <tr>
                <td>${confession.id}</td>
                <td><strong>${this.escapeHtml(confession.to)}</strong></td>
                <td>${this.escapeHtml(confession.from)}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${this.escapeHtml(confession.content)}
                </td>
                <td>
                    <span class="type-badge type-${confession.type}">
                        ${this.getTypeLabel(confession.type)}
                    </span>
                </td>
                <td>${confession.likes || 0}</td>
                <td>${confession.timestamp}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminManager.viewConfession(${confession.id})">
                            👁️ 查看
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminManager.deleteConfession(${confession.id})">
                            🗑️ 删除
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 获取类型标签
    getTypeLabel(type) {
        const labels = {
            love: '💘 爱情',
            friendship: '🤝 友情',
            admiration: '🌟 欣赏',
            thanks: '🙏 感谢'
        };
        return labels[type] || '💕 其他';
    }

    // 查看表白详情
    viewConfession(id) {
        const confession = this.confessions.find(c => c.id === id);
        if (confession) {
            this.showModal('表白详情', `
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div><strong>致：</strong>${this.escapeHtml(confession.to)}</div>
                        <div><strong>来自：</strong>${this.escapeHtml(confession.from)}</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong>类型：</strong>
                        <span class="type-badge type-${confession.type}">${this.getTypeLabel(confession.type)}</span>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong>内容：</strong>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            ${this.escapeHtml(confession.content)}
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><strong>点赞数：</strong>${confession.likes || 0}</div>
                        <div><strong>发布时间：</strong>${confession.timestamp}</div>
                    </div>
                </div>
            `);
        }
    }

    // 删除表白
    deleteConfession(id) {
        if (confirm('确定要删除这条表白吗？此操作不可撤销！')) {
            this.confessions = this.confessions.filter(c => c.id !== id);
            this.saveData();
            this.updateStats();
            this.renderTable();
            this.showNotification('表白删除成功！', 'success');
        }
    }

    // 搜索表白
    searchConfessions() {
        this.renderTable();
    }

    // 清除搜索
    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.currentSearch = '';
        this.renderTable();
    }

    // 导出数据
    exportData() {
        const data = JSON.stringify(this.confessions, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `confessions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('数据导出成功！', 'success');
    }

    // 清空所有数据
    clearAllData() {
        if (confirm('⚠️ 确定要清空所有数据吗？此操作将删除所有表白内容，且无法恢复！')) {
            this.confessions = [];
            this.saveData();
            this.updateStats();
            this.renderTable();
            this.showNotification('所有数据已清空！', 'success');
        }
    }

    // 重置为演示数据
    resetDemoData() {
        if (confirm('确定要重置为演示数据吗？当前数据将被替换。')) {
            this.confessions = [
                {
                    id: 1,
                    to: '全体同学',
                    from: '校园小助手',
                    content: '欢迎来到校园表白墙！在这里，你可以勇敢表达自己的心意，让爱传递整个校园。无论是爱情、友情还是感谢，都值得被看见和珍惜！',
                    type: 'thanks',
                    timestamp: new Date().toLocaleString('zh-CN'),
                    likes: 5
                },
                {
                    id: 2,
                    to: '李同学',
                    from: '默默关注你的人',
                    content: '每次看到你在图书馆认真学习的样子，都觉得特别迷人。希望能有机会认识你！',
                    type: 'admiration',
                    timestamp: new Date(Date.now() - 3600000).toLocaleString('zh-CN'),
                    likes: 3
                },
                {
                    id: 3,
                    to: '王小明',
                    from: '你的好朋友',
                    content: '感谢你在我最困难的时候一直陪伴着我，你是我最好的朋友！',
                    type: 'friendship',
                    timestamp: new Date(Date.now() - 7200000).toLocaleString('zh-CN'),
                    likes: 8
                }
            ];
            this.saveData();
            this.updateStats();
            this.renderTable();
            this.showNotification('已重置为演示数据！', 'success');
        }
    }

    // 更新系统信息
    updateSystemInfo() {
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
            const lastLogin = new Date(parseInt(loginTime));
            document.getElementById('lastLoginTime').textContent = lastLogin.toLocaleString('zh-CN');
        }

        // 计算数据大小
        const dataSize = new Blob([JSON.stringify(this.confessions)]).size;
        const sizeKB = (dataSize / 1024).toFixed(2);
        document.getElementById('dataSize').textContent = `${sizeKB} KB`;
    }

    // 保存数据
    saveData() {
        try {
            localStorage.setItem('confessions', JSON.stringify(this.confessions));
        } catch (error) {
            console.error('保存数据失败:', error);
            this.showNotification('保存数据失败！', 'error');
        }
    }

    // 显示模态框
    showModal(title, content) {
        const modalHtml = `
            <div id="adminModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            ">
                <div style="
                    background: white;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <div style="
                        padding: 20px;
                        border-bottom: 2px solid #f0f0f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <h3 style="margin: 0; color: #333;">${title}</h3>
                        <button onclick="adminManager.closeModal()" style="
                            background: none;
                            border: none;
                            font-size: 1.5rem;
                            cursor: pointer;
                            color: #666;
                        ">×</button>
                    </div>
                    <div>${content}</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.remove();
        }
    }

    // 显示通知（一直显示）
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#e74c3c' : '#3498db';
        const borderColor = type === 'success' ? '#388E3C' : type === 'error' ? '#C62828' : '#1565C0';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            border-left: 5px solid ${borderColor};
            min-width: 250px;
        `;
        notification.textContent = message;
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 8px;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        };
        
        notification.appendChild(closeBtn);
        document.body.appendChild(notification);

        // 添加动画样式
        if (!document.querySelector('#notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('loginTime');
            window.location.href = 'admin.html';
        }
    }
}

// 全局函数（供HTML调用）
function logout() {
    adminManager.logout();
}

function exportData() {
    adminManager.exportData();
}

function searchConfessions() {
    adminManager.searchConfessions();
}

function clearSearch() {
    adminManager.clearSearch();
}

function clearAllData() {
    adminManager.clearAllData();
}

function resetDemoData() {
    adminManager.resetDemoData();
}

// 初始化管理实例
const adminManager = new AdminManager();