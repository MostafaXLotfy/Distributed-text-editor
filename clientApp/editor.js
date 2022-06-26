class Editor {
  constructor() {
    Quill.register("modules/cursors", QuillCursors);
    this.quill_editor = new Quill("#editor", {
      theme: "snow",
      modules: {
        cursors: true,
      },
    });

    this.cursor = this.quill_editor.getModule("cursors");
    this.cursor.createCursor("cursor", "user 1", "red");
    this.quill_editor.on("text-change", this.__on_text_change);
    this.quill_editor.on("selection-change", this.__on_selection_change());
  }

  __on_text_change(delta, old_delta, source) {
    if (source !== "user") {
      return;
    }
    document_handler.pend_delta(delta);
  }

  __updateCursor(range) {
    // Use a timeout to simulate a high latency connection.
    setTimeout(() => this.cursor.moveCursor("cursor", range), 0);
  }

  __on_selection_change() {
    return (range, old_range, source) => {
      if (range) {
        this.__updateCursor(range);
      }
    };
  }

  set_contents(delta, source) {
    this.quill_editor.setContents(delta, source);
  }
  update_contents(delta, source) {
    this.quill_editor.updateContents(delta, source);
  }

  get_contents() {
    return this.quill_editor.getContents();
  }
  enable_editing(enabled = true){
    this.quill_editor.enable(enabled)
  }

  update_user_count(user_count){
    let element = document.getElementById("user-number-paragraph");
    element.textContent = `connected users: ${user_count}`;
  };

  change_state(state){
  let state_element = document.getElementById("state")
  state_element.textContent = state
  if(state == "online")state_element.style.color = "green"
  else if(state == "offline")state_element.style.color = "red"
  else state_element.style.color = "blue"
}
}
