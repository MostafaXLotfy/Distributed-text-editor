let Delta = Quill.import("delta");
let socket = io();
var client_state = {
  waiting_ack: false,
  disconnected: false,
};
let editor = new Editor();
let document_handler = new DocumentHandler();


const interval_handler = () => {
  if (
    document_handler?.have_pending_deltas() &&
    client_state?.disconnected === false
  ) {
    if (client_state.waiting_ack === false) {
      console.warn('wait ack')
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


const on_window_load = async () => {
  socket.once("init client", init_client);
  socket.io.on("reconnect", on_reconnect);
  socket.on("disconnect", on_disconnect);
  socket.on("document broadcast", on_document_broadcast);

  socket.on("user connected", editor.update_user_count);

  socket.on("user disconnected", editor.update_user_count);
  setInterval(interval_handler, 200);
};

window.addEventListener("load", on_window_load);
