var AWS = require('aws-sdk');
const { json } = require('express');
const fs = require("fs")

AWS.config.update({ accessKeyId: 'AKIA37ESWNVTX3DMISI6',
 secretAccessKey: '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',
  region: 'us-east-1' });


s3 = new AWS.S3();
// Promise.promisifyAll(s3)


module.exports = {s3}

