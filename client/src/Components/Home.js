import React, { useState, useEffect } from "react";
import Delta from "quill-delta";
import DocumentCard from "./DocumentCard";
import "../css/Home.css";
const Home = (props) => {
  const [documents, set_documents] = useState([]);

  const get_all_documents = async () => {
    const response = await fetch("api/getAllDocuments");
    const data = await response.json();
    set_documents(data);
  };

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
    get_all_documents();
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
