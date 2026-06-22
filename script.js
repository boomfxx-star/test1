// 💡 核心：用来储存所有聊天历史的数组，让 AI 拥有连续记忆
let chatHistory = []; 

async function sendMessage() {
    const key = document.getElementById('apiKey').value;
    const inputField = document.getElementById('userInput');
    const input = inputField.value.trim();
    
    if (!key) {
        alert("请先在上方输入 API Key！");
        return;
    }
    if (!input) return;

    // 1. 在聊天框里追加你输入的内容，并清空输入框
    appendMessage('user', input);
    inputField.value = '';

    // 2. 将你的行动存入记忆历史
    chatHistory.push({ role: "user", parts: [{ text: input }] });

    // 3. 在聊天框里显示“正在推演”的系统提示
    const loadingId = appendMessage('system', "⏳ 灰石堡正在推演因果...");

    try {
        // 发起 API 请求（带上整个 chatHistory）
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory }) 
        });
        
        const data = await response.json();
        
        // 移除“正在推演”的提示
        removeMessage(loadingId);
        
        if (data.error) {
            appendMessage('system', "❌ API 报错: " + data.error.message);
        } else if (data.candidates && data.candidates[0].content) {
            const replyText = data.candidates[0].content.parts[0].text;
            
            // 4. 在聊天框里追加 AI 的推演剧情
            appendMessage('model', replyText);
            
            // 5. 重要：把 AI 的回复也存入记忆历史，剧情才能连贯
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });
        } else {
            appendMessage('system', "❌ 返回数据异常，请重试。");
        }
    } catch (e) {
        removeMessage(loadingId);
        appendMessage('system', "❌ 连接失败，请检查网络或 Key。");
    }
}

// 辅助函数：负责向聊天框“吐出”新气泡，并自动滚动到底部
function appendMessage(sender, text) {
    const output = document.getElementById('output');
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${sender}-msg`;
    msgDiv.innerText = text;
    
    // 给消息一个随机ID，方便后面删除（比如删除加载提示）
    const id = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5);
    msgDiv.id = id;

    output.appendChild(msgDiv);
    
    // 自动滚动到底部
    output.scrollTop = output.scrollHeight;
    return id;
}

// 辅助函数：用来删除特定的提示
function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
