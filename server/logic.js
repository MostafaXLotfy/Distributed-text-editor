const Delta = require("quill-delta");
const fs = require("fs");
const { json } = require("express");

let current_document = {
  composed_delta: new Delta(),
  version: 0,
}


let currentDelta = new Delta();
let writting = false;
let delta_not_saved = false;

//if a json file exists then read it, if not then create it
if (fs.existsSync("document.json")){

  let parsed_document = JSON.parse(fs.readFileSync("document.json"))
  current_document.composed_delta = new Delta(parsed_document.composed_delta)
  current_document.version = parsed_document.version

  //currentDocument = new Delta(JSON.parse(fs.readFileSync("document.json")));

}else fs.writeFileSync("document.json", JSON.stringify(current_document));



const start_socketio = (io) => {
  io.on("connection", (socket) => {
    //send latest delta to client after establishing a connection
    io.to(socket.id).emit("init client", {
      delta: current_document.composed_delta,
      v: current_document.version,
      clientsCount: io.engine.clientsCount,
    });

    socket.on(`sync`,()=>{
      console.log (`sync`)
      io.to(socket.id).emit(`sync 2`, current_document)
    })
    //send the updated user count to all other connected clients
    socket.broadcast.emit("user connected", io.engine.clientsCount);

    //listen for the docuemnt edit event from clients
    socket.on("document edit", (edit) => {
      //only accept edits with higher versions
      if (edit.v >  current_document.version) {

        currentDelta = new Delta(edit.delta);
      }
      else{
        // console.log("here");
        // currentDelta = currentDelta.transform(edit.delta, true)
        return;
      }
      
      current_document.composed_delta = current_document.composed_delta.compose(currentDelta);
      //save the document after each edit if there is no running writting operations else raise the delta not saved flag
      if (!writting) saveDocument();
      else delta_not_saved = true;

      //bump the current document version and broadcast it to all clients
      current_document.version = edit.v;
      /*
      very important
      don't use socket.broadcast.emit inside socket.on cause it doesn't work use io.emit instead
      */
      io.emit("document broadcast", {
        delta: currentDelta,
        v: current_document.version,
      });

    });
    
    //Whenever someone disconnects this piece of code gets executed
    socket.on("disconnect", function () {

      socket.broadcast.emit("user disconnected", io.engine.clientsCount);
    });
  });
};

let saveDocument = async () => {
  fs.writeFile("document.json", JSON.stringify(current_document), async () => {
    //if after you finished writting the current document, there was a new delta then re-call the function
    if (delta_not_saved) {
      delta_not_saved = false;
      await saveDocument();
    }
    writting = false;
  });
};

module.exports = { start_socketio };
