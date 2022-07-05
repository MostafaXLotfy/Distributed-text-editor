import socketIOClient from "socket.io-client";
import {
  get_contents,
  document_handler,
  change_state,
  enable_editing,
} from "../Components/Editor";
import Delta from "quill-delta";
import { client_state } from "./DocumentHandler";


const ENDPOINT = "http://localhost:5000";
const socket = socketIOClient(ENDPOINT, {});

const resync_client = async (saved_doc) => {
  return await new Promise((resolve) => {
    socket.emit(
      "sync",
      { contents: saved_doc.contents, version: saved_doc.version, _id:document_handler._id },
      (answer) => {
        resolve(answer);
      }
    );
  });
};

const on_reconnect = async () => {
  enable_editing(false);
  change_state("syncing... Editing is diabled");
  let incoming_document = await resync_client({
    contents: document_handler.saved_at_disconnect,
    version: document_handler.version,
  });
  let temp_delta = new Delta(incoming_document.contents);
  let diff = document_handler.saved_at_disconnect.diff(temp_delta);

  document_handler.update_document(diff, incoming_document.version);
  client_state.disconnected = false;
  enable_editing();

  change_state("online");
};

const on_disconnect = () => {
  change_state("offline");
  document_handler.saved_at_disconnect = get_contents();

  client_state.disconnected = true;
  if (client_state.waiting_ack === true) {
    document_handler.last_sent_delta = new Delta();
    client_state.waiting_ack = false;
  }
};

const on_document_broadcast = (edit) => {
  console.log(JSON.stringify(edit));
  document_handler.handle_edit(edit);
};

const interval_handler = () => {
  if (
    document_handler?.have_pending_deltas() &&
    client_state?.disconnected === false
  ) {
    if (client_state.waiting_ack === false) {
      console.warn("wait ack");
      let delta = document_handler.pending_deltas;
      document_handler.update_version();
      document_handler.clear_pending_deltas();
      socket.emit("document edit", {
        delta: delta,
        version: document_handler.version,
        _id: document_handler._id
      });

      document_handler.last_sent_delta = new Delta(delta);
      client_state.waiting_ack = true;
    }
  }
};

export {
  on_document_broadcast,
  on_disconnect,
  on_reconnect,
  interval_handler,
  socket,
};
