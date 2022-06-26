//temp name
class DocumentHandler {
  constructor() {
    this.pending_deltas = new Delta();
    this.last_sent_delta = new Delta();
    this.saved_at_disconnect = new Delta();
    this.version = 0;
  }

  //returns the version of the document that is present in the editor
  get_document() {
    return editor.get_contents();
  }

  // pends the edits that client can't sent in the state of waiting ack or disconnect
  pend_delta(delta) {
    this.pending_deltas = this.pending_deltas.compose(delta);
  }

  have_pending_deltas() {
    return this.pending_deltas.ops.length > 0;
  }

  clear_pending_deltas() {
    this.pending_deltas = new Delta();
  }

  //checks if a delta is the same as the one that the client sent recently
  // if they are the same then this is an ack from the server to client
  // otherwise this is a negative ack
  __is_ack(delta) {
    return (
      client_state.waiting_ack && _.isEqual(this.last_sent_delta.ops, delta.ops)
    );
  }

  //handles the case when the server ignores a sent edit
  //because  two users sends an edit to the server at the same time
  __rebase(delta, version) {
    // this is the case where we do a rebase

    let new_delta = new Delta(delta);

    // transform the recieved delta to avoid any conflicts

    // if there is a pending change that wasn't sent then we should compose it with the latest thing we sent and didn't get ack
    if (this.have_pending_deltas()) {
      new_delta = this.last_sent_delta
        .compose(this.pending_deltas)
        .transform(new_delta, true);

      //if there is any pending changes we should transform them according to what we received so we don't send a wrong delta

      this.pending_deltas = new_delta.transform(this.pending_deltas, true);
    } else {
      // if there is no pending changes then we should compose only with the latest thing we sent
      new_delta = this.last_sent_delta.transform(new_delta, true);
    }

    // transform the latest thing we sent but didn't get ack
    this.last_sent_delta = new_delta.transform(this.last_sent_delta, true);

    // if there is any pending changes we should transform them according to what we received so we don't send a wrong delta
    editor.update_contents(new_delta, "silent");
    this.version = version + 1;
  }

  //applys the received edits to the current document and handles any conflicts with the present document
  update_document(delta, version) {
    this.version = version;
    let new_delta = new Delta(delta);
    // if there is an edit that
    if (this.have_pending_deltas()) {
      new_delta = this.pending_deltas.transform(new_delta, true);

      this.pending_deltas = new_delta.transform(this.pending_deltas, true);
    }

    editor.update_contents(new_delta, "sielnt");
  }

  handle_edit(edit) {
    if (this.__is_ack(edit.delta)) {
      // this is the case where we recieve and ack
      client_state.waiting_ack = false;
      //reset everything when an ack is received
      this.last_sent_delta = new Delta();
      console.warn(`acked`);
    } else if (client_state.waiting_ack) {
      this.__rebase(edit.delta, edit.version);
      socket.emit("document edit", {
        delta: this.last_sent_delta,
        version: this.version,
      });
    } else {
      this.update_document(edit.delta, edit.version);
    }
  }

  update_version() {
    this.version++;
  }
}
