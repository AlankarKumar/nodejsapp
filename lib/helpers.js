/**
 *
 *This file is helper for variout tasks
 *
 *
 */
//Dependencies
const crypto = require("crypto");
const config = require("./../config");
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

module.exports = helpers;
