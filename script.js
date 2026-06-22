let chatHistory = []; 

// 🚀 核心升级：根据用户的自由手写设定，让 AI 生成第一张初始卡片
async function startGame() {
    const key = document.getElementById('apiKey').value;
    const model = document.getElementById('modelSelect').value; 
    
    // 获取用户在网页上输入的自由设定
    const playerSetup = document.getElementById('setupPlayer').value.trim();
    const npcSetup = document.getElementById('setupNpc').value.trim();
    const plotSetup = document.getElementById('setupPlot').value.trim();

    if (!key) {
        alert("请先输入您的 API Key！");
        return;
    }

    // 隐藏设定面板，显示游戏和输入框面板
    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('output').style.display = 'flex';
    document.querySelector('.control-box').style.display = 'flex';

    // 在屏幕上显示“创造世界中”
    const loadingId = appendMessage('system', `🌌 正在根据您的自定义设定创造世界 [${model}]...`);

    // 构建规则系统 Prompt，教导 AI 如何使用你的专属卡片格式
    const systemInstruction = `你是一个顶级文字自助手游GM。现在请根据玩家提供的自定义设定，开启一局全新的高沉浸感模拟游戏。
[玩家人设]: ${playerSetup}
[NPC状态及私密设定]: ${npcSetup}
[初始舞台与剧本背景]: ${plotSetup}

【铁律：你的每一次回复，包括接下来的第一发开场，都必须完整包裹在 <div class="card">...</div> 的 HTML 结构中输出！】
你必须严格套用以下 HTML 类名与标签结构输出：
1. <div class="card">：总包裹。
2. <div class="cake-row">：内含 3 个符合当前气氛的 Emoji。
3. <div class="weather-wrap"><span class="weather-text">：长句描写当前世界环境、风吹、气味、地貌等高级细节。
4. <div class="info-row">：内含 3 个 <span> 分别记录短标签：天气、时间、精确地点。
5. <div class="story-box">：使用多个 <p> 标签精美描写当前的最新剧情进展。
6. <div class="dual-details">：内含两个 <details>，分别记录 👤玩家状态 和 🌿环境状态。
7. <details class="her-details" open>：内含 👩NPC状态，核心必须包含一个 <div class="thought-line">💭 描写她此时此刻最真实的心理活动/独白</div>，以及服装、动作。
8. 在NPC状态内嵌入 <details class="private-details"><summary>😉 私密部位</summary><div class="private-tags">，用 <span> 动态列出各部位状态（如口腔、胸部、小穴、后穴等，根据设定自由增减）。
9. <div class="choices">：给出 4 个符合当前最新剧情的 A/B/C/D 选项按钮外观（如 <div class="choice-btn">A：xxx</div>）。

现在，请根据玩家提供的自定义设定，直接生成这局游戏的【第一张开场卡片】。不要有任何解释，直接输出 HTML。`;

    // 初始化大脑记忆
    chatHistory = [{ role: "user", parts: [{ text: systemInstruction }] }];

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory }) 
        });
        
        const data = await response.json();
        removeMessage(loadingId);
        
        if (data.error) {
            alert("初始化失败: " + data.error.message);
            location.reload(); // 失败则刷新重来
        } else if (data.candidates && data.candidates[0].content) {
            let replyText = data.candidates[0].content.parts[0].text;
            replyText = replyText.replace(/```html/g, '').replace(/
```/g, '').trim();
            
            // 渲染第一张由 AI 动态做好的初始剧本卡片！
            appendMessage('model', replyText);
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });
        }
    } catch (e) {
        removeMessage(loadingId);
        alert("连接失败，请检查网络。");
        location.reload();
    }
}

// 🕹️ 后续游戏回合的推演
async function sendMessage() {
    const key = document.getElementById('apiKey').value;
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
        }
    } catch (e) {
        removeMessage(loadingId);
        appendMessage('system', "❌ 连线失败。");
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

// 移除加载状态提示
function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
