import Quill from "quill";
import React, { useContext } from "react";
import { DocumentHandler } from "../scripts/DocumentHandler";
import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  join_room,
  interval_handler,
  register_events,
} from "../scripts/socket-io";

import { CurrentDocumentTitleContext } from "./global_context";
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

const Editor = () => {
  const toolbar_ref = useRef(null);
  const { _id } = useParams();
  const [clients_count, set_clients_count] = useState(1);
  const [, set_title, , set_id] = useContext(CurrentDocumentTitleContext);

  React.useEffect(() => {
    quill_editor = new Quill("#editor", {
      modules: {
        toolbar: toolbar_ref,
      },
      theme: "snow",
    });
    quill_editor.on("text-change", on_text_change);

    const get_document = async () => {
      const response = await fetch(`/api/getDocument/${_id}`);
      const data = await response.json();
      join_room(_id);
      document_handler = new DocumentHandler(_id, data.doc.version, data.title);
      set_contents(data.doc.contents, "silent");
      set_title(data.doc.title);
      set_id(_id);
    };
    get_document();

    register_events([
      { name: "user count", handler: (count) => set_clients_count(count) },
      { name: "title changed", handler: (new_title) => set_title(new_title) },
    ]);

    const interval = setInterval(interval_handler, 20);
    return () => {
      toolbar_ref.current = null;

      set_title(null);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="editor-container">
      <div>
        <p>Connected: {clients_count}</p>
      </div>
      <div id="toolbar" ref={toolbar_ref}></div>
      <div id="editor"></div>
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
