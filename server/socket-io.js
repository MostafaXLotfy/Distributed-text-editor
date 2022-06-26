
const { Doc } = require("./doc");

let doc = new Doc();

const start_socketio = (io) => {
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
      let result = doc.update_document(edit.delta, edit.version);

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
};

module.exports = {start_socketio}
