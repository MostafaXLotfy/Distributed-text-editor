let Delta = Quill.import('delta')
let socket = io({
  transports: ["websocket"]
})
var client_state = null
let pending_delta = new Delta()


const update_user_count = (user_count) => {
  let element = document.getElementById('user-number-paragraph')
  element.textContent = `connected users: ${user_count}`
}


const init_client = (new_document) => {
  if (!client_state) {
    client_state = new ClientState(new_document.v)
    editor.set_contents(new_document.delta, "silent")
  } else {
    //TODO:: add logic for to synchronize client document with server in case internet disconnects 
    //client_state.update_document(new_document.delta, new_document.v)
    editor.update_contents(client_state.current_document, "silent")
  }
  update_user_count(new_document.clientsCount)
  console.log(`recevied latest edits:\n`)
  return 'hello world'
}

socket.on("document broadcast", (incoming_document) => {

  console.log(`recevied a new document:\n ${incoming_document.delta}`)
  if (client_state.waiting_ack && _.isEqual(client_state.last_sent_delta.ops, incoming_document.delta.ops)) {
    console.log("ACK received")
    client_state.waiting_ack = false

  } else if (client_state.waiting_ack && incoming_document.v == client_state.current_version) {
    console.warn('doing rebase')
    new_delta = new Delta(incoming_document.delta)
    client_state.last_sent_delta = new_delta.transform(client_state.last_sent_delta, true)
    editor.update_contents(new_delta, "silent")
    client_state.update_version()
    socket.emit("document edit", {
      "delta": client_state.last_sent_delta,
      "v": client_state.current_version
    })
  } else {
    client_state.update_version(incoming_document.v)
    editor.update_contents(incoming_document.delta, "silent")
  }
})

socket.on("user connected", (live_users_counter) => {
  update_user_count(live_users_counter)
  console.log(`a new user connnected and the number of users is: ${live_users_counter}`)
})

socket.on("user disconnected", (live_users_counter) => {
  update_user_count(live_users_counter)
  console.log(`a new user disconnected and the number of users is ${live_users_counter}`)
  number_of_users = live_users_counter
})

const interval_handler = ()=>{
    console.log('man')
    if (client_state.have_pending_changes()){
      // TODO:: Add logic for pending edits
      if (!client_state.waiting_ack) {
          let pending_changes = client_state.get_pending_changes()
          client_state.update_version()
          socket.emit("document edit", {
              "delta": pending_changes,
              "v": client_state.current_version
          })
          client_state.last_sent_delta = new Delta(pending_changes)
          client_state.waiting_ack = true
      }
    }
}

window.addEventListener('load', async () => {
  await socket.on("init client", init_client)
  editor = new Editor()
  setInterval(interval_handler, 500);

})

