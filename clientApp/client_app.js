
let quill = new Quill('#editor', {
  theme: 'snow'
});
let Delta = Quill.import('delta')
var socket = io()
let change = new Delta()


let acknowledged = true
let sent = false
var old_doc  = null
let current_version = 0
let number_of_users = 0
let diff = null
//TODO:: make an object that contains the state of the clinet

const on_text_change = (delta) =>{
    new_change = change.compose(delta);
    diff = change.diff(new_change)
    current_version++;
    change = new_change
    if (acknowledged){
      socket.emit("document edit", {
        "delta":delta,
        v: current_version
      })
    }
    sent = true
    acknowledged = false
}


socket.on("document broadcast", (incoming_document)=>{
  current_version = incoming_document.v
  console.log(`recevied a new document:\n ${incoming_document.delta}`)
  if (sent && _.isEqual(diff.ops, incoming_document.delta.ops)){
    sent = false
    acknowledged = true
  }else{
    change = change.compose(incoming_document.delta)
    quill.setContents(change, "silent")
  }
}) 

socket.on("latest edits", (incoming_document)=>{
  current_version = incoming_document.v
  console.log(current_version)
  console.log(`recevied latest edits:\n ${incoming_document.delta}`)
  if (sent === true){
    //TODO:: this will go wrong fix it
    if(incoming_document.delta === sent_delta){
      sent = false
      acknowledged = true
    }
  }
  change = change.compose(incoming_document.delta)
  quill.setContents(change, "silent")
})

socket.on("user connected", (live_users_counter)=>{
  console.log(`a new user connnected and the number of users is ${live_users_counter}`)
  number_of_users = live_users_counter
})

socket.on("user disconnected", (live_users_counter)=>{
  console.log(`a new user disconnected and the number of users is ${live_users_counter}`)
  number_of_users = live_users_counter
})

quill.on('text-change', on_text_change)
