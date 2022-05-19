class Editor {
    constructor(on_text_change, on_selection_change) {
        Quill.register('modules/cursors', QuillCursors)
        this.quill_editor = new Quill('#editor', {
            theme: 'snow',
            modules: {
                cursors: true
            }
        })

        this.cursor = this.quill_editor.getModule('cursors')
        this.cursor.createCursor('cursor', 'user 1', 'red')
        this.quill_editor.on('text-change', this.__on_text_change)
        this.quill_editor.on('selection-change', this.__on_selection_change())
    }

    __on_text_change(delta, old_delta, source) {
        if (source != "user")
            return
        client_state.pend_changes(delta)

        // client_state.update_version()
        // // TODO:: Add logic for pending edits
        // if (!client_state.waiting_ack) {
        //     socket.emit("document edit", {
        //         "delta": delta,
        //         "v": client_state.current_version
        //     })

        //     client_state.last_sent_delta = new Delta(delta)
        //     client_state.waiting_ack = true
        // } else {
        //     client_state.pend_changes(delta)
        // }
    }

    __updateCursor(range) {
        // Use a timeout to simulate a high latency connection.
        setTimeout(() => this.cursor.moveCursor('cursor', range), 0);
      }

    __on_selection_change(){
        return (range, old_range, source)=>{
            if (range){
                 this.__updateCursor(range)
            }
        }
    }

    set_contents(delta, source){
        this.quill_editor.setContents(delta, source)
    }
    update_contents(delta, source){
        this.quill_editor.updateContents(delta, source)
    }
}