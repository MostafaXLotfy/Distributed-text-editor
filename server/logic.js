const Delta = require("quill-delta");
const { json } = require("express");
const {get_file, upload_file } = require("./aws_s3")


let current_document = {
  composed_delta: new Delta(),
  version: 0,
}


let currentDelta = new Delta();
let writting = false;
let delta_not_saved = false;

//I moved this function here because I need access to the global current_document object

const upload_doc = async (file_name)=> {

  upload_file(file_name, current_document).then((err, data) => {
      if (err) return console.log(err)
      //if after you finished writting the current document there was a new delta, then re-call the function
      if (delta_not_saved) {
        delta_not_saved = false;
        upload_file(file_name, current_document)
      }
    }).then(() => writting = false)
}

const retrieve_document = async (file_name)=>{
  let data = await get_file('document.json')
  current_document.composed_delta = new Delta(data.composed_delta)
  current_document.version = data.version
}


retrieve_document('document.json')


const start_socketio = (io) => {
  io.on("connection", (socket) => {
    //send latest delta to client after establishing a connection
    io.to(socket.id).emit("init client", {
      delta: current_document.composed_delta,
      v: current_document.version,
      clientsCount: io.engine.clientsCount,
    });

    socket.on(`sync`, () => {
      console.log(`sync`)
      io.to(socket.id).emit(`sync 2`, current_document)
    })
    //send the updated user count to all other connected clients
    socket.broadcast.emit("user connected", io.engine.clientsCount);

    //listen for the docuemnt edit event from clients
    socket.on("document edit", (edit) => {
      //only accept edits with higher versions
      if (edit.v > current_document.version) {

        currentDelta = new Delta(edit.delta);
      }
      else {
        return;
      }

      current_document.composed_delta = current_document.composed_delta.compose(currentDelta);
      let l = current_document.composed_delta.ops.length
      if(l > 0 && current_document.composed_delta.ops[l-1].delete != null){
        console.log(`fixed document`)
        current_document.composed_delta.ops.pop()
      }

      //save the document after each edit if there is no running writting operations else raise the delta not saved flag
      if (!writting) upload_doc('document.json');
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



module.exports = { start_socketio };
