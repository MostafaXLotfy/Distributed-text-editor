const Delta = require("quill-delta");
const {get_document, save_document} = require("./database")
const fs = require("fs");



function fix_document(doc){
  let length = doc.ops.length
  if (length > 0 && doc.ops[length - 1].delete != null){
    doc.ops.pop()
  }
}


class DocumentHandler {
  constructor(_id) {
    this.doc = {_id,contents:new Delta(), version:0, Title:"Untitle Document"}
    this.contents = new Delta();
    this.version = 0;
    this.not_saved = false;
    this.writting = false;

    this.__load_document();
  }

  update_document(delta, version) {
    if (version > this.version) {
      this.contents = this.contents.compose(delta);
      fix_document(this.contents)
      this.version = version;
    } else {
      return "ignore";
    }
    this.__save();
    return "accept";
  }

  __save() {
    if (!this.writting) {
      this.writting = true;
      this.__save_document();
    } else {
      this.saved_delta = true;
    }
  }


  async __save_document() {
      //todo: change signature
      save_document(this.contents._id, this.contents)
  }

  __load_document() {
      this.doc = get_document(this.contents._id)
  }

  //TODO::remove this
  get_document() {
    return { contents: this.contents, version: this.version };
  }

  sync_document(incoming_document) {
    if (incoming_document.version > this.version) {
      let temp_delta = new Delta(incoming_document.contents);
      fix_document(temp_delta)
      fix_document(this.contents)
      let diff = this.contents.diff(temp_delta);
      this.version = incoming_document.version;
      this.contents = this.contents.compose(diff);
      this.__save_document();
    }

    this.contents = this.contents.compose(new Delta());
  }
}

module.exports = { DocumentHandler };
