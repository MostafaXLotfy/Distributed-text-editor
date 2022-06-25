const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const logic = require("./logic");
const port = process.env.PORT || 3000;
const { Doc } = require("./doc");

let doc = new Doc();


app.use(express.static(path.join(__dirname, "../clientApp")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../clientApp/index.html"));
  console.log(`here`);
});


io.on("connection", (socket) => {
//send latest delta to client after establishing a connection
io.to(socket.id).emit("init client", {
    contents: doc.contents,
    version: doc.version,
    clientsCount: io.engine.clientsCount,
});

socket.on(`sync`, (incoming_document, callback) => {
    console.log(`sync case start`);
    doc.sync_document(incoming_document);
    callback(doc.get_document());
});

//send the updated user count to all other connected clients
socket.broadcast.emit("user connected", io.engine.clientsCount);

//listen for the docuemnt edit event from clients
socket.on("document edit", (edit) => {
    //if the edit is ignored or acceppted
    let result = doc.update_document(edit.delta, edit.v);

    if (result === "accept") {
    io.emit("document broadcast", edit); //   delta: currentDelta,
    //   v: current_document.version,)
    } else if ("reject") {
    return;
    }
});

//Whenever someone disconnects this piece of code gets executed
socket.on("disconnect", function () {
    socket.broadcast.emit("user disconnected", io.engine.clientsCount);
});
});


http.listen(port, () => {
  console.log("app listening on port 3000");
});
