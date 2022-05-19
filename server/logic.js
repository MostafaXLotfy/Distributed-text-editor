const Delta = require("quill-delta");
const fs = require("fs");

let currentDelta = new Delta();
let current_v = 0;
let currentDocument = new Delta(); //used to provide new clients with latest updates on the document.
let writting = false;
let delta_not_saved = false;

//if a json file exists then read it, if not then create it
if (fs.existsSync("document.json"))
  currentDocument = new Delta(JSON.parse(fs.readFileSync("document.json")));
else fs.writeFileSync("document.json", JSON.stringify(currentDocument));

const start_socketio = (io) => {
  io.on("connection", (socket) => {
    console.log("a user connected", io.engine.clientsCount);
    //send latest delta to client after establishing a connection
    io.to(socket.id).emit("init client", {
      delta: currentDocument,
      v: current_v,
      clientsCount: io.engine.clientsCount,
    });
    //send the updated user count to all other connected clients
    socket.broadcast.emit("user connected", io.engine.clientsCount);

    //listen for the docuemnt edit event from clients
    socket.on("document edit", (edit) => {
      console.log("received edit");
      //only accept edits with higher versions
      if (edit.v > current_v) {

        currentDelta = new Delta(edit.delta);
        currentDocument = currentDocument.compose(currentDelta);
        //save the document after each edit if there is no running writting operations else raise the delta not saved flag
        if (!writting) saveDocument();
        else delta_not_saved = true;

        //bump the current document version and broadcast it to all clients
        current_v++;
        console.log(`brodcasting after accepting the edit`);
        /*
        very important
        don't use socket.broadcast.emit inside socket.on cause it doesn't work use io.emit instead
        */
        io.emit("document broadcast", {
          delta: currentDelta,
          v: current_v,
        });
      }
    });
    
    //Whenever someone disconnects this piece of code gets executed
    socket.on("disconnect", function () {
      console.log("A user disconnected", io.engine.clientsCount);

      socket.broadcast.emit("user disconnected", io.engine.clientsCount);
    });
  });
};
let saveDocument = async () => {
  fs.writeFile("document.json", JSON.stringify(currentDocument), async () => {
    //if after you finished writting the current document, there was a new delta then re-call the function
    if (delta_not_saved) {
      delta_not_saved = false;
      await saveDocument();
    }
    writting = false;
  });
};

module.exports = { start_socketio };
