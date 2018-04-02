'use strict';

var AWS = require('aws-sdk');
var S3 = new AWS.S3();

var defaultExpires = 600; // Timeout (in seconds) that the signed URL is good for

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event,null,2)); //DEBUG
  if(!event.passcode||!event.hrefurl) {
    callback("Required field missing.", null);
  } else {

    // parse the provided URL, get the stored passcode, compare with provided code, getQSA for object, return signed URL
    parseUrl(event.hrefurl, function(err, parseData) {
      if(err) {
        handleError("parseurl", err);
      } else {
        getCode(parseData.Bucket, parseData.Key, function(err, codeData) {
          if(err) {
            handleError("getCode", err);
          } else {
            if(codeData == event.passcode) {
              getQSA(parseData.Bucket, parseData.Key, defaultExpires, function(err, qsaData) {
                if(err) {
                  handleError("getQSA", err);
                } else {
                  console.log('Signed URL: '+qsaData);  //DEBUG
                  callback(null, qsaData); // Return signed URL for href
                }
              }); //getQSA
            } else {
              callback("Incorrect Passcode",null);  // The submitted passcode does not match
            } // End if code matches
          }
        }); //getCode
      }
    }); //parseUrl

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
      callback("Invalid request", null); // Something went wrong, obviously
    } // End handleError

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
    } // End parseUrl

    function getBucket(string, cb) {
      if(!string) {
        if(typeof cb === 'function' && cb("Error: 'string' is a required argument", null));
        return false;
      } else {
        // Strip http://, https://, https://s3.amazonaws.com/, or **alternate S3 endpoints from beginning of url
        // ** Alternate S3 endpoints are listed at https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
        // Split remainder at first /, left side should be bucket name.
        string=string.replace(/(^https:\/\/s3\.amazonaws\.com\/)|((^https:\/\/s3)([\.-])([a-z0-9-\.]+)(\.amazonaws\.(com|com\.cn)\/))|(^https:\/\/)|(^http:\/\/)/, "").split("/")[0];
        if(typeof cb === 'function' && cb(null, string));
        else return string;
      }
    } // End getBucket

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
    } // End getKey

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
    } // End getCode

    function getQSA(bucket, key, expires, cb) {
      if(!bucket||!key) {
        if(typeof cb === 'function' && cb("Error: 'bucket' and 'key' are required arguments", null));
        return false;
      } else {
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
    } // END getQSA

  } // END if required fields
}; // END exports.handler
