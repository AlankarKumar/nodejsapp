/**
 *Request handlers
 * */

//Dependencies
const _data = require("./data");
const helpers = require("./helpers");

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

handlers._tokens.post = (data, callback) => {};
handlers._tokens.get = (data, callback) => {};
handlers._tokens.put = (data, callback) => {};
handlers._tokens.delete = (data, callback) => {};

module.exports = handlers;
