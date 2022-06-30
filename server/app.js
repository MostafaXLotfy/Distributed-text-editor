const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const port = process.env.PORT || 3000;
const { start_socketio } = require("./socket-io");
const {connect_db} = require("./database")

app.use(express.static(path.join(__dirname, "../clientApp")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../clientApp/index.html"));
  console.log(`here`);
});

connect_db()
start_socketio(io)

http.listen(port, () => {
  console.log("app listening on port 3000");
});
