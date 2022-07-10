import socketIOClient from "socket.io-client";
import {
  get_contents,
  document_handler,
  enable_editing,
} from "../Components/Editor";
import Delta from "quill-delta";
import { client_state } from "./DocumentHandler";

const ENDPOINT = "http://localhost:5000";
const socket = socketIOClient(ENDPOINT, {});

const broadcast_title = (_id, title) => {
  socket.emit("change title", { _id, title });
};

const resync_client = async (saved_doc) => {
  return await new Promise((resolve) => {
    socket.emit(
      "sync",
      {
        contents: saved_doc.contents,
        version: saved_doc.version,
        _id: document_handler._id,
      },
      (answer) => {
        resolve(answer);
      }
    );
  });
};

const on_reconnect = async () => {
  enable_editing(false);
  let incoming_document = await resync_client({
    contents: document_handler.saved_at_disconnect,
    version: document_handler.version,
  });
  let temp_delta = new Delta(incoming_document.contents);
  let diff = document_handler.saved_at_disconnect.diff(temp_delta);

  document_handler.update_document(diff, incoming_document.version);
  client_state.disconnected = false;
  enable_editing();
};

const on_disconnect = () => {
  document_handler.saved_at_disconnect = get_contents();

  client_state.disconnected = true;
  if (client_state.waiting_ack === true) {
    document_handler.last_sent_delta = new Delta();
    client_state.waiting_ack = false;
  }
};

const on_document_broadcast = (edit) => {
  document_handler.handle_edit(edit);
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
      send_edit({
        delta: delta,
        version: document_handler.version,
        _id: document_handler._id,
      });

      document_handler.last_sent_delta = new Delta(delta);
      client_state.waiting_ack = true;
    }
  }
};

const register_events = (events = []) => {
  socket.on("document broadcast", on_document_broadcast);
  socket.io.on("reconnect", on_reconnect);
  socket.on("disconnect", on_disconnect);
  for (const event of events) {
    socket.on(event.name, event.handler);
  }
};

const join_room = (room_id) => {
  socket.emit("room", room_id);
};

const send_edit = (edit) => {
  socket.emit("document edit", edit);
};

export {
  interval_handler,
  join_room,
  send_edit,
  broadcast_title,
  register_events,
};
