let chatHistory = []; 

// ✨ 初始化：注入自定義設定，命令 AI 當場吐出第一場戲的精美卡片
async function startGame() {
    const key = document.getElementById('apiKey').value;
    const model = document.getElementById('modelSelect').value; 
    
    const playerSetup = document.getElementById('setupPlayer').value.trim();
    const npcSetup = document.getElementById('setupNpc').value.trim();
    const plotSetup = document.getElementById('setupPlot').value.trim();

    if (!key) {
        alert("請先輸入您的 API Key！");
        return;
    }

    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('output').style.display = 'flex';
    document.querySelector('.control-box').style.display = 'flex';

    const loadingId = appendMessage('system', `🌌 正在根據您的自定義設定創造世界 [${model}]...`);

    // 🌟 核心優化：加粗並明確了「唯獨私密部位」的限制，抹除任何其他雄性特徵
    const systemInstruction = `你是一個頂級文字自助手遊GM。現在請根據玩家提供的自定義設定，開啟一局全新的高沉浸感模擬遊戲。
[玩家人設]: ${playerSetup} （【鐵律】：請嚴格記住玩家的生理特徵：其外貌、聲音、骨骼、肌膚、體香與體態皆為完美的女性，【唯獨私密部位具備雄性特徵】。在互動敘事與狀態更新中，嚴禁出現任何其他男性化描寫如鬍鬚、粗糙皮膚、男性聲音或雄性體格，必須保持極致的女性美感與魅力）
[NPC狀態及私密設定]: ${npcSetup}
[初始舞台與劇本背景]: ${plotSetup}

【鐵律：你的每一次回復，包括接接下來的第一發開場，都必須完整包裹在 <div class="card">...</div> 的 HTML 結構中輸出！】
你必須嚴格套用以下 HTML 類名與標籤結構輸出：
1. <div class="card">：總包裹。
2. <div class="cake-row">：內含 3 個符合當前氣氛的 Emoji。
3. <div class="weather-wrap"><span class="weather-text">：長句描寫當前世界環境、風吹、氣味、地貌等高級細節。
4. <div class="info-row">：內含 3 個 <span> 分別記錄短標籤：天氣、時間、精確地點。
5. <div class="story-box">：使用多個 <p> 標籤精美描寫當前的最新劇情進展。
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
        try {
            data = JSON.parse(textData);
        } catch(ee) {
            console.error("服務器返回了非JSON數據:", textData);
            removeMessage(loadingId);
            appendMessage('system', "❌ 網絡節點返回了錯誤頁面，請嘗試更換更乾淨的 VPN 代理節點。");
            return;
        }

        console.log("📊 Google API 完整返回數據:", data);
        removeMessage(loadingId);
        
        if (data.error) {
            appendMessage('system', "❌ 初始化失敗: " + data.error.message);
            return;
        } 

        if (data.candidates && data.candidates[0]) {
            const candidate = data.candidates[0];
            
            if (candidate.finishReason === "SAFETY") {
                appendMessage('system', "⚠️ 鏡像世界崩塌：因包含高度敏感詞，已被 Google 安全過濾器攔截！請返回並嘗試將人設中的隱晦/敏感詞匯修改得更隱蔽一些。");
                return;
            }

            if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                let replyText = candidate.content.parts[0].text;
                replyText = replyText.replace(/```html/g, '').replace(/```/g, '').trim();
                
                appendMessage('model', replyText);
                chatHistory.push({ role: "model", parts: [{ text: replyText }] });
                return;
            }
        }
        
        appendMessage('system', "❌ 無法解析返回的數據，請按 F12 查看 Console 裡的具體日誌。");

    } catch (e) {
        console.error("運行異常:", e);
        removeMessage(loadingId);
        appendMessage('system', "❌ 連接失敗，請檢查網絡或確認是否開啟了全局代理。");
    }
}

// 🕹️ 正常遊戲回合的劇情推演
async function sendMessage() {
    const key = document.getElementById('apiKey').value;
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
        }
    } catch (e) {
        removeMessage(loadingId);
        appendMessage('system', "❌ 連線失敗。");
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
