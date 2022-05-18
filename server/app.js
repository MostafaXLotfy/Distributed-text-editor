const express = require("express")
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require("path")
const logic = require('./logic')
const port = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, "../clientApp")));

app.get("/",(req, res)=>{
    res.sendFile(path.join(__dirname, "../clientApp/index.html"))
})

logic.start_socketio(io)

http.listen(port, ()=>{
    console.log("app listening on port 3000")
})
