/**
 *
 *This file is helper for variout tasks
 *
 *
 */
//Dependencies
const crypto = require("crypto");
const config = require("./../config");
const querystring = require("querystring");
const https = require("https");
const helpers = {};

//Create a SHA256 helpers
helpers.hash = (str) => {
  if (typeof str === "string" && str.trim().length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

//Parse a JSON string to an object in all cases , without thworing
helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

//Create a string of random alphanumeric characters of a given length
helpers.createRandomString = (strLength) => {
  strLength =
    typeof strLength === "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

    let str = "";

    for (let i = 1; i <= strLength; i++) {
      let randomCharacter = possibleCharacters.charAt(
        Math.random() * possibleCharacters.length,
      );
      str += randomCharacter;
    }

    return str;
  }
};
helpers.sendTwillioSms = (phone, msg, callback) => {
  //Validate parameters
  phone =
    typeof phone === "string" && phone.trim().length === 10 ? phone : false;
  msg =
    typeof msg === "string" &&
    msg.trim().length > 0 &&
    msg.trim().length <= 1600
      ? msg
      : false;

  if (phone && msg) {
    //Configure the requrest payload
    const payload = {
      From: config.twilio.fromPhone,
      To: `+1${phone}`,
      Body: msg,
    };

    //Stringify the payload
    const stringPayload = querystring.stringify(payload);
    const requestDetails = {
      protocol: "https",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };

    const req = https.request(requestDetails, (res) => {
      //Grab the status of the sent request
      const status = res.statusCode;
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback("Status code return eas" + status);
      }
    });

    //Bind to the error evenet so it doesn't get thrown by
    //
    req.on("error", (e) => {
      callback(e);
    });

    //Add the payload to the request.
    //
    req.write(stringPayload);

    req.end();
  } else {
    callback("Given Paramaters were missing or invalid");
  }
};
module.exports = helpers;
