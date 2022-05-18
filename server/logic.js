const Delta = require("quill-delta")


let curr_delta = new Delta([
    { insert: 'Gandalf', attributes: { bold: true } },
    { insert: ' the ' },
    { insert: 'Grey', attributes: { color: '#ccc' } }
  ])
let current_v = 0
let current_document = new Delta() //used to provide new clients with latest updates on the document.
current_document = current_document.compose(curr_delta)

const start_socketio = (io)=>{
    io.on('connection', (socket) => {
        console.log('a user connected', io.engine.clientsCount);
        //send latest delta to client after establishing a connection
        io.to(socket.id).emit("latest edits", {
            "delta":current_document,
            "v":current_v
        })
        
        socket.broadcast.emit("user connected", io.engine.clientsCount)
    
        //listen for the docuemnt edit event from clients
        //quill adds new lines between deltas when recieving documents fast, using a receive buffer may help.
        //it works perfectly when receiving at moderate typing speed
        socket.on("document edit", (edit)=>{
            console.log(`received edit:\n ${edit}`)
            if (edit.v > current_v){
                curr_delta = edit.delta
               current_document = current_document.compose(curr_delta)
            }
                
            else{
                curr_delta = curr_delta.transform(edit.delta, true) //this probably won't work unless we apply the change also on the current document
                console.log("transforming")
            }
        
        //bump the current document version and broadcast it to all clients
            current_v++
            console.log(`brodcasting after accepting the edit`)
            /*
            very important
            don't use socket.broadcast.emit inside socket.on cause it doesn't work use io.emit instead
            */
            // diff = delta.diff(new_delta)
            // delta = new_delta
            io.emit("document broadcast", {
                "delta": curr_delta,
                "v":current_v
            });
        })
        //Whenever someone disconnects this piece of code executed
        socket.on('disconnect', function () {
        console.log('A user disconnected', io.engine.clientsCount);

        socket.broadcast.emit("user disconnected", io.engine.clientsCount)
     });
      });

}


module.exports = {start_socketio}