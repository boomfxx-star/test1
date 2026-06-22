async function sendMessage() {
	const key = document.getElementById('apiKey').value;
	const input = document.getElementById('userInput').value;
	const output = document.getElementById('output');

	output.innerText = "系统正在推演...";

	try {
		const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ contents: [{ parts: [{ text: input }] }] })
	});
	const data = await response.json();
	output.innerText = data.candidates[0].content.parts[0].text;
	} catch (e) {
	output.innerText = "连接出错，请检查 API Key 或网络。";
	}
 } 