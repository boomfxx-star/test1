let chatHistory = []; 
let currentSaveId = null; // 记录当前正在玩的存档ID

// 页面加载时自动读取现有的存档列表
window.onload = function() {
    refreshArchiveList();
    // 顺便帮玩家自动读取上次输入的 API Key（免得每次都要贴）
    const savedKey = localStorage.getItem('novel_api_key');
    if (savedKey) document.getElementById('apiKey').value = savedKey;
};

// ✨ 初始化：注入自定义设定，创造新世界
async function startGame() {
    const key = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value; 
    
    const playerSetup = document.getElementById('setupPlayer').value.trim();
    const npcSetup = document.getElementById('setupNpc').value.trim();
    const plotSetup = document.getElementById('setupPlot').value.trim();

    if (!key) {
        alert("请先输入您的 API Key！");
        return;
    }
    
    // 缓存 API Key
    localStorage.setItem('novel_api_key', key);
    currentSaveId = 'save_' + Date.now(); // 开启全新档ID

    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('output').style.display = 'flex';
    document.querySelector('.control-box').style.display = 'flex';
    document.getElementById('output').innerHTML = ''; // 清空上一局画面

    const loadingId = appendMessage('system', `🌌 正在根据您的自定义设定创造世界 [${model}]...`);

    const systemInstruction = `你是一个顶级文字自助手游GM。现在请根据玩家提供的自定义设定，开启一局全新的高沉浸感模拟游戏。
【核心语言要求】：你的每一次回复、每一次剧情描写、选项和状态栏更新，都必须严格、全程使用【简体中文】！绝对不允许出现繁体字。

[玩家人设]: ${playerSetup} （【铁律】：请严格记住玩家的生理特征：其外貌、声音、骨骼、肌肤、体香与体态皆为完美的女性，【唯独私密部位具备雄性特征】。在互动叙事与状态更新中，严禁出现任何其他男性化描写如胡须、粗糙皮肤、男性声音或雄性体格，必须保持极致的女性美感与魅力）
[NPC状态及私密设定]: ${npcSetup}
[初始舞台与剧本背景]: ${plotSetup}

【铁律：你的每一次回复，包括接下来的第一发开场，都必须完整包裹在 <div class="card">...</div> 的 HTML 结构中输出！】
你必须严格套用以下 HTML 类名与标签结构输出：
1. <div class="card">：总包裹。
2. <div class="cake-row">：内含 3 个符合当前气氛的 Emoji。
3. <div class="weather-wrap"><span class="weather-text">：长句描写当前世界环境、风吹、气味、地貌等高级细节。
4. <div class="info-row">：内含 3 个 <span> 分别记录短标签：天气、时间、精确地点。
5. <div class="story-box">：使用多个 <p> 标签精美描写当前的最新剧情进展（使用简体中文）。
6. <div class="dual-details">：内含两个 <details>，分别记录 👤玩家状态（紧扣玩家100%女性化外观但私密特殊的特特征） 和 🌿环境状态。
7. <details class="her-details" open>：内含 👩NPC状态，核心必须包含一个 <div class="thought-line">💭 描写她此时此刻最真实的心理活动</div>，以及服装、动作。
8. 在NPC状态内嵌入 <details class="private-details"><summary>😉 私密部位</summary><div class="private-tags">，用 <span> 动态列出各部位状态（如口腔、胸部、小穴、后穴等，根据设定自由增减）。
9. <div class="choices">：给出 4 个符合当前最新剧情的 A/B/C/D 选项按钮外观（如 <div class="choice-btn">A：xxx</div>）。

现在，请根据玩家提供的自定义设定，直接生成这局游戏的【第一张开场卡片】。不要有任何解释，直接输出 HTML。`;

    chatHistory = [{ role: "user", parts: [{ text: systemInstruction }] }];

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory }) 
        });
        
        const textData = await response.text();
        let data;
        try { data = JSON.parse(textData); } catch(ee) {
            removeMessage(loadingId);
            appendMessage('system', "❌ 网络节点返回了错误页面，请更换代理节点。");
            return;
        }

        removeMessage(loadingId);
        
        if (data.error) {
            appendMessage('system', "❌ 初始化失败: " + data.error.message);
            return;
        } 

        if (data.candidates && data.candidates[0]) {
            const candidate = data.candidates[0];
            if (candidate.finishReason === "SAFETY") {
                appendMessage('system', "⚠️ 镜像世界崩塌：因包含高度敏感词，已被 Google 安全过滤器拦截！请修正输入词。");
                return;
            }
            if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                let replyText = candidate.content.parts[0].text;
                replyText = replyText.replace(/```html/g, '').replace(/```/g, '').trim();
                
                appendMessage('model', replyText);
                chatHistory.push({ role: "model", parts: [{ text: replyText }] });
                autoSaveData(); // 成功后自动存盘一次
                return;
            }
        }
        appendMessage('system', "❌ 无法解析返回的数据。");
    } catch (e) {
        removeMessage(loadingId);
        appendMessage('system', "❌ 连接失败，请检查网络。");
    }
}

