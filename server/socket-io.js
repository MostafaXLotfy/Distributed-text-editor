const { DocumentHandler } = require("./doc");

let docs = {};

const make_document = (_id) => {
  if (docs[_id] != null) return;
  docs[_id] = new DocumentHandler(_id);
};

const get_document = async (_id) => {
  return docs[_id].get_document();
};

const start_socketio = (io) => {
  io.on("connection", (socket) => {
    socket.on(`room`, (room) => {
      socket.join(room);
      io.to(room).emit("user count", io.sockets.adapter.rooms.get(room).size);
    });

    socket.on(`sync`, (incoming_document, callback) => {
      const _id = incoming_document._id;
      make_document(_id);
      docs[_id].sync_document(incoming_document);
      callback(docs[_id].get_document());
    });

    socket.on("change title", (edit) => {
      let _id = edit._id;
      docs[_id].doc.title = edit.title;
      docs[_id].__save_document();
      io.to(_id).emit("title changed", edit.title);
    });

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

    socket.on("disconnecting", () => {
      const rooms = Array.from(socket.rooms).slice(1);
      for (const room of rooms) {
        io.to(room).emit(
          "user count",
          io.sockets.adapter.rooms.get(room).size - 1
        );
        socket.leave(room);
      }
    });
  });
};

module.exports = { start_socketio, make_document, get_document };
