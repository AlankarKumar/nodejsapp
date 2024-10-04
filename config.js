/**
 *
 * Create and export configuration variables
 */

const environments = {};

//Stagin (default) environments

environments.staging = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: "staging",
};

//Production environments
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
};

const currentEnvironment =
  typeof process.env.NODE_ENV === "string" ? process.env.NODE_ENV : "staging";

const environmentToExport =
  typeof environments[currentEnvironment] === "object"
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environmentToExport;
