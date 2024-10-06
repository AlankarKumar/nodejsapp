/**
 *Request handlers
 * */

//Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./../config");

//Define the handlers
const handlers = {};

//Sample Handler
handlers.ping = (data, callback) => {
  callback(200, { name: "Ping Handler" });
};

//notfoundHandler
handlers.notFound = (data, callback) => {
  callback(404);
};

//user handler
handlers.users = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};
//Container for user submethods
handlers._users = {};

//URequired data: firstName, LastName, phone, password, tosAgreement
handlers._users.post = (data, callback) => {
  //Check that all required fields are filled out
  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;

  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;

  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  const tosAgreement =
    typeof data.payload.tosAgreement === "boolean" &&
    data.payload.tosAgreement === true
      ? true
      : false;
  console.log(firstName, lastName, phone, password, tosAgreement);
  if (firstName && lastName && phone && password && tosAgreement) {
    //Make sure that the user doesn't exist already
    _data.read("users", phone, (err, data) => {
      if (err) {
        //Hash the password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          //create the user object
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement,
          };

          //Persist user to disk
          _data.create("users", phone, userObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create the new user" });
            }
          });
        }
      } else {
        //User already exists
        callback(400, {
          Error: "A user with that phone number already exists",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields" });
  }
};

handlers._users.get = (data, callback) => {
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length > 0
      ? data.queryStringObject.phone
      : false;
  if (phone) {
    //Get the token from header
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;
    //Verify the token
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read("users", phone, (err, data) => {
          if (!err && data) {
            //Remove the hashed password before returning.
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { Error: "Token is invalid" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

handlers._users.put = (data, callback) => {
  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;

  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;

  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data.read("users", phone, (err, userData) => {
        if (!err && userData) {
          //Update necessary fields
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }

          _data.update("users", phone, userData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update the file" });
            }
          });
        } else {
          callback(400, { Error: "The specified user does not exist." });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

handlers._users.delete = (data, callback) => {
  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;
  if (phone) {
    _data.read("users", phone, (err, userData) => {
      if (!err) {
        _data.delete("users", phone, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Unable to delete the user" });
          }
        });
      } else {
        callback(400, { Error: "Coud not find the specified user" });
      }
    });
  } else {
    callback("400", { Error: "Missing required field" });
  }
};

handlers.tokens = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};

//Verify if a given tokenId is valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};
//Required data is phone and password
//Optional data is none
handlers._tokens.post = (data, callback) => {
  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  if (phone && password) {
    //Look up the user who matches the phone number
    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        //Hash the sent password and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires,
          };

          _data.create("tokens", tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create the new token" });
            }
          });
        } else {
          callback(400, { Error: "The password did not match " });
        }
      } else {
        callback(400, { Error: "Unable to find user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields." });
  }
};
handlers._tokens.get = (data, callback) => {
  const id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id
      : false;
  if (id) {
    _data.read("tokens", id, (err, data) => {
      if (!err && data) {
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

//Required data : id, extend
handlers._tokens.put = (data, callback) => {
  const id =
    typeof data.payload.id === "string" && data.payload.id.trim().length === 20
      ? data.payload.id
      : false;
  const extend =
    typeof data.payload.extend === "boolean" && data.payload.extend === true
      ? true
      : false;

  if (id && extend) {
    _data.read("tokens", id, (err, tokenData) => {
      console.log(err, tokenData);
      if (!err && tokenData) {
        //Check to see if the token isn't already expired
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          _data.update("tokens", id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the token expiration.",
              });
            }
          });
        } else {
          callback(400, { Error: " The token has already expired" });
        }
      } else {
        callback(400, { Error: "Invalid Token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};
handlers._tokens.delete = (data, callback) => {
  const id =
    typeof data.payload.id === "string" && data.payload.id.trim().length === 20
      ? data.payload.id.trim()
      : false;
  if (id) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err) {
        _data.delete("tokens", id, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Unable to delete the user" });
          }
        });
      } else {
        callback(400, { Error: "Coud not find the specified user" });
      }
    });
  } else {
    callback("400", { Error: "Missing required field" });
  }
};

//Checks Handlers

handlers.checks = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks = {};

handlers._checks.post = (data, callback) => {
  const protocol =
    typeof data.payload.protocol === "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const method =
    typeof data.payload.method === "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const url =
    typeof data.payload.url === "string" && data.payload.url.trim().length > 0
      ? data.payload.url
      : false;

  const successCodes =
    typeof data.payload.successCodes === "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds === "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;
  if (protocol && url && method && successCodes && timeoutSeconds) {
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        _data.read("users", userPhone, (err, userData) => {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks === "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];
            //Create a random id for the check
            const checkId = helpers.createRandomString(20);
            //Verify the user has less than the number of maxchexks per user
            if (userChecks.length < config.maxChecks) {
              const checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds,
              };
              //Save the object
              _data.create("checks", checkId, checkObject, (err) => {
                if (!err) {
                  //Add the checkId to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  //Save the new user data
                  _data.update("users", userPhone, userData, (err) => {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "could not updat eh user with the new check",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Coulnt create eh new check" });
                }
              });
            } else {
              callback(400, {
                Error: `The user already has the maximum number of checks ${config.maxChecks}`,
              });
            }
          } else {
            callback(400, {
              Error: "Invalid token or the user does not exist",
            });
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs or inputs are invalid" });
  }
};

handler._checks.get = (data, callback) => {
  const id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id
      : false;
};

module.exports = handlers;
