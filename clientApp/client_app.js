let Delta = Quill.import("delta");
let socket = io();
var client_state = {
  waiting_ack: false,
  disconnected: false,
};
let editor = new Editor();
let document_handler = new DocumentHandler();
document_handler = new DocumentHandler();

const update_user_count = (user_count) => {
  let element = document.getElementById("user-number-paragraph");
  element.textContent = `connected users: ${user_count}`;
};
const change_state = (state)=>{
  let state_element = document.getElementById("state")
  state_element.textContent = state
  if(state == "online")state_element.style.color = "green"
  else if(state == "offline")state_element.style.color = "red"
  else state_element.style.color = "blue"
}

const init_client = (new_document) => {
  document_handler = new DocumentHandler(
    new_document.contents,
    new_document.version
  );
  document_handler.version = new_document.version;
  editor.set_contents(new_document.contents);
  update_user_count(new_document.clientsCount);
  change_state("online")

};

const interval_handler = () => {
  if (
    document_handler?.have_pending_deltas() &&
    client_state?.disconnected === false
  ) {
    if (client_state.waiting_ack === false) {
      let delta = document_handler.pending_deltas;
      document_handler.update_version();
      document_handler.clear_pending_deltas();
      socket.emit("document edit", {
        delta: delta,
        version: document_handler.version,
      });

      document_handler.last_sent_delta = new Delta(delta);
      client_state.waiting_ack = true;
    }
  }
};

const resync_client = async (saved_doc) => {
  return await new Promise((resolve) => {
    socket.emit("sync", saved_doc, (answer) => {
      resolve(answer);
    });
  });
};

const on_reconnect = async () => {
  editor.enable_editing(false)
  change_state("syncing... Editing is disabled")

  let incoming_document = await resync_client({
    contents: document_handler.saved_at_disconnect,
    version: document_handler.version,
  });
  let temp_delta = new Delta(incoming_document.contents);
  let diff = document_handler.saved_at_disconnect.diff(temp_delta);

  document_handler.update_document(diff, incoming_document.version);
  client_state.disconnected = false;

  editor.enable_editing()
  change_state("online")
};

const on_disconnect = () => {
  change_state("offline")
  console.log(`disconnection`);
  document_handler.saved_at_disconnect = editor.get_contents();

  client_state.disconnected = true;
  if (client_state.waiting_ack === true) {
    document_handler.pending_deltas = document_handler.last_sent_delta.compose(
      document_handler.pending_deltas
    );
    document_handler.last_sent_delta = new Delta();
    client_state.waiting_ack = false;
  }
};

const on_document_broadcast = (edit) => {
  document_handler.handle_edit(edit);
};

const on_window_load = async () => {
  socket.once("init client", init_client);
  socket.io.on("reconnect", on_reconnect);
  socket.on("disconnect", on_disconnect);
  socket.on("document broadcast", on_document_broadcast);

  socket.on("user connected", update_user_count);

  socket.on("user disconnected", update_user_count);
  setInterval(interval_handler, 200);
};

window.addEventListener("load", on_window_load);
