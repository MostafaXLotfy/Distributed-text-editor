import "./App.css";

import { useState, useEffect } from "react";
import { DocumentContext } from "./Contexts/documentContext";
import { Editor } from "./Components/Editor";
import Delta from "quill-delta";
import {
  on_document_broadcast,
  on_disconnect,
  on_reconnect,
  socket,
  interval_handler,
} from "./scripts/socket-io";

function App() {
  const [doc, setDoc] = useState({ contents: new Delta(), version: 0 });
  const [clients_count, set_clients_count] = useState(0)
  useEffect(() => {
    socket.io.on("reconnect", on_reconnect);
    socket.on("disconnect", on_disconnect);
    socket.on("document broadcast", on_document_broadcast);

    socket.on("user connected", set_clients_count);

    socket.on("user disconnected", set_clients_count);

    setInterval(interval_handler, 50);
    const foo = async () => {
      const response = await fetch("/api/getDocument");
      const data = await response.json();
      setDoc(data.doc);
      set_clients_count(data.clients_count)
    };
    foo();
  }, []);
  return (
    <div className="App">
      <DocumentContext.Provider value={doc}>
        <Editor clients_count={clients_count}/>
      </DocumentContext.Provider>
    </div>
  );
}

export default App;
