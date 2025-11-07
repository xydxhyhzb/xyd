class ConfessionWall {
    constructor() {
        this.confessions = this.loadConfessions();
        this.currentFilter = 'all';
        this.historyMessages = this.loadHistoryMessages();
        this.selectedFiles = []; // 存储选中的文件
        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.renderWall();
    }

    // 绑定事件
    bindEvents() {
        // 表单提交事件
        document.getElementById('confessionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitConfession();
        });

        // 过滤器按钮事件
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // 文件上传事件
        this.setupFileUpload();
    }

    // 设置文件上传功能
    setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('mediaInput');
        const previewContainer = document.getElementById('previewContainer');

        // 点击上传区域触发文件选择
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择变化事件
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            fileInput.value = ''; // 重置input以便选择相同文件
        });

        // 拖拽事件
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // 移除预览项事件委托
        previewContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const fileName = e.target.dataset.file;
                this.removeFile(fileName);
            }
        });
    }

    // 处理选择的文件
    handleFiles(files) {
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];

        for (let file of files) {
            // 检查文件大小
            if (file.size > MAX_SIZE) {
                this.showErrorMessage(`文件"${file.name}"大小超过10MB限制`);
                continue;
            }

            // 检查文件类型
            if (!allowedTypes.includes(file.type)) {
                this.showErrorMessage(`不支持的文件类型: ${file.name}`);
                continue;
            }

            // 添加到已选文件列表
            if (!this.selectedFiles.find(f => f.name === file.name)) {
                this.selectedFiles.push(file);
                this.addFilePreview(file);
            }
        }
    }

    // 添加文件预览
    addFilePreview(file) {
        const previewContainer = document.getElementById('previewContainer');
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.dataset.file = file.name;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}" class="preview-image">
                    <button class="remove-btn" data-file="${file.name}">×</button>
                `;
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            previewItem.innerHTML = `
                <div class="preview-video"></div>
                <button class="remove-btn" data-file="${file.name}">×</button>
            `;
        }

        previewContainer.appendChild(previewItem);
    }

    // 移除文件
    removeFile(fileName) {
        this.selectedFiles = this.selectedFiles.filter(f => f.name !== fileName);
        const previewItem = document.querySelector(`[data-file="${fileName}"]`);
        if (previewItem) {
            previewItem.remove();
        }
    }

    // 处理媒体文件
    async processMediaFiles() {
        const mediaFiles = [];
        
        for (const file of this.selectedFiles) {
            try {
                const dataUrl = await this.fileToDataURL(file);
                mediaFiles.push({
                    name: file.name,
                    type: file.type,
                    data: dataUrl,
                    size: file.size
                });
            } catch (error) {
                console.error('处理文件失败:', error);
                this.showErrorMessage(`处理文件"${file.name}"失败`);
            }
        }
        
        return mediaFiles;
    }

    // 将文件转换为DataURL
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 重置表单（包括文件选择）
    resetForm() {
        document.getElementById('confessionForm').reset();
        this.selectedFiles = [];
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = '';
    }

    // 处理媒体文件
    async processMediaFiles() {
        const mediaFiles = [];
        
        for (const file of this.selectedFiles) {
            try {
                const dataUrl = await this.fileToDataURL(file);
                mediaFiles.push({
                    name: file.name,
                    type: file.type,
                    data: dataUrl,
                    size: file.size
                });
            } catch (error) {
                console.error('处理文件失败:', error);
                this.showErrorMessage(`处理文件"${file.name}"失败`);
            }
        }
        
        return mediaFiles;
    }

    // 将文件转换为DataURL
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 重置表单（包括文件选择）
    resetForm() {
        document.getElementById('confessionForm').reset();
        this.selectedFiles = [];
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = '';
    }

    // 提交表白
    async submitConfession() {
        const to = document.getElementById('to').value.trim();
        const from = document.getElementById('from').value.trim() || '匿名';
        const content = document.getElementById('content').value.trim();
        const type = document.getElementById('type').value;

        if (!to || !content) {
            alert('请填写接收人和表白内容！');
            return;
        }

        // 处理媒体文件
        const mediaFiles = await this.processMediaFiles();
        
        const confession = {
            id: Date.now(),
            to: to,
            from: from,
            content: content,
            type: type,
            timestamp: new Date().toLocaleString('zh-CN'),
            likes: 0,
            media: mediaFiles
        };

        this.confessions.unshift(confession);
        this.saveConfessions();
        this.renderWall();
        this.resetForm();
        
        // 显示成功提示
        this.showSuccessMessage('表白发布成功！');
    }

    // 重置表单
    resetForm() {
        document.getElementById('confessionForm').reset();
    }

    // 设置过滤器
    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderWall();
    }

    // 渲染表白墙
    renderWall() {
        const wall = document.getElementById('wall');
        const filteredConfessions = this.currentFilter === 'all' 
            ? this.confessions 
            : this.confessions.filter(c => c.type === this.currentFilter);

        if (filteredConfessions.length === 0) {
            wall.innerHTML = `
                <div class="empty-wall">
                    <div style="font-size: 4rem; margin-bottom: 20px;">💭</div>
                    <p>暂无表白内容</p>
                    <p style="font-size: 0.9rem; margin-top: 10px; color: #aaa;">
                        ${this.currentFilter === 'all' ? '快来发布第一条表白吧！' : '该分类下暂无表白内容'}
                    </p>
                </div>
            `;
            return;
        }

        wall.innerHTML = filteredConfessions.map(confession => {
            let mediaContent = '';
            
            // 如果有媒体文件，生成媒体内容
            if (confession.media && confession.media.length > 0) {
                mediaContent = confession.media.map(media => {
                    if (media.type.startsWith('image/')) {
                        return `<div class="card-media"><img src="${media.data}" alt="${media.name}"></div>`;
                    } else if (media.type.startsWith('video/')) {
                        return `<div class="card-media"><video src="${media.data}" controls></video></div>`;
                    }
                    return '';
                }).join('');
            }
            
            return `
                <div class="confession-card ${confession.type}">
                    <div class="card-header">
                        <div class="card-to">致：${this.escapeHtml(confession.to)}</div>
                        <div class="card-type">${this.getTypeIcon(confession.type)}</div>
                    </div>
                    <div class="card-content">${this.escapeHtml(confession.content)}</div>
                    ${mediaContent}
                    <div class="card-from">—— ${this.escapeHtml(confession.from)}</div>
                    <div class="card-time">${confession.timestamp}</div>
                    <div class="card-actions">
                        <button class="like-btn" onclick="confessionWall.likeConfession(${confession.id})">
                            ❤️ ${confession.likes}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 点赞功能
    likeConfession(id) {
        const confession = this.confessions.find(c => c.id === id);
        if (confession) {
            confession.likes++;
            this.saveConfessions();
            this.renderWall();
        }
    }

    // 获取类型图标
    getTypeIcon(type) {
        const icons = {
            love: '💘',
            friendship: '🤝',
            admiration: '🌟',
            thanks: '🙏'
        };
        return icons[type] || '💕';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 显示成功消息（一直显示）
    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            border-left: 5px solid #388E3C;
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
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        };
        
        notification.appendChild(closeBtn);
        document.body.appendChild(notification);

        // 添加CSS动画
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 加载表白数据
    loadConfessions() {
        try {
            const saved = localStorage.getItem('confessions');
            return saved ? JSON.parse(saved) : [
                {
                    id: 1,
                    to: '全体同学',
                    from: '校园小助手',
                    content: '欢迎来到校园表白墙！在这里，你可以勇敢表达自己的心意，让爱传递整个校园。无论是爱情、友情还是感谢，都值得被看见和珍惜！',
                    type: 'thanks',
                    timestamp: new Date().toLocaleString('zh-CN'),
                    likes: 5
                }
            ];
        } catch (error) {
            console.error('加载表白数据失败:', error);
            return [];
        }
    }

    // 保存表白数据
    saveConfessions() {
        try {
            localStorage.setItem('confessions', JSON.stringify(this.confessions));
        } catch (error) {
            console.error('保存表白数据失败:', error);
        }
    }
}

