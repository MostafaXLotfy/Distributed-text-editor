const Delta = require("quill-delta");
const fs = require("fs");

class Doc {
  constructor() {
    this.contents = new Delta();
    this.version = 0;
    this.not_saved = false;
    this.writting = false;
    this.__load_document();
  }

  update_document(delta, version) {
    if (version > this.version) {
      this.contents = this.contents.compose(delta).compose(new Delta());
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
    fs.writeFile(
      "document.json",
      JSON.stringify(this.get_document()),
      async () => {
        //if after you finished writting the current document, there was a new delta then re-call the function
        if (this.not_saved) {
          this.not_saved = false;
          this.__save_document();
        }
        this.writting = false;
      }
    );
  }

  __load_document() {
    if (fs.existsSync("document.json")) {
      let parsed_document = JSON.parse(fs.readFileSync("document.json"));
      this.contents = new Delta(parsed_document.contents);
      this.version = parsed_document.version;
    } else
      fs.writeFileSync(
        "document.json",
        JSON.stringify({ contents: this.contents, version: this.version })
      );
  }

  get_document() {
    return { contents: this.contents, version: this.version };
  }

  sync_document(incoming_document) {
    if (incoming_document.version > this.version) {
      let temp_delta = new Delta(incoming_document.composed_delta);
      let diff = this.contents.diff(temp_delta);

      this.version = incoming_document.version;
      this.contents = this.contents.compose(diff);
      this.__save_document();
    }

    this.contents = this.contents.compose(new Delta());
  }
}

module.exports = { Doc };
