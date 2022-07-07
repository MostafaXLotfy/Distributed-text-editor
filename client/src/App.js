import "./App.css";

import { useState, useEffect } from "react";
import { DocumentContext } from "./Contexts/documentContext";
import { Editor } from "./Components/Editor";
import Delta from "quill-delta";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Home from "./Components/Home";
import NavBar from "./Components/NavBar";
import { broadcast_title } from "./scripts/socket-io";

function App() {
  const [title, set_title] = useState(null);
  const [id, set_id] = useState();
  const on_title_change = (title, callback) => {
    set_title(title);
    if (callback != null) callback();
  };

  const broadcast_new_title = (title) => {
    broadcast_title(id, title);
  };

  return (
    <div className="App">
      <NavBar
        document_title={title}
        on_title_change={on_title_change}
        broadcast_title={broadcast_new_title}
      />
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route
          path="/Editor/:_id"
          element={<Editor on_title_change={on_title_change} set_id={set_id} />}
        />
      </Routes>
      {/* <DocumentContext.Provider value={doc}>
        <Editor clients_count={clients_count}/>
      </DocumentContext.Provider>*/}
    </div>
  );
}

export default App;
