var AWS = require('aws-sdk');
const { json } = require('express');
const fs = require("fs")

AWS.config.update({ accessKeyId: 'AKIA37ESWNVTX3DMISI6',
 secretAccessKey: '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',
  region: 'us-east-1' });


s3 = new AWS.S3();
// Promise.promisifyAll(s3)


const get_file = async (file_name)=> {
  try{
    var getParams = {
      Bucket: 'distributed-text-editor', // your bucket name,
      Key: file_name // path to the object you're looking for
    }
    const data = await s3.getObject(getParams).promise();
    return JSON.parse(data.Body.toString('utf-8'))
  }catch(err){
    let temp =  {
      composed_delta: new Delta(),
      version: 0,
    };
    await upload_file(file_name, temp)
    return temp
  }
}

const upload_file = async (file_name, file)=>{
  var buff = Buffer.from(JSON.stringify(file));
  var params = {
    Bucket: 'distributed-text-editor',
    Key: file_name,
    Body: buff,
    ContentEncoding: 'base64',
    ContentType: 'application/json',
    ACL: 'public-read'
  };
  return s3.upload(params).promise()
}
module.exports = {get_file,upload_file}

