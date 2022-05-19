// let Delta = Quill.import('delta')
class ClientState{
    constructor(current_version){
        this.waiting_ack = false
        this.current_version = current_version
        this.pending_changes = new Delta()
        this.last_sent_delta = null
        this.can_send = false
    }

    update_version(version=null){
        this.current_version = (version === null ? this.current_version + 1 : version)
    }

    pend_changes(delta){
        this.pending_changes = this.pending_changes.compose(delta)
    }

    have_pending_changes(){
        return this.pending_changes.ops.length !== 0
    }

    get_pending_changes(){
        let pending_changes_temp = this.pending_changes
        this.pending_changes = new Delta()
        return pending_changes_temp
    }

    foo
}