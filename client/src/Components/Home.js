import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Home = (props) => {
  const [documents, set_documents] = useState([]);

  useEffect(() => {
    const foo = async () => {
      console.log(`here`);
      const response = await fetch("api/getAllDocuments");
      const data = await response.json();
      set_documents(data);
    };
    foo();
    
  }, []);

  return (
    <React.Fragment>
      {documents.map((doc) => (
        <div key={doc._id}>
          <Link  to={`/Editor/${doc._id}`}>{doc.title}</Link>
        </div>
      ))}
    </React.Fragment>
  );
};

export default Home;
