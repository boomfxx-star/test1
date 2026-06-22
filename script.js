let chatHistory = []; 
let currentSaveId = null; 

window.onload = function() {
    refreshArchiveList();
    const savedKey = localStorage.getItem('novel_api_key');
    if (savedKey) document.getElementById('apiKey').value = savedKey;
};

// ✨ 初始化：注入自定義設定，創造新世界
async function startGame() {
    const key = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value; 
    
    const playerSetup = document.getElementById('setupPlayer').value.trim();
    const npcSetup = document.getElementById('setupNpc').value.trim();
    const plotSetup = document.getElementById('setupPlot').value.trim();

    if (!key) {
        alert("請先輸入您的 API Key！");
        return;
    }
    
    localStorage.setItem('novel_api_key', key);
    currentSaveId = 'save_' + Date.now(); 

    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('output').style.display = 'flex';
    document.querySelector('.control-box').style.display = 'flex';
    document.getElementById('output').innerHTML = ''; 

    const loadingId = appendMessage('system', `🌌 正在根據您的自定義設定創造世界 [${model}]...`);

    // 🌟 核心優化：教導 AI 根據劇情切換 class 主題
    const systemInstruction = `你是一個頂級文字自助手遊GM。現在請根據玩家提供的自定義設定，開啟一局全新的高沉浸感模擬遊戲。
【核心語言要求】：你的每一次回復、每一次劇情描寫、選項和狀態欄更新，都必須嚴格、全程使用【簡體中文】！絕對不允許出現繁體字。

[玩家人設]: ${playerSetup} （【鐵律】：請嚴格記住玩家的生理特徵：其外貌、聲音、骨骼、肌膚、體香與體態皆為完美的女性，【唯獨私密部位具備雄性特徵】。在互動敘事與狀態更新中，嚴禁出現任何其他男性化描寫如鬍鬚、粗糙皮膚、男性聲音或雄性體格，必須保持極致的女性美感與魅力）
[NPC狀態及私密設定]: ${npcSetup}
[初始舞台與劇本背景]: ${plotSetup}

【鐵律：你的每一次回復，包括接接下來的第一發開場，都必須完整包裹在 <div class="card 主題類名">...</div> 的 HTML 結構中輸出！】
你必須根據當前劇情的「發生地點、環境與氣氛」，從以下【主題類名】中選擇一個，精準放入第一步的 card 後面（例如 <div class="card theme-north">）：
- theme-default : 默認暗紫（用於普通室內、走廊或無法分類的場景）
- theme-north : 冰冷北境（用於暴風雪、庭院、荒野、寒冷戶外）
- theme-cozy : 溫馨室內（用於臥室、溫泉、浴室、點着壁爐的溫暖房間）
- theme-danger : 幽暗危險（用於地牢、懲罰、激烈衝突、極度壓抑或審訊場景）

你必須嚴格套用以下 HTML 類名與標籤結構輸出：
1. <div class="card 主題類名">：總包裹（記得帶上上面篩選出的主題類名）。
2. <div class="cake-row">：內含 3 個符合當前氣氛的 Emoji。
3. <div class="weather-wrap"><span class="weather-text">：長句描寫當前世界環境、風吹、氣味、地貌等高級細節。
4. <div class="info-row">：內含 3 個 <span> 分別記錄短標籤：天氣、時間、精確地點。
5. <div class="story-box">：使用多個 <p> 標籤精美描寫當前的最新劇情進展（使用簡體中文）。
6. <div class="dual-details">：內含兩個 <details>，分別記錄 👤玩家狀態（緊扣玩家100%女性化外觀但私密特殊的特徵） 和 🌿環境狀態。
7. <details class="her-details" open>：內含 👩NPC狀態，核心必須包含一個 <div class="thought-line">💭 描寫她此時此刻最真實的心理活動</div>，以及服裝、動作。
8. 在NPC狀態內嵌入 <details class="private-details"><summary>😉 私密部位</summary><div class="private-tags">，用 <span> 動態列出各部位狀態（如口腔、胸部、小穴、後穴等，根據設定自由增減）。
9. <div class="choices">：給出 4 個符合當前最新劇情的 A/B/C/D 選項按鈕外觀（如 <div class="choice-btn">A：xxx</div>）。

現在，請根據玩家提供的自定義設定，直接生成這局遊戲的【第一張開場卡片】。不要有任何解釋，直接輸出 HTML。`;

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
            appendMessage('system', "❌ 網絡節點返回了錯誤頁面，請更換代理節點。");
            return;
        }

        removeMessage(loadingId);
        
        if (data.error) {
            appendMessage('system', "❌ 初始化失敗: " + data.error.message);
            return;
        } 

        if (data.candidates && data.candidates[0]) {
            const candidate = data.candidates[0];
            if (candidate.finishReason === "SAFETY") {
                appendMessage('system', "⚠️ 鏡像世界崩塌：因包含高度敏感詞，已被 Google 安全過濾器攔截！請修正輸入詞。");
                return;
            }
            if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                let replyText = candidate.content.parts[0].text;
                replyText = replyText.replace(/```html/g, '').replace(/```/g, '').trim();
                
                appendMessage('model', replyText);
                chatHistory.push({ role: "model", parts: [{ text: replyText }] });
                autoSaveData(); 
                return;
            }
        }
        appendMessage('system', "❌ 無法解析返回的數據。");
    } catch (e) {
        removeMessage(loadingId);
        appendMessage('system', "❌ 連接失敗，請檢查網絡。");
    }
}

