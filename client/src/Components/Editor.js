import Quill from "quill";
import React from "react";
import { DocumentHandler } from "../scripts/DocumentHandler";
import { DocumentContext } from "../Contexts/documentContext";
import { useState, useContext, useRef } from "react";

let document_handler;
//let quill_editor;
let quill_editor;
//let ref

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],
  ["clean"], // remove formatting button
];

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
const Editor = (props) => {
  const doc = useContext(DocumentContext);
  const editor_ref = useRef(null);
  const toolbar_ref = useRef(null);
  const [num_users, set_num_users] = useState(1);
  const clients_count = props.clients_count

  React.useEffect(() => {
    if(quill_editor) return;
    quill_editor = new Quill(editor_ref.current, {
      modules: {
        toolbar: toolbar_ref,
      },
      theme: "snow",
    });
    document_handler = new DocumentHandler(doc.version);
    quill_editor.on("text-change", on_text_change);
  }, []);

  React.useEffect(() => {
    set_contents(doc.contents, "silent");
    document_handler.version = doc.version
  }, [doc]);

  return (
    <React.Fragment>
      <div>
        <p>Connected: {clients_count}</p>
      </div>
      <div ref={toolbar_ref}></div>
      <div id="editor" ref={editor_ref}></div>
    </React.Fragment>
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
