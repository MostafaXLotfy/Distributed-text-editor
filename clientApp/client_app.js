let quill = new Quill('#editor', {
  theme: 'snow'
});
let Delta = Quill.import('delta')
var socket = io()
let change = new Delta()


let acknowledged = true
let sent = false
let sent_delta  = null
let current_version = 0
let number_of_users = 0

//TODO:: make an object that contains the state of the clinet

const on_text_change = (delta) =>{
  change = change.compose(delta);
  if (acknowledged === true){
    console.log('sending an edit to the server')
    current_version++;
    sent_delta = delta
    socket.emit("document edit", {
      "delta":change,
      v: current_version
    })
    sent = true
    acknowledged = false
  }


}

socket.on("document broadcast", (incoming_document)=>{
  current_version = incoming_document.v
  console.log(`recevied a new document:\n ${incoming_document}`)
  if (sent === true){
    //TODO:: this will go wrong fix it
    if(incoming_document.delta. === sent_delta){
      sent = false
      acknowledged = true
    }
  }
  change = change.compose(incoming_document.delta)
  quill.setContents(change)

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
