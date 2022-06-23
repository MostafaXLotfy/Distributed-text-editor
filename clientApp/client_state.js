class ClientState{
    constructor(current_version){
        this.received_delta = new Delta()
        this.latest_delta = new Delta()
        this.waiting_ack = false
        this.current_version = current_version
        this.pending_changes = new Delta()
        this.last_sent_delta = new Delta()
        this.disconnected = false
    }


    update_version(version=null){
        this.current_version = (version === null ? this.current_version + 1 : version)
    }

    pend_changes(delta){
        console.log(`pending before compose${JSON.stringify(this.pending_changes)}`)
        this.pending_changes = this.pending_changes.compose(delta)
        console.log(`pending after compose${JSON.stringify(this.pending_changes)}`)
        this.latest_delta = this.pending_changes
    }

    have_pending_changes(){
        return this.pending_changes.ops.length !== 0
    }

    get_pending_changes(){
        let pending_changes_temp = this.pending_changes
        this.pending_changes = new Delta()
        return pending_changes_temp
    }
}