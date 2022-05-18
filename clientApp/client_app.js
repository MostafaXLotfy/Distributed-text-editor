
let quill = new Quill('#editor', {
  theme: 'snow'
});


let Delta = Quill.import('delta')
let socket = io()
var client_state = null
let number_of_users = 0
let sent_delta = null
let n = null //dumb global variable to check the value of other inside the scope of functions
let s = null //dumb global variable to check the value of other inside the scope of functions
let pending_delta = new Delta()
//TODO:: make an object that contains the state of the clinet


const on_text_change = (delta, old_delta,source) =>{
  client_state.update_document(delta)
  if(source != "user")
    return
  // TODO:: Add logic for pending edits
  if (!client_state.waiting_ack){
      socket.emit("document edit", {
        "delta":delta,
        "v": client_state.current_version
      })

      sent_delta = new Delta(delta)
      client_state.waiting_ack = true
    }
    else{
      // client_state.push_pending_delta(diff, client_state.current_version)
      pending_delta = pending_delta.compose(delta)
    }
}


socket.on("document broadcast", (incoming_document)=>{

  console.log(`recevied a new document:\n ${incoming_document.delta}`)
  n = incoming_document //TODO::debuging
  // incoming_document.delta = new Delta(incoming_document.delta)

  if (client_state.waiting_ack && _.isEqual(sent_delta.ops, incoming_document.delta.ops)){
    console.log("ACK received")
    client_state.waiting_ack = false

    if(pending_delta.ops.length != 0){
      socket.emit("document edit", {
        "delta":pending_delta,
        "v": client_state.current_version
      })
      sent_delta = pending_delta
      pending_delta = new Delta()
      client_state.waiting_ack = true
    }
  }
  // else if(client_state.waiting_ack && client_state.is_pending_delta){
  //   socket.emit("document edit", client_state.pop_pending_delta())
  //   quill.setContents(client_state.current_document, "silent")
  // }
  else{
    console.log("should never get here with one active client.")
    client_state.update_document(incoming_document.delta, incoming_document.v)
    quill.setContents(client_state.current_document, "silent")
  }
}) 

socket.on("latest edits", (new_document)=>{
  n = new_document
  if (!client_state){
    client_state = new ClientState(new_document.delta, new_document.v)
  }else{
    client_state.update_document(new_document.delta, new_document.v)
  }
  console.log(`recevied latest edits:\n`)
  //TODO::doen't remember what this do 
  // if (sent === true){
  //   //TODO:: this will go wrong fix it
  //   if(incoming_document.delta === sent_delta){
  //     sent = false
  //     acknowledged = true
  //   }
  // }
  quill.setContents(client_state.current_document, "silent")
})

socket.on("user connected", (live_users_counter)=>{
  console.log(`a new user connnected and the number of users is ${live_users_counter}`)
  number_of_users = live_users_counter
})

socket.on("user disconnected", (live_users_counter)=>{
  console.log(`a new user disconnected and the number of users is ${live_users_counter}`)
  number_of_users = live_users_counter
})

// socket.on("connect", ()=>{
//   let client_state = null
// })
quill.on('text-change', on_text_change)


function main(){

}