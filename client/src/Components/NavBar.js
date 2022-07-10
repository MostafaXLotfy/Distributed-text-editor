import React from "react";
import { Link } from "react-router-dom";
import "../css/NavBar.css";
import {CurrentDocumentTitleContext} from './global_context'
import {useContext} from 'react'

//TODO::implement sign_in, sign_up, log_out
const sign_in = () => {};

const sign_up = () => {};

const log_out = () => {};

const NavBar = () => {
  const [title, set_title, ] = useContext(CurrentDocumentTitleContext)

  const on_title_focus = (event) => {
    event.target.contentEditable = true;
  };

  
  const on_title_blur = (event) => {
    event.target.contentEditable = false;
    set_title(event.target.innerText, true)
  };

  //TODO::prevent new lines in the dcoument-title div
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
