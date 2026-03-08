const { Server } = require("socket.io");
const http = require("http");




const server = http.createServer();

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);


    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.join(userId);
        console.log(`User ${userId} joined room ${roomId}`);


        socket.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            console.log(`User ${userId} disconnected from ${roomId}`);
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });


    socket.on("webrtc-signal", (data) => {
        const { to, signal, from } = data;

        io.to(to).emit("webrtc-signal", { signal, from });
    });


    socket.on("bandwidth-degrade", (data) => {
        const { roomId, userId, type } = data;
        socket.to(roomId).emit("peer-degraded", { userId, type });
    });

    // Messaging
    socket.on("send-message", (data) => {
        const { roomId, message, senderId } = data;
        socket.to(roomId).emit("receive-message", { message, senderId, timestamp: Date.now() });
    });

    // Session Control
    socket.on("end-call", (data) => {
        const { roomId } = data;
        socket.to(roomId).emit("end-call");
    });
});

const PORT = process.env.PORT || process.env.SOCKET_PORT || 3001;

server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
