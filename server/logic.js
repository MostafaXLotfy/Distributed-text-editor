const { json } = require("express")
const path = require("path")
const Delta = require("quill-delta")


let delta = new Delta([
    { insert: 'Gandalf', attributes: { bold: true } },
    { insert: ' the ' },
    { insert: 'Grey', attributes: { color: '#ccc' } }
  ])
let current_v = 0
let live_user_count = 0
let pending_changes = []

const start_socketio = (io)=>{
    io.on('connection', (socket) => {
        console.log('a user connected');
        //send latest delta to client after establishing a connection
        io.to(socket.id).emit("latest edits", {
            "delta":delta,
            "v":current_v
        })
        //increment the number of connected users and broadcast it to all connected clients
        live_user_count++
        socket.broadcast.emit("user connected", live_user_count)
    
        //listen for the docuemnt edit event from clients
        socket.on("document edit", (edit)=>{
            console.log(`received edit:\n ${edit}`)
            if (edit.v > current_v) 
                new_delta = delta.compose(edit.delta)
            else
                new_delta = delta.transform(edit.delta, true)
        
        //bump the current document version and broadcast it to all clients
            current_v++
            console.log(`brodcasting after accepting the edit`)
            /*
            very important
            don't use socket.broadcast.emit inside socket.on cause it doesn't work use io.emit instead
            */
            diff = delta.diff(new_delta)
            delta = new_delta
            io.emit("document broadcast", {
                "delta": diff,
                "v":current_v
            });
        })
        //Whenever someone disconnects this piece of code executed
        socket.on('disconnect', function () {
        console.log('A user disconnected');
        //decrement the number of connected users and broadcast it to all connected clients
        live_user_count--
        socket.broadcast.emit("user disconnected", live_user_count)
     });
      });

}


module.exports = {start_socketio}