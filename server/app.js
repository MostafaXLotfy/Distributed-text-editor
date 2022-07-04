const express = require("express");
const http = require("http")
const socketIo = require("socket.io");

const { start_socketio, doc } = require("./socket-io");
const {connect_db} = require("./database")
const Delta = require('quill-delta')
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
      origin: "http://localhost:3000",
  }
})


connect_db()
start_socketio(io)
app.get("/api/getDocument", (req, res) => {
  console.log(doc.get_document())
  res.json({doc:doc.get_document(), clients_count:io.engine.clientsCount})
});


server.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