// 🕹️ 回合推进
async function sendMessage() {
    const key = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value; 
    const inputField = document.getElementById('userInput');
    const input = inputField.value.trim();
    
    if (!input) return;

    appendMessage('user', `我的行动：${input}`);
    inputField.value = '';
    chatHistory.push({ role: "user", parts: [{ text: input }] });

    const loadingId = appendMessage('system', `⏳ 因果推演中...`);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory }) 
        });
        
        const data = await response.json();
        removeMessage(loadingId);
        
        if (data.error) {
            appendMessage('system', "❌ API 报错: " + data.error.message);
        } else if (data.candidates && data.candidates[0].content) {
            let replyText = data.candidates[0].content.parts[0].text;
            replyText = replyText.replace(/```html/g, '').replace(/```/g, '').trim();
            
            appendMessage('model', replyText);
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });
            autoSaveData(); // 每推演一轮自动覆盖当前存档，防止丢失
        }
    } catch (e) {
        removeMessage(loadingId);
        appendMessage('system', "❌ 连线失败。");
    }
}

// 💾 核心新增：数据存盘函数
function autoSaveData() {
    if (!currentSaveId) return;
    const plot = document.getElementById('setupPlot').value.trim();
    const shortTitle = plot.substring(0, 12) + "..."; // 截取背景作为名字
    
    const saveData = {
        id: currentSaveId,
        title: `${shortTitle} (${new Date().toLocaleTimeString()})`,
        chatHistory: chatHistory,
        htmlContent: document.getElementById('output').innerHTML,
        model: document.getElementById('modelSelect').value,
        playerSetup: document.getElementById('setupPlayer').value,
        npcSetup: document.getElementById('setupNpc').value,
        plotSetup: document.getElementById('setupPlot').value
    };
    
    localStorage.setItem(currentSaveId, JSON.stringify(saveData));
}

// 手动点击存盘提示
function quickSaveGame() {
    autoSaveData();
    alert("💾 进度已安全保存在本地历史窗口！");
}

// 🏠 核心新增：回到主菜单（不影响当前档）
function returnToMenu() {
    autoSaveData(); // 退出前存盘
    document.getElementById('setup-panel').style.display = 'block';
    document.getElementById('output').style.display = 'none';
    document.querySelector('.control-box').style.display = 'none';
    refreshArchiveList(); // 刷新主页列表
}

// 🔄 核心新增：刷新并渲染主页存档列表
function refreshArchiveList() {
    const listContainer = document.getElementById('archive-list');
    listContainer.innerHTML = '';
    
    let hasSaves = false;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('save_')) {
            hasSaves = true;
            const data = JSON.parse(localStorage.getItem(key));
            
            const row = document.createElement('div');
            row.style = "display: flex; gap: 5px; align-items: center;";
            row.innerHTML = `
                <button onclick="loadGame('${data.id}')" style="flex: 1; text-align: left; background: #334155; padding: 8px; font-size: 13px;">⏳ 读档：${data.title}</button>
                <button onclick="deleteGame('${data.id}')" style="background: #ef4444; width: 40px; padding: 8px;">🗑️</button>
            `;
            listContainer.appendChild(row);
        }
    }
    if (!hasSaves) {
        listContainer.innerHTML = '<div style="color: #64748b; font-size: 13px;">暂无历史世界线存档，请配置设定并创造世界。</div>';
    }
}

// 🔓 核心新增：载入并复活旧存档
function loadGame(id) {
    const data = JSON.parse(localStorage.getItem(id));
    if (!data) return;

    currentSaveId = data.id;
    chatHistory = data.chatHistory;
    
    // 还原当初的文本输入框和模型选择
    document.getElementById('modelSelect').value = data.model;
    document.getElementById('setupPlayer').value = data.playerSetup;
    document.getElementById('setupNpc').value = data.npcSetup;
    document.getElementById('setupPlot').value = data.plotSetup;
    
    // 还原历史剧情画面
    document.getElementById('output').innerHTML = data.htmlContent;

    // 切换界面
    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('output').style.display = 'flex';
    document.querySelector('.control-box').style.display = 'flex';
    
    // 自动滚到最新一张卡片
    setTimeout(() => {
        const output = document.getElementById('output');
        output.scrollTop = output.scrollHeight;
    }, 100);
}

// 🗑️ 核心新增：删除不需要的旧世界
function deleteGame(id) {
    if (confirm("确定要彻底抹除这条世界线吗？")) {
        localStorage.removeItem(id);
        refreshArchiveList();
    }
}

function appendMessage(sender, text) {
    const output = document.getElementById('output');
    const msgDiv = document.createElement('div');
    if (sender === 'model') {
        msgDiv.className = `msg-raw`;
        msgDiv.innerHTML = text;
    } else {
        msgDiv.className = `msg ${sender}-msg`;
        msgDiv.innerText = text;
    }
    const id = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5);
    msgDiv.id = id;
    output.appendChild(msgDiv);
    output.scrollTop = output.scrollHeight;
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
