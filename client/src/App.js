import "./App.css";

import { useState, useEffect } from "react";
import { DocumentContext } from "./Contexts/documentContext";
import { Editor } from "./Components/Editor";
import Delta from "quill-delta";
import {Route, Routes, BrowserRouter} from 'react-router-dom'
import Home from "./Components/Home";
function App() {
  useEffect(() => {
  }, []);
  return (
    <div className="App" >
      <Routes>
	  <Route exact path="/" element={<Home/>}/>
	  <Route path="/Editor/:_id" element={<Editor/>}/>
      </Routes>
      {/* <DocumentContext.Provider value={doc}>
        <Editor clients_count={clients_count}/>
      </DocumentContext.Provider>*/}
    </div>
  );
}

export default App;
