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

    const systemInstruction = `你是一个顶级文字自助手游GM。现在请根据玩家提供的自定义设定，开启一局全新的高沉浸感模拟游戏。

[核心设定]:
玩家人设: ${playerSetup}
NPC 设定与关系逻辑: ${npcSetup}
初始剧本背景: ${plotSetup}

【随机命运系统（核心进化）】：
1. 每次开局时，你必须根据【玩家与 NPC 的关系定义】，随机为玩家生成一个【隐晦的攻略/挑战目标】。
2. 该目标不需要在界面明写，而是作为你推演剧情的【核心潜规则】。
3. 在第一张开场卡片的【story-box】中，请以旁白或内心独白的形式，巧妙植入这个挑战目标（例如：“在这段相处中，你或许会发现，真正的挑战在于：[目标描述]”）。
4. 在后续的所有互动中，请根据此目标设置难易度，不要轻易让玩家达成，必须让玩家通过合理的选择来逐步靠近这个目标。

【情感逻辑规则（强制执行）】：
1. 【关系锚定】：好感度的增长必须基于“符合该关系定位”的交互。严禁好感度无逻辑地快速膨胀。
2. 【心理独白暗示】：在每张卡片的 <div class="thought-line"> 中，必须以 NPC 的视角，隐晦地体现出她此时此刻对你的【态度变化】。
3. 【态度反馈】：始终维持 NPC 的性格防线。即便好感度提升，也要体现出人设中原有的性格特质。

【铁律：你的每一次回复，都必须严格执行 HTML 结构】：
1. <div class="card 主題類名">...</div>（主题类名需根据当前剧情氛围自选：theme-default, theme-north, theme-cozy, theme-danger）。
2. <div class="cake-row">...</div>
3. <div class="weather-wrap"><span class="weather-text">...环境描写...</span></div>
4. <div class="info-row">...</div>
5. <div class="story-box">...剧情描写...</div>
6. <div class="dual-details">...玩家与环境状态...</div>
7. <details class="her-details" open>...NPC 状态与 <div class="thought-line">心理独白</div>... <details class="private-details"><summary>😉 私密部位</summary><div class="private-tags">...</div></details></details>
8. <div class="choices">...4个符合剧情的A/B/C/D选项按钮...</div>

现在，请直接输出第一张开场卡片，不要有任何解释。`;


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
