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
    console.log(`here`)
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
    // this is the case where we recieve and ack
    client_state.waiting_ack = false
    //reset everything when an ack is received 
    client_state.last_sent_delta = new Delta()

    console.warn('acked')
  } else if (client_state.waiting_ack && incoming_document.v <= client_state.current_version) {

    // this is the case where we do a rebase

    let new_delta = new Delta(incoming_document.delta)

    console.error('doing rebase')
    console.log(`document: ${JSON.stringify(editor.quill_editor.getContents())}`)
    console.log(`last sent: ${JSON.stringify(client_state.last_sent_delta)}`)
    console.log(`new delta: ${JSON.stringify(incoming_document.delta)}`)
    
    // transform the recieved delta to avoid any conflicts 

    // if there is a pending change that wasn't sent then we should compose it with the latest thing we sent and didn't get ack
    if (client_state.have_pending_changes()){
      console.log(`here3`)
      console.log(`last_sent_delta: ${JSON.stringify(client_state.last_sent_delta)}`)
      new_delta = client_state.last_sent_delta.compose(client_state.pending_changes).transform(new_delta, false)

      //if there is any pending changes we should transform them according to what we received so we don't send a wrong delta
      console.log(`pending before: ${JSON.stringify(client_state.pending_changes)}`)

      client_state.pending_changes = new_delta.transform(client_state.pending_changes, false)
      // client_state.latest_delta = client_state.pending_changes
      console.log(`pending after: ${JSON.stringify(client_state.pending_changes)}`)

    }else{
      // if there is no pending changes then we should compose only with the latest thing we sent
      console.log(`here4`)
      console.log(`last_sent_delta: ${JSON.stringify(client_state.last_sent_delta)}`)

      new_delta = client_state.last_sent_delta.transform(new_delta, false)
    }

    // transform the latest thing we sent but didn't get ack
    client_state.last_sent_delta = new_delta.transform(client_state.last_sent_delta, false)

    // if there is any pending changes we should transform them according to what we received so we don't send a wrong delta

    console.log(`last sent after rebase: ${JSON.stringify(client_state.last_sent_delta)}`)
    console.log(`new delta after rebase: ${JSON.stringify(new_delta)}`)
    console.log(`latest edit ${JSON.stringify(client_state.latest_delta)}`)

    editor.update_contents(new_delta, "silent")

    console.log('document after rebase: ' + JSON.stringify(editor.quill_editor.getContents()))

    client_state.update_version(incoming_document.v + 1)
    socket.emit("document edit", {
      "delta": client_state.last_sent_delta,
      "v": client_state.current_version
    })
  } else {

    // the normal case where we receive an edit from another user

    console.warn("new edit received")

    console.log('document after rebase: ' + JSON.stringify(editor.quill_editor.getContents()))
    client_state.update_version(incoming_document.v)

    let new_delta = new Delta(incoming_document.delta)
    // if there is an edit that 
    if (client_state.have_pending_changes()){
      console.log('here 2')

      console.log(`pending : ${JSON.stringify(client_state.pending_changes)}`)

      new_delta = client_state.pending_changes.transform(new_delta, true)

      console.log(`pending before: ${JSON.stringify(client_state.pending_changes)}`)

      client_state.pending_changes = new_delta.transform(client_state.pending_changes, true)
      // client_state.latest_delta = client_state.pending_changes
      console.log(`pending after: ${JSON.stringify(client_state.pending_changes)}`)

    }

    console.log(`incoming before: ${JSON.stringify(incoming_document.delta)}`)

    console.log(`incoming after: ${JSON.stringify(new_delta)}`)

    editor.update_contents(new_delta, "sielnt")
    console.log('document after rebase: ' + JSON.stringify(editor.quill_editor.getContents()))



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
          console.warn("sending")
          console.log(`try to send ${JSON.stringify(client_state.pending_changes)}`)
          console.log(`document: ${JSON.stringify(editor.quill_editor.getContents())}`)
          let pending_changes = client_state.get_pending_changes()
          client_state.update_version()
          socket.emit("document edit", {
              "delta": pending_changes,
              "v": client_state.current_version
          })
          client_state.last_sent_delta = new Delta(pending_changes)
          client_state.waiting_ack = true
          console.warn('waiting ack')

      }
    }
}

window.addEventListener('load', async () => {
  await socket.on("init client", init_client)
  editor = new Editor()
  setInterval(interval_handler, 500);

})

