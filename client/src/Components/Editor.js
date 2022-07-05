import Quill from "quill";
import React from "react";
import { DocumentHandler } from "../scripts/DocumentHandler";
import { DocumentContext } from "../Contexts/documentContext";
import { useState, useContext, useRef } from "react";
import {useParams} from 'react-router-dom'
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
//TODO::implement this
const change_state = () => {
  return;
};
const Editor = (props) => {
  const editor_ref = useRef(null);
  const toolbar_ref = useRef(null);
  const {_id} = useParams()
  const [clients_count, set_clients_count] = useState(1)

  React.useEffect(() => {
    if(quill_editor) return;
    quill_editor = new Quill(editor_ref.current, {
      modules: {
        toolbar: toolbar_ref,
      },
      theme: "snow",
    });
    quill_editor.on("text-change", on_text_change);
  }, []);

  React.useEffect(() => {
    const foo = async()=>{
	const response = await fetch(`/api/getDocument/${_id}`)
	const data = await response.json()
	console.log(JSON.stringify(data))
	socket.emit(`room`, _id)
	document_handler = new DocumentHandler(_id, data.doc.version);
	set_contents(data.doc.contents, "silent");

    }
      foo()
  }, []);

    React.useEffect(()=>{
	socket.io.on("reconnect", on_reconnect);
	socket.on("disconnect", on_disconnect);
	socket.on("document broadcast", on_document_broadcast);

	socket.on("user connected", (count)=> set_clients_count(count));

	socket.on("user disconnected", (count)=> set_clients_count(count));

	setInterval(interval_handler, 50);
    }, [])
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
