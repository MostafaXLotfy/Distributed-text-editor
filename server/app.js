const express = require("express")
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require("path")
const Delta = require("quill-delta")

let delta = new Delta()
let current_v = 0
let live_user_count = 0

io.on('connection', (socket) => {
    console.log('a user connected');
    //increment the number of connected users and broadcast it to all connected clients
    live_user_count++
    socket.broadcast.emit("user connected", live_user_count)

    //listen for the docuemnt edit event from clients
    socket.on("document edit", (edit)=>{
        if (edit.v > current_v) 
            delta.compose(edit.delta)

        else
            delta.transform(edit.delta, true)
    
    //bump the current document version and broadcast it to all clients
        current_v++
        socket.broadcast.emit("document broadcast", {
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

app.get("/",(req, res)=>{
    res.sendFile(path.join(__dirname, "../clientApp/index.html"))
})

http.listen(3000, ()=>{
    console.log("app listening on port 3000")
})
