const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow connection from your Vercel App
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. Join Room (for 1-on-1 chat)
  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // 2. Send Message
  socket.on("send_message", (data) => {
    // Broadcast to the specific room (receiver)
    socket.to(data.receiverId).emit("receive_message", data);
    // Also emit back to sender (optional, depending on your frontend logic)
    // socket.emit("receive_message", data); 
  });

  // 3. Typing Indicators
  socket.on("typing", (data) => {
    socket.to(data.receiverId).emit("display_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.receiverId).emit("hide_typing", data);
  });
  
  // 4. Call Events (Signaling for LiveKit/WebRTC)
  socket.on("outgoing_call", (data) => {
      socket.to(data.calleeId).emit("call_accepted", { roomId: data.roomId });
  });

  socket.on("end_call", (data) => {
      socket.to(data.to).emit("call_ended");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});