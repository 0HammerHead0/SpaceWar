// socket.js
let socket;

export const setSocket = (newSocket) => {
  socket = newSocket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call setSocket() first.');
  }

  return socket;
};

export const initSocket = () => {
  const newSocket = new WebSocket("ws://localhost:9090");
  return newSocket;
};
