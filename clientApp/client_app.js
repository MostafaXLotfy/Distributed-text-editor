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
  if (client_state === null) {
    client_state = new ClientState(new_document.v)
    editor.set_contents(new_document.delta, "silent")
  } else {
    //TODO:: add logic for to synchronize client document with server in case internet disconnects 
    //client_state.update_document(new_document.delta, new_document.v)
    editor.update_contents(client_state.current_document, "silent")
  }
  update_user_count(new_document.clientsCount)
  console.log(`recevied latest edits:\n`)
}



socket.on("document broadcast", (incoming_document) => {

  if (client_state.waiting_ack && _.isEqual(client_state.last_sent_delta.ops, incoming_document.delta.ops)) {
    client_state.waiting_ack = false
  } else if (client_state.waiting_ack && incoming_document.v <= client_state.current_version) {
    console.warn('doing rebase')
    console.log(`document: ${JSON.stringify(editor.quill_editor.getContents())}`)
    new_delta = new Delta(incoming_document.delta)
    console.log(`last sent: ${JSON.stringify(client_state.last_sent_delta)}`)
    console.log(`new delta: ${JSON.stringify(incoming_document.delta)}`)
    client_state.last_sent_delta = new_delta.transform(client_state.last_sent_delta, false)
    // new_delta = new_delta.transform(client_state.last_sent_delta, false)
    console.log(`last sent after rebase: ${JSON.stringify(client_state.last_sent_delta)}`)
    new_delta = client_state.last_sent_delta.transform(new_delta, false)
    console.log(`new delta after rebase: ${JSON.stringify(new_delta)}`)
    console.log(`pending:${JSON.stringify(client_state.pending_changes)}`)

    editor.update_contents(new_delta, "silent")
    console.log('document after rebase: ' + JSON.stringify(editor.quill_editor.getContents()))
    client_state.update_version(incoming_document.v + 1)
    socket.emit("document edit", {
      "delta": client_state.last_sent_delta,
      "v": client_state.current_version
    })
  } else {
    console.log(`new_delta: ${JSON.stringify(incoming_document.delta)}`)
    console.log(`document: ${JSON.stringify(editor.quill_editor.getContents())}, v: ${incoming_document.v}`)
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
    if (client_state.have_pending_changes()){
      // TODO:: Add logic for pending edits
      if (client_state.waiting_ack === false) {
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
  setInterval(interval_handler, 0);

})