// 初始化应用
const confessionWall = new ConfessionWall();

// 添加历史消息管理功能
class HistoryManager {
    constructor() {
        this.messages = [];
        this.loadMessages();
        this.setupHistoryButton();
    }

    // 加载历史消息
    loadMessages() {
        try {
            const saved = localStorage.getItem('historyMessages');
            this.messages = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载历史消息失败:', error);
            this.messages = [];
        }
    }

    // 保存历史消息
    saveMessages() {
        try {
            localStorage.setItem('historyMessages', JSON.stringify(this.messages));
        } catch (error) {
            console.error('保存历史消息失败:', error);
        }
    }

    // 添加新消息
    addMessage(type, content) {
        const message = {
            id: Date.now(),
            type: type,
            content: content,
            timestamp: new Date().toLocaleString('zh-CN'),
            read: false
        };
        
        this.messages.unshift(message);
        // 保留最近100条消息
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(0, 100);
        }
        
        this.saveMessages();
        this.updateBadge();
    }

    // 设置历史按钮
    setupHistoryButton() {
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryPanel();
            });
        }
        this.updateBadge();
    }

    // 更新未读消息徽章
    updateBadge() {
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            const unreadCount = this.messages.filter(msg => !msg.read).length;
            
            // 移除旧的徽章
            const oldBadge = historyBtn.querySelector('.badge');
            if (oldBadge) {
                oldBadge.remove();
            }
            
            // 如果有未读消息，添加徽章
            if (unreadCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = unreadCount;
                badge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 10px;
                    min-width: 16px;
                    text-align: center;
                `;
                historyBtn.style.position = 'relative';
                historyBtn.appendChild(badge);
            }
        }
    }

    // 显示历史消息面板
    showHistoryPanel() {
        // 创建或更新历史面板
        let panel = document.getElementById('historyPanel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'historyPanel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 2000;
                display: flex;
                flex-direction: column;
            `;
            
            // 面板头部
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 20px;
                border-bottom: 2px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const title = document.createElement('h3');
            title.textContent = '📜 历史消息管理';
            title.style.margin = '0';
            title.style.color = '#333';
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onclick = () => {
                document.body.removeChild(panel);
            };
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            
            // 消息容器
            const content = document.createElement('div');
            content.id = 'historyContent';
            content.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 0;
            `;
            
            // 操作栏
            const actions = document.createElement('div');
            actions.style.cssText = `
                padding: 15px 20px;
                border-top: 2px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const clearBtn = document.createElement('button');
            clearBtn.textContent = '🗑️ 清空历史';
            clearBtn.style.cssText = `
                background: #e74c3c;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            clearBtn.onclick = () => {
                if (confirm('确定要清空所有历史消息吗？此操作不可撤销！')) {
                    this.messages = [];
                    this.saveMessages();
                    this.renderHistory();
                    this.updateBadge();
                }
            };
            
            const markAllReadBtn = document.createElement('button');
            markAllReadBtn.textContent = '✅ 全部已读';
            markAllReadBtn.style.cssText = `
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            markAllReadBtn.onclick = () => {
                this.messages.forEach(msg => msg.read = true);
                this.saveMessages();
                this.renderHistory();
                this.updateBadge();
            };
            
            actions.appendChild(clearBtn);
            actions.appendChild(markAllReadBtn);
            
            panel.appendChild(header);
            panel.appendChild(content);
            panel.appendChild(actions);
            
            document.body.appendChild(panel);
        }
        
        this.renderHistory();
        
        // 标记所有消息为已读
        this.messages.forEach(msg => msg.read = true);
        this.saveMessages();
        this.updateBadge();
    }

    // 渲染历史消息
    renderHistory() {
        const content = document.getElementById('historyContent');
        if (!content) return;
        
        if (this.messages.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #888;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                    <p style="font-size: 1.2rem;">暂无历史消息</p>
                    <p style="margin-top: 10px;">所有操作消息都会在这里记录</p>
                </div>
            `;
            return;
        }
        
        content.innerHTML = this.messages.map(message => `
            <div class="history-message ${message.read ? 'read' : 'unread'}" style="
                padding: 15px 20px;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.3s;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <span style="font-weight: bold; color: #333;">
                        ${this.getMessageTypeIcon(message.type)} ${this.getMessageTypeText(message.type)}
                    </span>
                    <span style="color: #888; font-size: 12px;">${message.timestamp}</span>
                </div>
                <div style="color: #666; line-height: 1.4;">${this.escapeHtml(message.content)}</div>
            </div>
        `).join('');
        
        // 添加悬停效果
        const messages = content.querySelectorAll('.history-message');
        messages.forEach(msg => {
            msg.addEventListener('mouseenter', () => {
                msg.style.background = '#f8f9fa';
            });
            msg.addEventListener('mouseleave', () => {
                msg.style.background = '';
            });
        });
    }

    // 获取消息类型图标
    getMessageTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || '💬';
    }

    // 获取消息类型文本
    getMessageTypeText(type) {
        const texts = {
            success: '成功',
            error: '错误',
            info: '信息',
            warning: '警告'
        };
        return texts[type] || '消息';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化历史消息管理器
const historyManager = new HistoryManager();

// 重写显示成功消息方法，使其同时记录到历史
const originalShowSuccessMessage = confessionWall.showSuccessMessage;
confessionWall.showSuccessMessage = function(message) {
    historyManager.addMessage('success', message);
    return originalShowSuccessMessage.call(this, message);
};

// 添加错误消息记录
confessionWall.showErrorMessage = function(message) {
    historyManager.addMessage('error', message);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        border-left: 5px solid #C62828;
    `;
    notification.textContent = message;
    
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
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    };
    
    notification.appendChild(closeBtn);
    document.body.appendChild(notification);
};

