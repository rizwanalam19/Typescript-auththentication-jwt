import express from "express";
const port = 8000;
const app = express();
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const nodemailer = require("nodemailer");
const auth = require("../passport/auth");
const static_path = path.join(__dirname, "../public");
const templates_path = path.join(__dirname, "../template/views");
const partial_path = path.join(__dirname, "../template/partials");
const connectionPool = require("./db/conn");
const hbs = require("hbs");
const bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//     cookie: {
//       maxAge: 60000,
//     },
//   })
// );
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));
app.use(cookieParser());

app.set("view engine", "hbs");
app.set("views", templates_path);
hbs.registerPartials(partial_path);

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASS,
  },
});
// transporter.use("compile", hbs);

// let mailOptions = {
//   from: "rizborntorule@gmail.com",
//   to: "rizwanalamcoc@gmail.com",
//   subject: "Testing and testing",
//   html: "<div style='color:red;'>Hello world</div>",
// };

// transporter.sendMail(mailOptions, function(err: any, data: any) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Email send");
//   }
// });

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  interface regis {
    FIRSTNAME: string;
    LASTNAME: string;
    EMAIL: string;
    PASSWORD: string;
  }

  const register: regis = {
    FIRSTNAME: req.body.firstname,
    LASTNAME: req.body.lastname,
    EMAIL: req.body.email,
    PASSWORD: req.body.password,
  };

  const PASSWORD = await bcrypt.hash(register.PASSWORD, 10);
  const Token = jwt.sign({ id: PASSWORD.toString() }, "rizwanalam");
  // this.tokens = this.tokens.concat({ token: token });
  res.cookie("jwt", Token);

  console.log("token is" + Token);
  // const sql = `INSERT INTO MYDATABASE.MYDATABASE VALUES (${users.FIRSTNAME}, ${users.LASTNAME}, ${users.AGE}, ${users.MOBILE})`;
  // console.log(sql);
  // Insert data into database

  connectionPool.use(async (clientConnection: any) => {
    const statement = await clientConnection.execute({
      sqlText: `INSERT INTO MYDATABASE.PUBLIC.REGISTER (FIRSTNAME, LASTNAME, EMAIL, PASSWORD, TOKENS) VALUES ('${register.FIRSTNAME}', '${register.LASTNAME}', '${register.EMAIL}', '${PASSWORD}', '${Token}')`, // ${'<your-variable-name>'} for variable values
      complete: function(err: any, stmt: any) {
        if (err) {
          console.error(
            "Failed to execute statement due to the following error: " +
              err.message
          );
        } else {
          // console.log("Successfully executed statement: " + stmt.getSqlText());
          // const token = jwt.sign({ _id: "hnmnbmnbmnmnmn12350" }, "rizwanalam");
          // this.tokens = this.tokens.concat({ token: token });
          // console.log("token is" + token);
          console.log("Cookies: ", req.cookies);

          console.log("Successfully Added the Data");
        }
      },
    });
  });

  res.status(200).render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  interface pole {
    EMAIL: string;
    PASSWORD: string;
  }
  const Regis: pole = {
    EMAIL: req.body.email,
    PASSWORD: req.body.password,
  };
  // const token = req.cookies.jwt;
  // console.log("yeh token hai " + token);

  connectionPool.use(async (clientConnection: any) => {
    const statement = await clientConnection.execute({
      sqlText: `SELECT * FROM MYDATABASE.PUBLIC.REGISTER WHERE EMAIL = '${Regis.EMAIL}'`,

      // sqlText: `SELECT * FROM MYDATABASE.PUBLIC.REGISTER WHERE ID = '${login.EMAIL}'`,
      // const match = await bcrypt.compare(password, REGISTER.PASSWORD);
      complete: async function(err: any, rows: any, field: any) {
        try {
          // const regEmail = field[0].EMAIL;
          const hashedPassword = field[0].PASSWORD;
          console.log(Regis.PASSWORD);
          const match = await bcrypt.compare(Regis.PASSWORD, hashedPassword);
          if (match) {
            console.log("hashedPassword = " + hashedPassword);
            const Token = jwt.sign(
              { id: field[0].PASSWORD.toString() },
              "rizwanalam"
            );
            console.log(Token);
            res.cookie("jwt", Token);
            await clientConnection.execute({
              sqlText: `UPDATE MYDATABASE.PUBLIC.REGISTER SET TOKENS = '${Token}' WHERE EMAIL = '${Regis.EMAIL}'`,
            });

            await res.redirect("/");
          } else {
            res.send("Validation error");
            console.log("validation error");
          }
        } catch (error) {
          res.status(400).send("Invalid Email");
          console.log(error);
        }
      },
    });
  });
});
// });

app.get("/table", auth, (req, res) => {
  const token = req.cookies.jwt;
  connectionPool.use(async (clientConnection: any) => {
    const statement = await clientConnection.execute({
      sqlText: `SELECT * FROM MYDATABASE.PUBLIC.REGISTER`,
      complete: function(err: any, rows: any, fields: any) {
        if (err) {
          console.error(
            "Failed to execute statement due to the following error: " +
              err.message
          );
        } else {
          // if (token === undefined) {
          //   res.redirect("/login");
          // } else {
          res.render("table", {
            users: fields,
            title: "Rizwan",
          });
          // }
          // console.log(fields);
        }
      },
    });
  });
});

