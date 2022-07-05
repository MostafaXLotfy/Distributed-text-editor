const { DocumentHandler } = require("./doc");

let docs = {};

const make_document =  (_id) => {
  if (docs[_id] != null) return;
  docs[_id] =  new DocumentHandler(_id);
};
const get_document =  async(_id) => {
  return  docs[_id].get_document();
};
const start_socketio = (io) => {
  io.on("connection", (socket) => {
    socket.on(`room`, (room) => {
      socket.join(room);
    });
    socket.on(`sync`, (incoming_document, callback) => {
      const _id = incoming_document._id;
      make_document(_id)
      docs[_id].sync_document(incoming_document);
      callback(docs[_id].get_document());
    });

    //send the updated user count to all other connected clients
    //io.to(_id).emit("user connected", 0);
    //listen for the docuemnt edit event from clients
    socket.on("document edit", (edit) => {
      const _id = edit._id;
      let result = docs[_id].update_document(edit.delta, edit.version);
      if (result === "accept") {
        io.to(_id).emit("document broadcast", edit);
      } else if ("reject") {
        return;
      }
    });

    //Whenever someone disconnects this piece of code gets executed
    //socket.on("disconnect", function () {
    //io.to(_id).emit("user disconnected", 0);
    //});
  });
  //return {doc:docs[_id].get_document(), clients_count:0};
};

module.exports = { start_socketio, make_document, get_document };