// 添加历史消息管理功能
class HistoryManager {
    constructor() {
        this.messages = [];
        this.loadMessages();
        this.setupHistoryButton();
    }

    // 加载历史消息
    loadMessages() {
        try {
            const saved = localStorage.getItem('historyMessages');
            this.messages = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载历史消息失败:', error);
            this.messages = [];
        }
    }

    // 保存历史消息
    saveMessages() {
        try {
            localStorage.setItem('historyMessages', JSON.stringify(this.messages));
        } catch (error) {
            console.error('保存历史消息失败:', error);
        }
    }

    // 添加新消息
    addMessage(type, content) {
        const message = {
            id: Date.now(),
            type: type,
            content: content,
            timestamp: new Date().toLocaleString('zh-CN'),
            read: false
        };
        
        this.messages.unshift(message);
        // 保留最近100条消息
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(0, 100);
        }
        
        this.saveMessages();
        this.updateBadge();
    }

    // 设置历史按钮
    setupHistoryButton() {
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryPanel();
            });
        }
        this.updateBadge();
    }

    // 更新未读消息徽章
    updateBadge() {
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            const unreadCount = this.messages.filter(msg => !msg.read).length;
            
            // 移除旧的徽章
            const oldBadge = historyBtn.querySelector('.badge');
            if (oldBadge) {
                oldBadge.remove();
            }
            
            // 如果有未读消息，添加徽章
            if (unreadCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = unreadCount;
                badge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 10px;
                    min-width: 16px;
                    text-align: center;
                `;
                historyBtn.style.position = 'relative';
                historyBtn.appendChild(badge);
            }
        }
    }

    // 显示历史消息面板
    showHistoryPanel() {
        // 创建或更新历史面板
        let panel = document.getElementById('historyPanel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'historyPanel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 2000;
                display: flex;
                flex-direction: column;
            `;
            
            // 面板头部
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 20px;
                border-bottom: 2px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const title = document.createElement('h3');
            title.textContent = '📜 历史消息管理';
            title.style.margin = '0';
            title.style.color = '#333';
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onclick = () => {
                document.body.removeChild(panel);
            };
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            
            // 消息容器
            const content = document.createElement('div');
            content.id = 'historyContent';
            content.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 0;
            `;
            
            // 操作栏
            const actions = document.createElement('div');
            actions.style.cssText = `
                padding: 15px 20px;
                border-top: 2px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const clearBtn = document.createElement('button');
            clearBtn.textContent = '🗑️ 清空历史';
            clearBtn.style.cssText = `
                background: #e74c3c;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            clearBtn.onclick = () => {
                if (confirm('确定要清空所有历史消息吗？此操作不可撤销！')) {
                    this.messages = [];
                    this.saveMessages();
                    this.renderHistory();
                    this.updateBadge();
                }
            };
            
            const markAllReadBtn = document.createElement('button');
            markAllReadBtn.textContent = '✅ 全部已读';
            markAllReadBtn.style.cssText = `
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            markAllReadBtn.onclick = () => {
                this.messages.forEach(msg => msg.read = true);
                this.saveMessages();
                this.renderHistory();
                this.updateBadge();
            };
            
            actions.appendChild(clearBtn);
            actions.appendChild(markAllReadBtn);
            
            panel.appendChild(header);
            panel.appendChild(content);
            panel.appendChild(actions);
            
            document.body.appendChild(panel);
        }
        
        this.renderHistory();
        
        // 标记所有消息为已读
        this.messages.forEach(msg => msg.read = true);
        this.saveMessages();
        this.updateBadge();
    }

    // 渲染历史消息
    renderHistory() {
        const content = document.getElementById('historyContent');
        if (!content) return;
        
        if (this.messages.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #888;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                    <p style="font-size: 1.2rem;">暂无历史消息</p>
                    <p style="margin-top: 10px;">所有操作消息都会在这里记录</p>
                </div>
            `;
            return;
        }
        
        content.innerHTML = this.messages.map(message => `
            <div class="history-message ${message.read ? 'read' : 'unread'}" style="
                padding: 15px 20px;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.3s;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <span style="font-weight: bold; color: #333;">
                        ${this.getMessageTypeIcon(message.type)} ${this.getMessageTypeText(message.type)}
                    </span>
                    <span style="color: #888; font-size: 12px;">${message.timestamp}</span>
                </div>
                <div style="color: #666; line-height: 1.4;">${this.escapeHtml(message.content)}</div>
            </div>
        `).join('');
        
        // 添加悬停效果
        const messages = content.querySelectorAll('.history-message');
        messages.forEach(msg => {
            msg.addEventListener('mouseenter', () => {
                msg.style.background = '#f8f9fa';
            });
            msg.addEventListener('mouseleave', () => {
                msg.style.background = '';
            });
        });
    }

    // 获取消息类型图标
    getMessageTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || '💬';
    }

    // 获取消息类型文本
    getMessageTypeText(type) {
        const texts = {
            success: '成功',
            error: '错误',
            info: '信息',
            warning: '警告'
        };
        return texts[type] || '消息';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化历史消息管理器
const historyManager = new HistoryManager();

// 重写显示成功消息方法，使其同时记录到历史
const originalShowSuccessMessage = confessionWall.showSuccessMessage;
confessionWall.showSuccessMessage = function(message) {
    historyManager.addMessage('success', message);
    return originalShowSuccessMessage.call(this, message);
};

// 添加错误消息记录
confessionWall.showErrorMessage = function(message) {
    historyManager.addMessage('error', message);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        border-left: 5px solid #C62828;
    `;
    notification.textContent = message;
    
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
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    };
    
    notification.appendChild(closeBtn);
    document.body.appendChild(notification);
};

