async function sendMessage() {
    const key = document.getElementById('apiKey').value;
    const input = document.getElementById('userInput').value;
    const output = document.getElementById('output');
    
    // 检查 Key 是否为空
    if (!key) {
        output.innerText = "请先在上方输入 API Key！";
        return;
    }

    output.innerText = "系统正在推演，请稍候...";
    
    try {
        // 这里发起请求，注意模型名称你可以随时修改成 'gemini-1.5-pro' 或 'gemini-2.0-flash-exp'
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ role: "user", parts: [{ text: input }] }] 
            })
        });
        
        const data = await response.json();
        
        // 关键点：在这里加入错误判断逻辑
        if (data.error) {
            output.innerText = "API 报错: " + data.error.message;
        } else if (data.candidates && data.candidates[0].content) {
			output.innerText = data.candidates[0].content.parts[0].text;
		} else {
			output.innetText = "返回数据格式异常,请检查 API Key 权限. ";
		}
	} catch (e) {
		// 如果网络完全断开,会跳到这里
		output.innerText = "连接失败,请检查网络(是否能访问Google服务)以及 API Key 是否正确";
	}
}
