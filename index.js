var awsOptions = require('../awsOptions.json');
var AWS = require('aws-sdk');
AWS.config.update(awsOptions);
var S3 = new AWS.S3();

var defaultBucket = 'presentations.hartenergyconferences.com'; //The name of the bucket
var defaultExpires = 600; // Timeout (in seconds) that QSA URL is good for

var qsaParams = {
  "key": "",
  "expires": defaultExpires,
  "bucket": defaultBucket
};


function getQSA(key, expires, bucket, cb) {
  if(!key) {
    if(typeof cb === 'function' && cb("Error: 'key' is a required argument", null));
    return false;
  } else {
    bucket = bucket ? bucket : defaultBucket;
    expires = expires ? expires : defaultExpires;
    var params = {
      Bucket: bucket,
      Key: key,
      Expires: expires
    };
    S3.getSignedUrl('getObject', params, function (err, url) {
      if (err) {
        console.log("getSignedUrl Error: ", err, err.stack);
      } else {
        console.log("Signed URL: ", url);
        return {"key": key, "url": url };
      }
    });
  }
}; // End getQSA

function parseUrl(url, cb) {
  if(!url) {
    if(typeof cb === 'function' && cb("Error: 'url' is a required argument", null));
    return false;
  } else {
    getBucket(url, function(err, data) {
      if(err) {
        handleError(err);
      } else {
        qsaParams.bucket = data;
        console.log("qsaParams.bucket: "+data); //DEBUG
        getKey(url, qsaParams.bucket); // NEED TO IMPLEMENT CALLBACK
      }
    });
  }
}; // End parseUrl

function getBucket(string, cb) {
  if(!string) {
    if(typeof cb === 'function' && cb("Error: 'string' is a required argument", null));
    return false;
  } else {
    // Strip http://, https://, and https://s3.amazonaws.com/ from beginning of url
    // Split remainder at first /, left side should be bucket name.
    string=string.replace(/(^https:\/\/s3.amazonaws.com\/)|(^https:\/\/)|(^http:\/\/)/, "").split("/")[0];
    if(typeof cb === 'function' && cb(null, string));
    else return string;
  }
}; // End getBucket

function getKey(string, bucket, cb) {
  if(!string||!bucket) {
    if(typeof cb === 'function' && cb("Error: 'string' and 'bucket' are required arguments", null));
    return false;
  } else {
    //Strip any query strings that may be appended
    //Then get everything after the bucket string
    string=string.split(/[?#]/)[0].split(bucket)[1];
    console.log("getKey: "+string); //DEBUG
    if(typeof cb === 'function' && cb(null, string));
    else return string;
  }
};

function handleError(response) {
  if (response instanceof Error) {
    console.log("Error: ", response.message);
  } else {
    console.log(response.data);
    console.log(response.status);
    console.log(response.headers);
    console.log(response.config);
  }
  callback("Invalid request", null);
}; // End handleError

//Just testing
//==================
var url = "https://s3.amazonaws.com/presentations.hartenergyconferences.com/DUG_Eagle_Ford/2016/test.png?chicken=egg&dog=cat";
var key = "DUG_Eagle_Ford/2016/test.png";
var defaultCode = "138"; // If the provided code is valid (implement later)

getQSA(key, 60);

parseUrl(url);
/*
getBucket(url, function(err,data) {
  if(err) console.log("getBucket Error: ",err);
  else console.log("getBucket: "+data);
});
*/