// 添加历史消息管理功能
class HistoryManager {
    constructor() {
        this.messages = [];
        this.loadMessages();
        this.setupHistoryButton();
    }

    // 加载历史消息
    loadMessages() {
        try {
            const saved = localStorage.getItem('historyMessages');
            this.messages = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载历史消息失败:', error);
            this.messages = [];
        }
    }

    // 保存历史消息
    saveMessages() {
        try {
            localStorage.setItem('historyMessages', JSON.stringify(this.messages));
        } catch (error) {
            console.error('保存历史消息失败:', error);
        }
    }

    // 添加新消息
    addMessage(type, content) {
        const message = {
            id: Date.now(),
            type: type,
            content: content,
            timestamp: new Date().toLocaleString('zh-CN'),
            read: false
        };
        
        this.messages.unshift(message);
        // 保留最近100条消息
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(0, 100);
        }
        
        this.saveMessages();
        this.updateBadge();
    }

    // 设置历史按钮
    setupHistoryButton() {
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryPanel();
            });
        }
        this.updateBadge();
    }

    // 更新未读消息徽章
    updateBadge() {
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            const unreadCount = this.messages.filter(msg => !msg.read).length;
            
            // 移除旧的徽章
            const oldBadge = historyBtn.querySelector('.badge');
            if (oldBadge) {
                oldBadge.remove();
            }
            
            // 如果有未读消息，添加徽章
            if (unreadCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = unreadCount;
                badge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 10px;
                    min-width: 16px;
                    text-align: center;
                `;
                historyBtn.style.position = 'relative';
                historyBtn.appendChild(badge);
            }
        }
    }

    // 显示历史消息面板
    showHistoryPanel() {
        // 创建或更新历史面板
        let panel = document.getElementById('historyPanel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'historyPanel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 2000;
                display: flex;
                flex-direction: column;
            `;
            
            // 面板头部
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 20px;
                border-bottom: 2px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const title = document.createElement('h3');
            title.textContent = '📜 历史消息管理';
            title.style.margin = '0';
            title.style.color = '#333';
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onclick = () => {
                document.body.removeChild(panel);
            };
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            
            // 消息容器
            const content = document.createElement('div');
            content.id = 'historyContent';
            content.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 0;
            `;
            
            // 操作栏
            const actions = document.createElement('div');
            actions.style.cssText = `
                padding: 15px 20px;
                border-top: 2px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const clearBtn = document.createElement('button');
            clearBtn.textContent = '🗑️ 清空历史';
            clearBtn.style.cssText = `
                background: #e74c3c;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            clearBtn.onclick = () => {
                if (confirm('确定要清空所有历史消息吗？此操作不可撤销！')) {
                    this.messages = [];
                    this.saveMessages();
                    this.renderHistory();
                    this.updateBadge();
                }
            };
            
            const markAllReadBtn = document.createElement('button');
            markAllReadBtn.textContent = '✅ 全部已读';
            markAllReadBtn.style.cssText = `
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            markAllReadBtn.onclick = () => {
                this.messages.forEach(msg => msg.read = true);
                this.saveMessages();
                this.renderHistory();
                this.updateBadge();
            };
            
            actions.appendChild(clearBtn);
            actions.appendChild(markAllReadBtn);
            
            panel.appendChild(header);
            panel.appendChild(content);
            panel.appendChild(actions);
            
            document.body.appendChild(panel);
        }
        
        this.renderHistory();
        
        // 标记所有消息为已读
        this.messages.forEach(msg => msg.read = true);
        this.saveMessages();
        this.updateBadge();
    }

    // 渲染历史消息
    renderHistory() {
        const content = document.getElementById('historyContent');
        if (!content) return;
        
        if (this.messages.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #888;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                    <p style="font-size: 1.2rem;">暂无历史消息</p>
                    <p style="margin-top: 10px;">所有操作消息都会在这里记录</p>
                </div>
            `;
            return;
        }
        
        content.innerHTML = this.messages.map(message => `
            <div class="history-message ${message.read ? 'read' : 'unread'}" style="
                padding: 15px 20px;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.3s;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <span style="font-weight: bold; color: #333;">
                        ${this.getMessageTypeIcon(message.type)} ${this.getMessageTypeText(message.type)}
                    </span>
                    <span style="color: #888; font-size: 12px;">${message.timestamp}</span>
                </div>
                <div style="color: #666; line-height: 1.4;">${this.escapeHtml(message.content)}</div>
            </div>
        `).join('');
        
        // 添加悬停效果
        const messages = content.querySelectorAll('.history-message');
        messages.forEach(msg => {
            msg.addEventListener('mouseenter', () => {
                msg.style.background = '#f8f9fa';
            });
            msg.addEventListener('mouseleave', () => {
                msg.style.background = '';
            });
        });
    }

    // 获取消息类型图标
    getMessageTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || '💬';
    }

    // 获取消息类型文本
    getMessageTypeText(type) {
        const texts = {
            success: '成功',
            error: '错误',
            info: '信息',
            warning: '警告'
        };
        return texts[type] || '消息';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化历史消息管理器
const historyManager = new HistoryManager();

// 重写显示成功消息方法，使其同时记录到历史
const originalShowSuccessMessage = confessionWall.showSuccessMessage;
confessionWall.showSuccessMessage = function(message) {
    historyManager.addMessage('success', message);
    return originalShowSuccessMessage.call(this, message);
};

// 添加错误消息记录
confessionWall.showErrorMessage = function(message) {
    historyManager.addMessage('error', message);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        border-left: 5px solid #C62828;
    `;
    notification.textContent = message;
    
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
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    };
    
    notification.appendChild(closeBtn);
    document.body.appendChild(notification);
};

