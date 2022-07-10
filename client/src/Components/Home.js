import React, { useState, useEffect } from "react";
import Delta from "quill-delta";
import DocumentCard from "./DocumentCard";
import "../css/Home.css";
const Home = (props) => {
  const [documents, set_documents] = useState([]);


  //TODO:: Add a button for this
  const create_document = () => {
    const body = JSON.stringify({
      title: "Untitled Document",
      version: 0,
      contents: new Delta(),
      method: "post",
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
      },
      body: body,
    })
      .then((response) => response.json())
      .then((data) => set_documents(documents.concat([data])));
  };

  useEffect(() => {
    fetch("api/getAllDocuments")
	  .then(response => response.json())
	  .then(data=>set_documents(data));
  }, []);

  return (
    <div className="home-container">
      <div className="documents-display">
        {documents.map((doc) => (
          <DocumentCard title={doc.title} _id={doc._id} key={doc._id} />
        ))}
      </div>
    </div>
  );
};

export default Home;
