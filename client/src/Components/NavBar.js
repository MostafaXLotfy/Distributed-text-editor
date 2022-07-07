import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/NavBar.css";

const sign_in = () => {};

const sign_up = () => {};

const log_out = () => {};

const NavBar = (props) => {
  const title = props.document_title;
  const on_title_change = props.on_title_change;
  const on_title_focus = (event) => {
    event.target.contentEditable = true;
  };

  const on_title_blur = (event) => {
    event.target.contentEditable = false;
    on_title_change(event.target.innerText);
    props.broadcast_title(event.target.innerText)
  };
  return (
    <nav>
      <Link to={`/`} className="link">
        Home
      </Link>
      {title === null ? (
        ""
      ) : (
        <div
          className="document-title"
          onClick={on_title_focus}
          onBlur={on_title_blur}
        >
          {title}
        </div>
      )}
      <input type="text" placeholder="search" className="nav-txt" />
      <input type="button" value={`Sign in`} className="nav-btn" id="sign-in" />
      <input type="button" value={`Sign Up`} className="nav-btn" />
    </nav>
  );
};

export default NavBar;
