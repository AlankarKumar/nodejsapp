const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;
  const { query } = parsedUrl;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");
  const { method } = req;
  res.end("Hello world\n");

  console.log(
    "Request recieved on this path",
    trimmedPath,
    "with this method",
    method,
    "with these query string parameters",
    query,
  );
});

server.listen(4000, () => console.log("Server is listetning on port 4000"));
