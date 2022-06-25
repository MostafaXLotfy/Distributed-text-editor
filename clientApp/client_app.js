let Delta = Quill.import('delta')
let socket = io()

var client_state = null


let saved_doc = {
  composed_delta: new Delta(),
  version: 0
}

const update_user_count = (user_count) => {
  let element = document.getElementById('user-number-paragraph')
  element.textContent = `connected users: ${user_count}`
}



const init_client = (new_document) => {
  client_state = new ClientState(new_document.version)
  editor.set_contents(new_document.contents, "silent")
  update_user_count(new_document.clientsCount)
  saved_doc.composed_delta = new Delta(new_document.contents)
  saved_doc.version = new_document.version
  console.log(`recevied latest edits:\n`)
}


const is_ack = (incoming_document) => {
  return client_state.waiting_ack && _.isEqual(client_state.last_sent_delta.ops, incoming_document.delta.ops)
}

const rebase = (incoming_document) => {

  // this is the case where we do a rebase

  let new_delta = new Delta(incoming_document.delta)

  console.error('doing rebase')
  console.log(`document: ${JSON.stringify(editor.get_contents())}`)
  console.log(`last sent: ${JSON.stringify(client_state.last_sent_delta)}`)
  console.log(`new delta: ${JSON.stringify(incoming_document.delta)}`)

  // transform the recieved delta to avoid any conflicts 

  // if there is a pending change that wasn't sent then we should compose it with the latest thing we sent and didn't get ack
  if (client_state.have_pending_changes()) {
    console.log(`here3`)
    console.log(`last_sent_delta: ${JSON.stringify(client_state.last_sent_delta)}`)
    new_delta = client_state.last_sent_delta.compose(client_state.pending_changes).transform(new_delta, true)

    //if there is any pending changes we should transform them according to what we received so we don't send a wrong delta
    console.log(`pending before: ${JSON.stringify(client_state.pending_changes)}`)

    client_state.pending_changes = new_delta.transform(client_state.pending_changes, true)
    // client_state.latest_delta = client_state.pending_changes
    console.log(`pending after: ${JSON.stringify(client_state.pending_changes)}`)

  } else {
    // if there is no pending changes then we should compose only with the latest thing we sent
    console.log(`here4`)
    console.log(`last_sent_delta: ${JSON.stringify(client_state.last_sent_delta)}`)

    new_delta = client_state.last_sent_delta.transform(new_delta, true)
  }

  // transform the latest thing we sent but didn't get ack
  client_state.last_sent_delta = new_delta.transform(client_state.last_sent_delta, true)

  // if there is any pending changes we should transform them according to what we received so we don't send a wrong delta

  console.log(`last sent after rebase: ${JSON.stringify(client_state.last_sent_delta)}`)
  console.log(`new delta after rebase: ${JSON.stringify(new_delta)}`)
  console.log(`latest edit ${JSON.stringify(client_state.latest_delta)}`)

  // saved_doc.composed_delta = saved_doc.composed_delta.compose(new_delta)
  // saved_doc.version = client_state.current_version

  editor.update_contents(new_delta, "silent")

  console.log('document after rebase: ' + JSON.stringify(editor.get_contents()))

  client_state.update_version(incoming_document.v + 1)
  socket.emit("document edit", {
    "delta": client_state.last_sent_delta,
    "v": client_state.current_version
  })
}

const apply_edits = (incoming_document) => {

  // the normal case where we receive an edit from another user

  console.warn("new edit received")

  console.log('document after rebase: ' + JSON.stringify(editor.get_contents()))
  client_state.update_version(incoming_document.v)

  let new_delta = new Delta(incoming_document.delta)
  // if there is an edit that 
  if (client_state.have_pending_changes()) {
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

  // saved_doc.composed_delta = saved_doc.composed_delta.compose(new_delta)
  // saved_doc.version = client_state.current_version

  editor.update_contents(new_delta, "sielnt")
  console.log('document after rebase: ' + JSON.stringify(editor.get_contents()))
}


const on_document_broadcast = (incoming_document) => {
  if (client_state.disconnected === true) return

  if (is_ack(incoming_document)) {
    // this is the case where we recieve and ack
    client_state.waiting_ack = false
    //reset everything when an ack is received 
    client_state.last_sent_delta = new Delta()
    console.warn(`acked`)
  } else if (client_state.waiting_ack) {
    rebase(incoming_document)
  } else {
    apply_edits(incoming_document)
  }
}


const interval_handler = () => {
  if (client_state?.have_pending_changes() && client_state?.disconnected === false) {
    // TODO:: Add logic for pending edits
    if (client_state?.waiting_ack === false) {
      console.warn("sending")
      console.log(`try to send ${JSON.stringify(client_state.pending_changes)}`)
      console.log(`document: ${JSON.stringify(editor.get_contents())}`)
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






const resync_client = async (saved_doc) => {
  return await new Promise(resolve => {
    socket.emit('sync', saved_doc, (answer) => {
      resolve(answer);
    });
  });
}

const on_reconnect = async () => {

  console.log("start reconnection!")
  console.log(JSON.stringify(saved_doc))
  let incoming_document = await resync_client(saved_doc)
  let temp_delta = new Delta(incoming_document.contents)
  let diff = saved_doc.composed_delta.diff(temp_delta)
  console.log(`document in the editor: ${JSON.stringify(editor.get_contents())}`)
  console.log(`saved doc: ${JSON.stringify(saved_doc)}`)
  console.log(`incoming doc: ${JSON.stringify(incoming_document.contents)}`)

  console.log(`diff before transform: ${JSON.stringify(diff)}`)
  console.log(`pending before transform: ${JSON.stringify(client_state.pending_changes)}`)



  if (client_state.have_pending_changes()) {

    diff = client_state.pending_changes.transform(diff, true)
    client_state.pending_changes = diff.transform(client_state.pending_changes, true)
    console.log(`pending after transform: ${JSON.stringify(client_state.pending_changes)}`)

    console.log(`diff after transform: ${JSON.stringify(diff)}`)

  }
  editor.update_contents(diff)
  console.log(`doc after applying difference: ${JSON.stringify(editor.get_contents())}`)

  client_state.disconnected = false
  client_state.current_version = incoming_document.version
  console.log("finished reconnection!")

}

const on_disconnect = () => {
  console.log(`disconnection`)
  saved_doc.composed_delta = editor.quill_editor.getContents()
  saved_doc.version = client_state.current_version
  client_state.disconnected = true
  if (client_state.waiting_ack === true) {
    console.warn(`case waiting for ack at disconnect`)
    console.log(`pending before: ${JSON.stringify(client_state.pending_changes)}`)
    console.log(`pending before: ${JSON.stringify(client_state.last_sent_delta)}`)

    client_state.pending_changes = client_state.last_sent_delta.compose(client_state.pending_changes)
    client_state.last_sent_delta = new Delta()
    console.log(`pending after: ${JSON.stringify(client_state.pending_changes)}`)

    client_state.waiting_ack = false
  }

}

const on_window_load = async () => {
  socket.once("init client", init_client)
  socket.io.on("reconnect", on_reconnect)
  socket.on('disconnect', on_disconnect)
  socket.on("document broadcast", on_document_broadcast)

  socket.on("user connected", update_user_count)

  socket.on("user disconnected", update_user_count)
  editor = new Editor()
  setInterval(interval_handler, 200);

}

window.addEventListener('load', on_window_load)
