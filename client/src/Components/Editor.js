import Quill from "quill";
import React from "react";
import { DocumentHandler } from "../scripts/DocumentHandler";
import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  on_document_broadcast,
  on_disconnect,
  on_reconnect,
  socket,
  interval_handler,
} from "../scripts/socket-io";

let document_handler;
let quill_editor;

const on_text_change = (delta, old_delta, source) => {
  if (source !== "user") return;
  document_handler.pend_delta(delta);
};

const set_contents = (contents, source) => {
  quill_editor.setContents(contents, source);
};

const get_contents = () => {
  return quill_editor.getContents();
};

const update_contents = (delta, source) => {
  quill_editor.updateContents(delta, source);
};

const enable_editing = (enabled) => {
  quill_editor.enable(enabled);
  if (enabled === true) {
    quill_editor.focus();
  }
};


const Editor = (props) => {
  const editor_ref = useRef(null);
  const toolbar_ref = useRef(null);
  const on_title_change = props.on_title_change;
  const { _id } = useParams();
  const [clients_count, set_clients_count] = useState(1);

  React.useEffect(() => {
    quill_editor = new Quill(editor_ref.current, {
      modules: {
        toolbar: toolbar_ref,
      },
      theme: "snow",
    });

    quill_editor.on("text-change", on_text_change);
    const get_document = async () => {
      const response = await fetch(`/api/getDocument/${_id}`);
      const data = await response.json();
      socket.emit(`room`, _id);
      document_handler = new DocumentHandler(_id, data.doc.version, data.title);
      set_contents(data.doc.contents, "silent");
      on_title_change(data.doc.title);
      props.set_id(_id)
    };
    get_document();

    socket.io.on("reconnect", on_reconnect);
    socket.on("disconnect", on_disconnect);
    socket.on("document broadcast", on_document_broadcast);

    socket.on("user count", (count) => {
      set_clients_count(count);
    });

    socket.on("title changed", (title) => {
      on_title_change(title);
    });

    const interval = setInterval(interval_handler, 20);
    return()=>{
	on_title_change(null)
	clearInterval(interval)
    }
  }, []);

  return (
    <div className="editor-container">
      <div>
        <p>Connected: {clients_count}</p>
      </div>
      <div id="toolbar" ref={toolbar_ref}></div>
      <div id="editor" ref={editor_ref}></div>
    </div>
  );
};

export {
  Editor,
  get_contents,
  set_contents,
  update_contents,
  document_handler,
  enable_editing,
};
