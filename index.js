const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");
const fs = require("fs");
const _data = require("./lib/data");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

//Instantiating the http server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// //@Testing
// _data.delete("", "newFile", (err) => console.log("This was the error", err));

//Start the httpServer
httpServer.listen(config.httpPort, () =>
  console.log(
    "Server is listetning on port ",
    config.httpPort,
    "in environment",
    config.envName,
  ),
);

const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
//Instantiating the https server
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

//Start the httpsServer
httpsServer.listen(config.httpsPort, () => {
  console.log("HTTPS server is listening ", config.httpsPort);
});

//All the server logic
const unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;
  const { query } = parsedUrl;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");
  const { method } = req;

  const { headers } = req;

  //Get the payload if any
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    //Construct the data object to send to the handler
    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: query,
      method: method.toLowerCase(),
      payload: helpers.parseJsonToObject(buffer),
      headers: headers,
    };

    //Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      //Use the status code called back by the handler or deafult to 200
      statusCode = typeof statusCode === "number" ? statusCode : 200;

      //Use the payload called back by the handler or default to empty object
      payload = typeof payload === "object" ? payload : {};

      //Convert thepayload to the string and
      const payloadString = JSON.stringify(payload);
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("Returning this response", statusCode, payloadString);
    });
  });
};

//Define a request router
const router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
};
