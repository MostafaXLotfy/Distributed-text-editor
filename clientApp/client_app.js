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
    client_state.last_sent_delta = new Delta()
    client_state.latest_delta = new Delta()

    console.warn('acked')
  } else if (client_state.waiting_ack && incoming_document.v <= client_state.current_version) {
    console.error('doing rebase')
    console.log(`document: ${JSON.stringify(editor.quill_editor.getContents())}`)
    new_delta = new Delta(incoming_document.delta)
    console.log(`last sent: ${JSON.stringify(client_state.last_sent_delta)}`)
    console.log(`new delta: ${JSON.stringify(incoming_document.delta)}`)
    
    if (!_.isEqual(client_state.last_sent_delta.ops, client_state.latest_delta.ops)){
      console.log(`here3`)
      console.log(`last_sent_delta: ${JSON.stringify(client_state.last_sent_delta)}`)
      console.log(`latest_sent_delta: ${JSON.stringify(client_state.latest_delta)}`)

      new_delta = client_state.last_sent_delta.compose(client_state.latest_delta).transform(new_delta, false)
    }else{
      console.log(`here4`)
      console.log(`last_sent_delta: ${JSON.stringify(client_state.last_sent_delta)}`)
      console.log(`latest_sent_delta: ${JSON.stringify(client_state.latest_delta)}`)
      new_delta = client_state.last_sent_delta.transform(new_delta, false)
    }
    client_state.last_sent_delta = new_delta.transform(client_state.last_sent_delta, false)
    client_state.latest_delta = client_state.last_sent_delta
    if (client_state.have_pending_changes()){
      console.log(`pending before: ${JSON.stringify(client_state.pending_changes)}`)

      client_state.pending_changes = new_delta.transform(client_state.pending_changes, false)
      client_state.latest_delta = client_state.pending_changes
      console.log(`pending after: ${JSON.stringify(client_state.pending_changes)}`)
    }
    console.log(`last sent after rebase: ${JSON.stringify(client_state.last_sent_delta)}`)
    console.log(`new delta after rebase: ${JSON.stringify(new_delta)}`)
    console.log(`latest edit ${JSON.stringify(client_state.latest_delta)}`)
    editor.update_contents(new_delta, "shit")
    console.log('document after rebase: ' + JSON.stringify(editor.quill_editor.getContents()))
    client_state.update_version(incoming_document.v + 1)
    socket.emit("document edit", {
      "delta": client_state.last_sent_delta,
      "v": client_state.current_version
    })
  } else {
    console.warn("new edit received")
    client_state.update_version(incoming_document.v)
    let new_delta = new Delta(incoming_document.delta)

    if (!_.isEqual(client_state.last_sent_delta.ops, client_state.latest_delta.ops)){
      console.log('here 1')

      console.log(`last sent: ${JSON.stringify(client_state.latest_delta)}`)
      console.log(`latest sent: ${JSON.stringify(client_state.last_sent_delta)}`)

      new_delta = client_state.last_sent_delta.compose(client_state.latest_delta).transform(new_delta, false)

    }else{
      console.log('here 2')

      console.log(`${JSON.stringify(client_state.latest_delta)}`)
      console.log(`pending : ${JSON.stringify(client_state.pending_changes)}`)

      new_delta = client_state.pending_changes.transform(new_delta, false)

    }
    // client_state.last_sent_delta = new_delta.transform(client_state.last_sent_delta, false)
    // client_state.latest_delta = client_state.last_sent_delta

    if (client_state.have_pending_changes()){
      console.log(`pending before: ${JSON.stringify(client_state.pending_changes)}`)

      client_state.pending_changes = new_delta.transform(client_state.pending_changes, false)
      client_state.latest_delta = client_state.pending_changes
      console.log(`pending after: ${JSON.stringify(client_state.pending_changes)}`)
    }
    console.log(`incoming before: ${JSON.stringify(incoming_document.delta)}`)

    console.log(`incoming after: ${JSON.stringify(new_delta)}`)

    editor.update_contents(new_delta, "shit")


    // console.log(`delta after transform: ${JSON.stringify(incoming_document.delta)}`)
    console.log(`document: ${JSON.stringify(editor.quill_editor.getContents())}`)

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

