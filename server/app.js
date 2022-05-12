const express = require("express")
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require("path")
const Delta = require("quill-delta")

let delta = new Delta([
    { insert: 'Gandalf', attributes: { bold: true } },
    { insert: ' the ' },
    { insert: 'Grey', attributes: { color: '#ccc' } }
  ])
let current_v = 0
let live_user_count = 0

app.use(express.static(path.join(__dirname, "../clientApp")));

app.get("/",(req, res)=>{
    res.sendFile(path.join(__dirname, "../clientApp/index.html"))
})

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
            delta = delta.compose(edit.delta)

        else
            delta = delta.transform(edit.delta, true)
    
    //bump the current document version and broadcast it to all clients
        current_v++
        console.log(`brodcasting after accepting the edit`)
        /*
        very important
        don't use socket.broadcast.emit inside socket.on cause it doesn't work use io.emit instead
        */
        io.emit("document broadcast", {
            "delta":delta,
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


http.listen(3000, ()=>{
    console.log("app listening on port 3000")
})
