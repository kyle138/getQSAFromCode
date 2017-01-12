var awsOptions = require('./awsOptions.json');
var AWS = require('aws-sdk');
AWS.config.update(awsOptions);
var S3 = new AWS.S3();

var defaultExpires = 600; // Timeout (in seconds) that the signed URL is good for

function parseUrl(url, cb) {
  if(!url) {
    if(typeof cb === 'function' && cb("Error: 'url' is a required argument", null));
    return false;
  } else {
    getBucket(url, function(err, bucketData) {
      if(err) {
        handleError("getBucket", err);
      } else {
        var bucKey = {
          "Bucket": bucketData,
        };
        getKey(url, bucKey.Bucket, function(err, keyData) {
          if(err) {
            handleError("getKey", err);
          } else {
            bucKey.Key = keyData;
            if(typeof cb === 'function' && cb(null, bucKey));
            else return bucKey;
          }
        }); //getKey
      }
    }); //getBucket
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
    //Then get everything after the bucket and its following /
    string=string.split(/[?#]/)[0].split(bucket+"/")[1];
    if(typeof cb === 'function' && cb(null, string));
    else return string;
  }
}; // End getKey

function getCode(bucket, key, cb) {
  if(!bucket||!key) {
    console.log("getCode: Missing required arguments.");
    if(typeof cb === 'function' && cb("Error: 'bucket', 'key', and 'code' are required arguments", null));
    return false;
  } else {
    var code;
    var params = {
      Bucket: bucket,
      Key: key.replace(key.slice(key.lastIndexOf("/")),"/passcode.txt")
    };
    S3.getObject(params, function(err, data) {
      if(err) {
        handleError("getObject", err);
      } else {
        code = data.Body.toString('ascii').trim();
        if(typeof cb === 'function' && cb(null, code));
        else return code;
      }
    }); //getObject
  }
}; // End getCode

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
        if(typeof cb === 'function' && cb(null, url));
        else return url;
      }
    }); //getSignedUrl
  }
}; // End getQSA

function handleError(method, response) {
  if (response instanceof Error) {
    console.log(method+" Error: ", response.message);
  } else {
    console.log(method+" Error:");
    console.log(response.data);
    console.log(response.status);
    console.log(response.headers);
    console.log(response.config);
  }
//  callback("Invalid request", null);  // Implement in Lambda
}; // End handleError

//Just testing
//==================
var url = "https://s3.amazonaws.com/presentations.hartenergyconferences.com/DUG_Eagle_Ford/2016/test.png?chicken=egg&dog=cat";
var key = "DUG_Eagle_Ford/2016/test.png";
var defaultCode = "138"; // If the provided code is valid (implement later)


parseUrl(url, function(err, parseData) {
  if(err) {
    handleError("parseurl", err);
  } else {
    console.log("parseData: "+JSON.stringify(parseData,null,2));  //DEBUG
    getCode(parseData.Bucket, parseData.Key, function(err, codeData) {
      if(err) {
        handleError("getCode", err);
      } else {
        console.log("codeData: "+codeData); //DEBUG
        if(codeData == defaultCode) {   //REPLACE defaultCode WITH event.data.passcode
          getQSA(parseData.Key, defaultExpires, parseData.Bucket, function(err, qsaData) {
            if(err) {
              handleError("getQSA", err);
            } else {
              console.log("getQSA: "+qsaData);  //DEBUG
//              callback(url, null); // Implement in Lambda
            }
          }); //getQSA
        } // End if code matches
      }
    }); //getCode
  }
}); //parseUrl