app.get("/udemy", (req, res) => {
  res.render("udemy");
});

app.get("/logout", auth, async (req, res) => {
  try {
    res.clearCookie("jwt");
    console.log("Logout Successfully");
    // await req.userSchema.save();

    res.render("login");
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/delete/:id", (req, res) => {
  connectionPool.use(async (clientConnection: any) => {
    const statement = await clientConnection.execute({
      sqlText: `DELETE FROM MYDATABASE.PUBLIC.REGISTER WHERE id = ${req.params.id}`,
      complete: function(err: any, rows: any, field: any) {
        if (err) {
          console.error(
            "Failed to execute statement due to the following error: " +
              err.message
          );
        } else {
          console.log(field);
          res.redirect("/table");
        }
      },
    });
  });
});

app.get("/edit/:id", auth, (req, res) => {
  connectionPool.use(async (clientConnection: any) => {
    const statement = await clientConnection.execute({
      sqlText: `SELECT * FROM MYDATABASE.PUBLIC.REGISTER WHERE ID = ${req.params.id}`,
      complete: function(err: any, rows: any, field: any) {
        if (err) {
          console.error(
            "Failed to execute statement due to the following error: " +
              err.message
          );
        } else {
          console.log(field);
          res.render("update", {
            users: field,
          });
        }
      },
    });
  });
});

app.post("/update/:id", auth, (req, res) => {
  connectionPool.use(async (clientConnection: any) => {
    const statement = await clientConnection.execute({
      sqlText: `UPDATE MYDATABASE.PUBLIC.REGISTER SET FIRSTNAME = '${req.body.firstname}', LASTNAME = '${req.body.lastname}', EMAIL = '${req.body.email}', PASSWORD = '${req.body.password}' WHERE ID = '${req.params.id}';`,
      complete: function(err: any, rows: any, field: any) {
        if (err) {
          console.error(
            "Failed to execute statement due to the following error: " +
              err.message
          );
        } else {
          console.log(field);
          res.redirect("/table");
        }
      },
    });
  });
});

app.get("/forgot", (req, res) => {
  res.render("forgot");
});
app.post("/forgot", (req, res) => {
  interface pole {
    EMAIL: string;
  }
  const Regis: pole = {
    EMAIL: req.body.email,
  };

  connectionPool.use(async (clientConnection: any) => {
    const statement = await clientConnection.execute({
      sqlText: `SELECT * FROM MYDATABASE.PUBLIC.REGISTER WHERE EMAIL = '${Regis.EMAIL}'`,

      // sqlText: `SELECT * FROM MYDATABASE.PUBLIC.REGISTER WHERE ID = '${login.EMAIL}'`,
      // const match = await bcrypt.compare(password, REGISTER.PASSWORD);
      complete: async function(err: any, rows: any, field: any) {
        try {
          // const regEmail = field[0].EMAIL;
          const hashedPassword = field[0].EMAIL;
          console.log(Regis.EMAIL);
          if (hashedPassword) {
            // console.log("hashedPassword = " + hashedPassword);
            const Token = jwt.sign(
              { EMAIL: field[0].EMAIL.toString() },
              "rizwanalam"
            );
            console.log(Token);
            let mailOptions = {
              from: "rizborntorule@gmail.com",
              to: "rizwanalamcoc@gmail.com",
              subject: "Testing and testing",
              html: `<a href='http://localhost:8000/newPassword/${Token}'>Click</a>`,
            };

            transporter.sendMail(mailOptions, function(err: any, data: any) {
              if (err) {
                console.log(err);
              } else {
                console.log("Email send");
              }
            });
            await res.redirect("/udemy");
          } else {
            res.send("Validation error");
            console.log("validation error");
          }
        } catch (error) {
          res.status(400).send("Invalid Email");
          console.log(error);
        }
      },
    });
  });
});

app.get("/newPassword/:token", (req, res) => {
  connectionPool.use(async (clientConnection: any) => {
    const token = req.params.token;
    jwt.verify(token, "rizwanalam", (err: any, email: any) => {
      if (err) {
        // Link Expired
        return res.sendStatus(403);
      }
      // Return Password Page
      res.render("newPassword", {
        users: email.EMAIL,
      });
      const YEH_EMAIL = email.EMAIL;
      console.log("yeh hai " + YEH_EMAIL);
    });
  });
});

app.post("/newPassword", (req, res) => {
  const EMAIL = req.body.email;
  connectionPool.use(async (clientConnection: any) => {
    const statement = await clientConnection.execute({
      sqlText: `SELECT * FROM MYDATABASE.PUBLIC.REGISTER WHERE ID = ${EMAIL}`,
      complete: async function(err: any, rows: any, field: any) {
        try {
          const pass = req.body.password;
          const conpass = req.body.Conpassword;
          if (pass === conpass) {
            const PASSWORD = await bcrypt.hash(req.body.Conpassword, 10);
            await clientConnection.execute({
              sqlText: `UPDATE MYDATABASE.PUBLIC.REGISTER SET PASSWORD = '${PASSWORD}' WHERE EMAIL = '${EMAIL}'`,
            });
            res.redirect("table");
          } else {
            console.log("Password does not with confirm password");
          }
        } catch (error) {}
      },
    });
  });
});

app.listen(port, () => console.log("app is running " + port));
