class client_document{
    constructor(composed_delta=new Delta(), version=0){
        this.composed_delta = composed_delta
        this.version = version
    }
    update_document(delta, version=null){
        this.composed_delta.compose(delta)
        this.version === null ? version ++: version
    }
}