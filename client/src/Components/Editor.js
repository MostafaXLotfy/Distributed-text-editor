import Quill from "quill";
import React from "react";
import { DocumentHandler } from "../scripts/DocumentHandler";
import { DocumentContext } from "../Contexts/documentContext";
import { useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  on_document_broadcast,
  on_disconnect,
  on_reconnect,
  socket,
  interval_handler,
  change_title,
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
//TODO::implement this
const change_state = () => {
  return;
};
const Editor = () => {
  const editor_ref = useRef(null);
  const toolbar_ref = useRef(null);
  const { _id } = useParams();
  const [clients_count, set_clients_count] = useState(1);
  const [title, set_title] = useState("Untitled Document");
  const [editable, set_editlable] = useState(false);

  const on_blur_handler = (event) => {
    set_editlable(false);
    change_title(_id, event.target.innerText);
  };

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
      set_title(data.doc.title);
    };
    get_document();
    socket.io.on("reconnect", on_reconnect);
    socket.on("disconnect", on_disconnect);
    socket.on("document broadcast", on_document_broadcast);

    socket.on("user count", (count) => {
      set_clients_count(count);
      console.log(count);
    });

    socket.on("title changed", (title) => {
      set_title(title);
    });
    setInterval(interval_handler, 20);
  }, []);

  return (
    <div className="editor-container">
      <div
        contentEditable={editable}
        onClick={() => set_editlable(true)}
        onBlur={on_blur_handler}
      >
        {title}
      </div>
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
  change_state,
};
