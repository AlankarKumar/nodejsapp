/**
 *
 *These are worker realted tasks
 *
 */

//Dependencies
const path = require("path");
const fs = require("fs");
const _data = require("./data");
const https = require("http");
const http = require("http");
const helpers = require("./helpers");
const url = require("url");

//Instantiate the worker object
const workers = {};

//Gather All Checks

workers.gatherAllChecks = () => {
  //Get all the checks that exist in the system
  _data.list("checks", (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        _data.read("checks", check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            //Pass the data to validator and tlet that function continue or log erros as needed
            workers.validateCheckData(originalCheckData);
          } else {
            console.log("Error reading one of the checks data");
          }
        });
      });
    } else {
      console.log("Could not find any checks to process");
    }
  });
};
//Sanity checking the check data
workers.validateCheckData = (originalCheckData) => {
  originalCheckData =
    typeof originalCheckData == "object" && originalCheckData !== null
      ? originalCheckData
      : {};
  originalCheckData.id =
    typeof originalCheckData.id === "string" &&
    originalCheckData.id.trim().length === 20
      ? originalCheckData.id
      : false;
  originalCheckData.userPhone =
    typeof originalCheckData.userPhone === "string" &&
    originalCheckData.userPhone.trim().length === 10
      ? originalCheckData.userPhone
      : false;
  originalCheckData.protocol =
    typeof originalCheckData.protocol === "string" &&
    ["http", "https"].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false;
  originalCheckData.url =
    typeof originalCheckData.url === "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url
      : false;
  originalCheckData.method =
    typeof originalCheckData.method === "string" &&
    ["get", "put", "post", "delete"].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false;
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes === "object" &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false;
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds === "number" &&
    originalCheckData.timeoutSeconds > 0 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false;

  //Set the keys that may not be set if the workers have never seen this check before.
  originalCheckData.state =
    typeof originalCheckData.state === "string" &&
    ["down", "up"].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : "down";

  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked === "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  //If all the checks passed , pass thee data along to the next step in the process
  console.log(
    originalCheckData.id,
    originalCheckData.userPhone,
    originalCheckData.protocol,
    originalCheckData.url,
    originalCheckData.method,
    originalCheckData.successCodes,
    originalCheckData.timeoutSeconds,
  );
  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    console.log(
      "Error : One of the checks is not properly formatted , Skipping it",
    );
  }
};

//Perform the check ,send the originalCheckData and the outcome of the check process to the next step in the process
workers.performCheck = (originalCheckData) => {
  //Prepare the initial check outcome
  const checkOutcome = {
    error: false,
    responseCode: false,
  };

  //Mark that the coutcome has not been sent yet
  let outcomeSent = false;

  //Pare the hostname and the path out of the originalCheckData
  const parsedUrl = url.parse(
    originalCheckData.protocol + "//:" + originalCheckData.url,
    true,
  );

  const hostName = parsedUrl.hostname;
  const path = parsedUrl.path; //Using path and not pathname as we want the queryString

  const requestDetails = {
    protocol: originalCheckData.protocol + ":",
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  //Instantiate the request object using either the http of https module
  const _moduleToUse = originalCheckData.protocol === "http" ? http : https;
  const req = _moduleToUse.request(requestDetails, (res) => {
    const status = res.statusCode;

    //Update the check outcome and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //bind to the error event so it doesn't get thrown
  req.on("error", (err) => {
    //Update the checkoutcome and pass the data along
    checkOutcome.error = { error: true, value: err };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("timeout", (err) => {
    checkOutcome.error = {
      error: true,
      value: "timeout",
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //End the request
  req.end();
};

//Process the check outcome and update the check data as needed , trigger an alert to the user if needed
//Special logic for accomodating a check that has never been tested before ('dont want to send an alert');

workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  //Decide if the check is upor down
  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down";

  //Decide if an alert is warranted
  const alertWarranted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false;

  //Update the check data
  const newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  //Save the updates
  _data.update("checks", newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (alertWarranted) {
        workers.alertUsertoStatusChange(newCheckData);
      } else {
        console.log("Check outcome has not changesd, no alert needed.");
      }
    } else {
      console.log("Error trying to save updates to one of checks");
    }
  });
};

//Alert the user as to a change in their check status;
workers.alertUsertoStatusChange = (newCheckData) => {
  const msg = `Alert : your check for ${newCheckData}`;
  console.log(msg);
};

//Timer to execute the worker-process once per minute
workers.loop = () => {
  workers.gatherAllChecks();
  setInterval(() => {}, 1000 * 60);
};

//Init script
//
workers.init = () => {
  //Execute all the checks immediately
  workers.gatherAllChecks();

  //Call the lop so the checks will execute later on
  workers.loop();
};

//Export the module
module.exports = workers;
