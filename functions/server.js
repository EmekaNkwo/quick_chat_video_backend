const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const router = express.Router();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (rooms[roomId].length < 4) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      socket.emit("room-joined", { roomId, users: rooms[roomId] });
      socket.broadcast.to(roomId).emit("user-connected", socket.id);
    } else {
      socket.emit("room-full");
    }
  });

  socket.on("signal", (data) => {
    io.to(data.room).emit("signal", {
      userId: data.userId,
      signal: data.signal,
    });
  });

  socket.on("send-message", (data) => {
    io.to(data.roomId).emit("receive-message", {
      message: data.message,
      userId: socket.id,
    });
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
      }
    }
    console.log("Client disconnected");
  });
});

router.get("/", (req, res) => {
  res.send("Welcome to the server!");
});

app.use("/api", router);

app.use("/functions/server", router);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports.handler = serverless(app);