// 添加历史消息管理功能
class HistoryManager {
    constructor() {
        this.messages = [];
        this.loadMessages();
        this.setupHistoryButton();
    }

    // 加载历史消息
    loadMessages() {
        try {
            const saved = localStorage.getItem('historyMessages');
            this.messages = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载历史消息失败:', error);
            this.messages = [];
        }
    }

    // 保存历史消息
    saveMessages() {
        try {
            localStorage.setItem('historyMessages', JSON.stringify(this.messages));
        } catch (error) {
            console.error('保存历史消息失败:', error);
        }
    }

    // 添加新消息
    addMessage(type, content) {
        const message = {
            id: Date.now(),
            type: type,
            content: content,
            timestamp: new Date().toLocaleString('zh-CN'),
            read: false
        };
        
        this.messages.unshift(message);
        // 保留最近100条消息
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(0, 100);
        }
        
        this.saveMessages();
        this.updateBadge();
    }

    // 设置历史按钮
    setupHistoryButton() {
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryPanel();
            });
        }
        this.updateBadge();
    }

    // 更新未读消息徽章
    updateBadge() {
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            const unreadCount = this.messages.filter(msg => !msg.read).length;
            
            // 移除旧的徽章
            const oldBadge = historyBtn.querySelector('.badge');
            if (oldBadge) {
                oldBadge.remove();
            }
            
            // 如果有未读消息，添加徽章
            if (unreadCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = unreadCount;
                badge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 10px;
                    min-width: 16px;
                    text-align: center;
                `;
                historyBtn.style.position = 'relative';
                historyBtn.appendChild(badge);
            }
        }
    }

    // 显示历史消息面板
    showHistoryPanel() {
        // 创建或更新历史面板
        let panel = document.getElementById('historyPanel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'historyPanel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 2000;
                display: flex;
                flex-direction: column;
            `;
            
            // 面板头部
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 20px;
                border-bottom: 2px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const title = document.createElement('h3');
            title.textContent = '📜 历史消息管理';
            title.style.margin = '0';
            title.style.color = '#333';
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onclick = () => {
                document.body.removeChild(panel);
            };
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            
            // 消息容器
            const content = document.createElement('div');
            content.id = 'historyContent';
            content.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 0;
            `;
            
            // 操作栏
            const actions = document.createElement('div');
            actions.style.cssText = `
                padding: 15px 20px;
                border-top: 2px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const clearBtn = document.createElement('button');
            clearBtn.textContent = '🗑️ 清空历史';
            clearBtn.style.cssText = `
                background: #e74c3c;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            clearBtn.onclick = () => {
                if (confirm('确定要清空所有历史消息吗？此操作不可撤销！')) {
                    this.messages = [];
                    this.saveMessages();
                    this.renderHistory();
                    this.updateBadge();
                }
            };
            
            const markAllReadBtn = document.createElement('button');
            markAllReadBtn.textContent = '✅ 全部已读';
            markAllReadBtn.style.cssText = `
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            markAllReadBtn.onclick = () => {
                this.messages.forEach(msg => msg.read = true);
                this.saveMessages();
                this.renderHistory();
                this.updateBadge();
            };
            
            actions.appendChild(clearBtn);
            actions.appendChild(markAllReadBtn);
            
            panel.appendChild(header);
            panel.appendChild(content);
            panel.appendChild(actions);
            
            document.body.appendChild(panel);
        }
        
        this.renderHistory();
        
        // 标记所有消息为已读
        this.messages.forEach(msg => msg.read = true);
        this.saveMessages();
        this.updateBadge();
    }

    // 渲染历史消息
    renderHistory() {
        const content = document.getElementById('historyContent');
        if (!content) return;
        
        if (this.messages.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #888;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                    <p style="font-size: 1.2rem;">暂无历史消息</p>
                    <p style="margin-top: 10px;">所有操作消息都会在这里记录</p>
                </div>
            `;
            return;
        }
        
        content.innerHTML = this.messages.map(message => `
            <div class="history-message ${message.read ? 'read' : 'unread'}" style="
                padding: 15px 20px;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.3s;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <span style="font-weight: bold; color: #333;">
                        ${this.getMessageTypeIcon(message.type)} ${this.getMessageTypeText(message.type)}
                    </span>
                    <span style="color: #888; font-size: 12px;">${message.timestamp}</span>
                </div>
                <div style="color: #666; line-height: 1.4;">${this.escapeHtml(message.content)}</div>
            </div>
        `).join('');
        
        // 添加悬停效果
        const messages = content.querySelectorAll('.history-message');
        messages.forEach(msg => {
            msg.addEventListener('mouseenter', () => {
                msg.style.background = '#f8f9fa';
            });
            msg.addEventListener('mouseleave', () => {
                msg.style.background = '';
            });
        });
    }

    // 获取消息类型图标
    getMessageTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || '💬';
    }

    // 获取消息类型文本
    getMessageTypeText(type) {
        const texts = {
            success: '成功',
            error: '错误',
            info: '信息',
            warning: '警告'
        };
        return texts[type] || '消息';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化历史消息管理器
const historyManager = new HistoryManager();

// 重写显示成功消息方法，使其同时记录到历史
const originalShowSuccessMessage = confessionWall.showSuccessMessage;
confessionWall.showSuccessMessage = function(message) {
    historyManager.addMessage('success', message);
    return originalShowSuccessMessage.call(this, message);
};

// 添加错误消息记录
confessionWall.showErrorMessage = function(message) {
    historyManager.addMessage('error', message);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        border-left: 5px solid #C62828;
    `;
    notification.textContent = message;
    
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
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    };
    
    notification.appendChild(closeBtn);
    document.body.appendChild(notification);
};

// 添加一些样式到卡片操作区域
const style = document.createElement('style');
style.textContent = `
    .card-actions {
        margin-top: 15px;
        display: flex;
        justify-content: flex-end;
    }
    
    .like-btn {
        background: transparent;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 5px 12px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.9rem;
    }
    
    .like-btn:hover {
        background: #ffebee;
        border-color: #e91e63;
        color: #e91e63;
    }
`;
document.head.appendChild(style);