// 🕹️ 回合推進
async function sendMessage() {
    const key = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value; 
    const inputField = document.getElementById('userInput');
    const input = inputField.value.trim();
    
    if (!input) return;

    appendMessage('user', `我的行動：${input}`);
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
            appendMessage('system', "❌ API 報錯: " + data.error.message);
        } else if (data.candidates && data.candidates[0].content) {
            let replyText = data.candidates[0].content.parts[0].text;
            replyText = replyText.replace(/```html/g, '').replace(/```/g, '').trim();
            
            appendMessage('model', replyText);
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });
            autoSaveData(); 
        }
    } catch (e) {
        removeMessage(loadingId);
        appendMessage('system', "❌ 連線失敗。");
    }
}

function autoSaveData() {
    if (!currentSaveId) return;
    const plot = document.getElementById('setupPlot').value.trim();
    const shortTitle = plot.substring(0, 12) + "..."; 
    
    const saveData = {
        id: currentSaveId,
        title: `${shortTitle} (${new Date().toLocaleTimeString()})`,
        chatHistory: chatHistory,
        htmlContent: document.getElementById('output').innerHTML,
        model: document.getElementById('modelSelect').value,
        playerSetup: document.getElementById('setupPlayer').value,
        npcSetup: document.getElementById('setupNpc').value,
        plotSetup: document.getElementById('setupPlot').value,
        currentBodyClass: document.body.className // 同步保存當前背景色彩
    };
    
    localStorage.setItem(currentSaveId, JSON.stringify(saveData));
}

function quickSaveGame() {
    autoSaveData();
    alert("💾 進度已安全保存在本地歷史窗口！");
}

function returnToMenu() {
    autoSaveData(); 
    document.body.className = ''; // 回到主菜單恢復默認背景
    document.getElementById('setup-panel').style.display = 'block';
    document.getElementById('output').style.display = 'none';
    document.querySelector('.control-box').style.display = 'none';
    refreshArchiveList(); 
}

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
                <button onclick="loadGame('${data.id}')" style="flex: 1; text-align: left; background: #334155; padding: 8px; font-size: 13px;">⏳ 讀檔：${data.title}</button>
                <button onclick="deleteGame('${data.id}')" style="background: #ef4444; width: 40px; padding: 8px;">🗑️</button>
            `;
            listContainer.appendChild(row);
        }
    }
    if (!hasSaves) {
        listContainer.innerHTML = '<div style="color: #64748b; font-size: 13px;">暫無歷史世界線存檔，請配置設定並創造世界。</div>';
    }
}

function loadGame(id) {
    const data = JSON.parse(localStorage.getItem(id));
    if (!data) return;

    currentSaveId = data.id;
    chatHistory = data.chatHistory;
    
    document.getElementById('modelSelect').value = data.model;
    document.getElementById('setupPlayer').value = data.playerSetup;
    document.getElementById('setupNpc').value = data.npcSetup;
    document.getElementById('setupPlot').value = data.plotSetup;
    
    document.getElementById('output').innerHTML = data.htmlContent;

    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('output').style.display = 'flex';
    document.querySelector('.control-box').style.display = 'flex';
    
    // 還原當初存盤時的背景色彩
    document.body.className = data.currentBodyClass || '';

    setTimeout(() => {
        const output = document.getElementById('output');
        output.scrollTop = output.scrollHeight;
    }, 100);
}

function deleteGame(id) {
    if (confirm("確定要徹底抹除這條世界線嗎？")) {
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
    
    // 🌟 核心新增：如果收到 AI 的新卡片，動態提取卡片裏的 theme 類名並套用到 body 背景上
    if (sender === 'model') {
        const card = msgDiv.querySelector('.card');
        if (card) {
            document.body.className = ''; // 清空舊背景
            card.classList.forEach(cls => {
                if (cls.startsWith('theme-')) {
                    document.body.classList.add(cls); // 切換至新劇情的背景色
                }
            });
        }
    }

    output.scrollTop = output.scrollHeight;
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
