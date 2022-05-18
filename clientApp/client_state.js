// let Delta = Quill.import('delta')
class ClientState{
    constructor(current_document, current_version){
        this.waiting_ack = false
        this.current_document = new Delta().compose(current_document)
        this.current_version = current_version
        this.pending_edits = []
    }

    update_document(delta, version=null){
        let new_document = this.current_document.compose(delta)
        // let diff = this.current_document.diff(new_document)
        this.current_document = new_document
        this.current_version = (version === null ? this.current_version + 1 : version)
        // return diff
    }

    push_pending_delta(delta){
        this.pending_edits.push({"delta":delta, "v":this.current_version})
    }

    pop_pending_delta(){
        return this.pending_edits.shift()        
    }

    is_pending_delta(){
        return this.pending_edits.length === 0
    }
}