const app = require("express")();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("sample.db");
const randomToken = require("random-token");

app.use(bodyParser.json());
app.use(cookieParser());
// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

app.get("/_internal/users", (req, res) => {
  console.log(req.body);
  db.all("SELECT * FROM user", (err, r) => {
    console.log("", err, r);
    res.send(r);
  });
});

app.post("/signup", (req, res) => {
  console.log(req.body);
  const uuid = `u-${randomToken(5)}`;
  db.run(
    "INSERT INTO user (email, password, uuid) VALUES (?,?,?)",
    req.body.username,
    req.body.password,
    uuid,
    (err, r) => {
      if (!err) {
        console.log(err, r);
        res.sendStatus(201);

        return;
      }
      res.sendStatus(403);
    }
  );
});

app.post("/login", (req, res) => {
  db.get(
    "SELECT * FROM user WHERE email = ? LIMIT 1",
    req.body.username,
    (err, r) => {
      console.log(err, r);
      if (r && r.password === req.body.password) {
        const token = randomToken(16);
        db.run(
          "UPDATE user SET token = ? WHERE email = ?",
          token,
          req.body.username,
          (err, r) => {
            console.log(err, r);
            if (!err) {
              res
                .cookie("user", req.body.username, { maxAge: 10800 })
                .json({token: token})
            }
          }
        );
      } else {
        res.sendStatus(403);
      }
    }
  );
});

app.get("/packages", authenticate, (req, res) => {
  res.send([]);
});

function authenticate(req, res, next) {
  const headers = req.headers;
  const cookieUser = req.cookies.user;

  db.get("SELECT * FROM user WHERE email = ?", cookieUser, (err, r) => {
    console.log(err, r);
    if (err || !r) {
      res.sendStatus(401);
      return;
    }
    req._context = {
      user: r,
    };

    next();
  });
}
app.listen(8080, () => console.log("starting the server..."));
