const express = require("express")
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require("path")
const Delta = require("quill-delta")

let delta = new Delta()
let current_v = 0

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on("document edit", (edit)=>{
        if (edit.v > current_v) {
            delta.compose(edit.delta)
        }
        else{
            delta.transform(edit.delta, true)
        }
        current_v++
        socket.broadcast.emit("document edit", {
            "delta":delta,
            "v":current_v
        });
    })
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
    console.log('A user disconnected');
 });
  });

app.get("/",(req, res)=>{
    res.sendFile(path.join(__dirname, "../clientApp/index.html"))
})

http.listen(3000, ()=>{
    console.log("app listening on port 3000")
})
