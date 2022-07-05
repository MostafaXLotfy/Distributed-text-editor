const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const { start_socketio, make_document, get_document } = require("./socket-io");
const { connect_db, get_all_documents } = require("./database");
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

connect_db();
start_socketio(io);

app.get("/api/getDocument/:_id",  async(req, res) => {
  const _id = req.params._id;
  make_document(_id);
  const doc = await get_document(_id);
  console.log(doc)
  res.json({ doc });
});

app.get("/api/getAllDocuments", async (req, res) => {
  let documents = await get_all_documents();
  res.json(documents);
});
server.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
