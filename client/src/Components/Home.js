import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Delta from "quill-delta";

const Home = (props) => {
  const [documents, set_documents] = useState([]);
  const get_all_documents = async () => {
    const response = await fetch("api/getAllDocuments");
    const data = await response.json();
    set_documents(data);
  };

  const create_document =  () => {
    const body = JSON.stringify({
      title: "Untitled Document",
      version: 0,
      contents: new Delta(),
    });
    console.log(body)
    fetch("api/createDocument", {
      method: "post",
      headers: {
	'Content-type': 'application/json',
	'Accept': 'application/json'
      },
      body:body})
    .then((response) => response.json())
    .then((data) => set_documents(documents.concat([data])));
  };


  useEffect(() => {
    get_all_documents();
  }, []);

  return (
    <React.Fragment>
      {documents.map((doc) => (
        <div key={doc._id}>
          <Link to={`/Editor/${doc._id}`}>{doc.title}</Link>
        </div>
      ))}
      <input type="button" value="new document" onClick={create_document}/>
    </React.Fragment>
  );
};

export default Home;
