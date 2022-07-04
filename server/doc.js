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
    this.doc = {_id,contents:new Delta(), version:0, title:"Untitle Document"}
    this.not_saved = false;
    this.writting = false;

    this.__load_document();
  }

  update_document(delta, version) {
    if (version > this.doc.version) {
      this.doc.contents = this.doc.contents.compose(delta);
      fix_document(this.doc.contents)
      this.doc.version = version;
    } else {
      return "ignore";
    }
    this.__save();
    return "accept";
  }

  __save() {
      this.__save_document();
  }


  async __save_document() {
      //todo: change signature
      save_document(this.doc._id, this.doc)
  }

  async __load_document() {
      let data = await get_document(this.doc._id)
      this.doc.title = data.title
      this.doc.contents = new Delta(data.contents)
      this.doc._id = data._id
      this.doc.version = data.version

  }

  get_document() {
    return this.doc;
  }

  sync_document(incoming_document) {
    if (incoming_document.version > this.doc.version) {
      let temp_delta = new Delta(incoming_document.contents);
      fix_document(temp_delta)
      fix_document(this.doc.contents)
      let diff = this.doc.contents.diff(temp_delta);
      this.doc.version = incoming_document.version;
      this.doc.contents = this.doc.contents.compose(diff);
      this.__save_document();
    }

    this.doc.contents = this.doc.contents.compose(new Delta());
  }
}

module.exports = { DocumentHandler };
