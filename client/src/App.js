import "./App.css";

import { useState } from "react";
import { Editor } from "./Components/Editor";
import { Route, Routes } from "react-router-dom";
import Home from "./Components/Home";
import NavBar from "./Components/NavBar";
import { CurrentDocumentTitleContext } from "./Components/global_context";
import { broadcast_title } from "./scripts/socket-io";

function App() {
  const [title, set_title] = useState(null);
  const [id, set_id] = useState();

  const change_title = (new_title, broadcast = false) => {
    set_title(new_title);
    if (broadcast === true) {
      broadcast_title(id, new_title);
    }
  };

  return (
    <div className="App">
      <CurrentDocumentTitleContext.Provider
        value={[title, change_title, id, set_id]}
      >
        <NavBar current_document_title={title} />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/Editor/:_id" element={<Editor />} />
        </Routes>
      </CurrentDocumentTitleContext.Provider>
    </div>
  );
}

export default App;
