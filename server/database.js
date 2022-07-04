const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//TODO:: handle errors in this module
const uri =
  "mongodb+srv://Mostafa:C0uZPvB1BPlluxKF@cluster0.0cpdl4r.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const database_name = "GoogleDocsClone";
let documents_name = "Documents";

const connect_db = async () => {
  await client.connect();
};

const get_all_documents = () => {
  let database = client.db(database_name);
  let documents = database.collection(documents_name);
  const projection = { _id: 1 };
  const cursor = documents.find().project(projection);
  return cursor.toArray();
};

const get_document = async (_id) => {
  try {
    let database = client.db(database_name);
    let documents = database.collection(documents_name);
    return await documents.findOne({ _id: ObjectId(_id) });
  } catch (error) {
    console.log(error);
    return null;
  }
};

const save_document = (_id, doc) => {
  let database = client.db(database_name);
  let documents = database.collection(documents_name);
    documents.updateOne(
    { _id: new ObjectId(_id) },
    { $set: { title: "Untitled Document", contents: doc.contents, version:doc.version } },
    { upsert: true }
)
};

const create_document = async (doc) => {
  let database = client.db(database_name);
  let documents = database.collection(documents_name);
  return documents.insertOne({ contents:doc.contents, version:contents.version });
};

module.exports = {
  connect_db,
  get_all_documents,
  get_document,
  save_document,
  create_document,
};
