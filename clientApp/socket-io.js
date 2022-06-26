const init_client = (new_document) => {
    document_handler = new DocumentHandler(
      new_document.contents,
      new_document.version
    );
    document_handler.version = new_document.version;
    editor.set_contents(new_document.contents);
    editor.update_user_count(new_document.clientsCount);
    editor.change_state("online")
  
  };

  const resync_client = async (saved_doc) => {
    return await new Promise((resolve) => {
      socket.emit("sync", saved_doc, (answer) => {
        resolve(answer);
      });
    });
  };
  
  const on_reconnect = async () => {
    editor.enable_editing(false)
    editor.change_state("syncing... Editing is diabled")
  
    let incoming_document = await resync_client({
      contents: document_handler.saved_at_disconnect,
      version: document_handler.version,
    });
    let temp_delta = new Delta(incoming_document.contents);
    let diff = document_handler.saved_at_disconnect.diff(temp_delta);
  
    
    document_handler.update_document(diff, incoming_document.version);
    client_state.disconnected = false;
    editor.enable_editing()
  
    editor.change_state("online")
  };
  
  const on_disconnect = () => {
    editor.change_state("offline")
    document_handler.saved_at_disconnect = editor.get_contents();
  
    client_state.disconnected = true;
    if (client_state.waiting_ack === true) {
      document_handler.last_sent_delta = new Delta();
      client_state.waiting_ack = false;
    }
  };
  
  const on_document_broadcast = (edit) => {
    document_handler.handle_edit(edit);
  };