const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("sample.db");

db.all("SELECT * FROM user", (_, res) => {
  console.log(res);
});

db.serialize(() => {
  db.run(
    "CREATE TABLE pivot_user_packages(user INTEGER, package INTEGER, FOREIGN KEY(user) REFERENCES user(id), FOREIGN KEY(package) REFERENCES package(id))",
    console.log
  );
});

db.close();
