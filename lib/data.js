/**
 * Library for storing and editing data
 */

//Dependencies
const fs = require("fs");
const path = require("path");

//Container for the module ( to be exported )
const lib = {};

//Base directory of the data folder
lib.baseDir = path.join(__dirname, "/../.data/");

lib.create = (dir, file, data, callback) => {
  //Open the file for writing
  fs.mkdir(lib.baseDir + dir, { recursive: false }, (err) => {
    if (!err) {
      fs.open(
        lib.baseDir + dir + "/" + file + ".json",
        "wx+",
        (err, fileDescriptor) => {
          if (!err && fileDescriptor) {
            //Convert data to String
            const stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("Error closing the new file");
                  }
                });
              } else {
                callback("Error writing to new file");
              }
            });
          } else {
            callback("Could not create new file, it may alreay exist." + err);
          }
        },
      );
    } else {
      callback("Directory already exists");
    }
  });
};

//Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", (err, data) => {
    callback(err, data);
  });
};

lib.update = (dir, file, data, callback) => {
  //Open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);

        //Truncate file
        fs.truncate(fileDescriptor, (err) => {
          if (!err) {
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("Error closing the file.");
                  }
                });
              } else {
                callback("error wrtiting to existing file");
              }
            });
          } else {
            callback("Error truncating file");
          }
        });
      } else {
        callback(err);
      }
    },
  );
};

lib.delete = (dir, file, callback) => {
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};

//Export the module
module.exports = lib;
