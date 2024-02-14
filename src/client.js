let ws = new WebSocket('ws://localhost:3000');
ws.onmessage = message => {
    const response = JSON.parse(message.data);
    console.log(response);
};