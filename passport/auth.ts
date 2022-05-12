const jwt = require("jsonwebtoken");
// const userSchema = require("../models/register");

const auth = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies.jwt;
    // console.log(token);
    // res.header(token);
    // console.log("header token in header  " + header);
    // console.log("yeh lo" + verifyToken);
    if (token === undefined) {
      console.log("Access Denied");

      await res.status(401).redirect("login");
    } else {
      const verifyToken = await jwt.verify(token, "rizwanalam");

      console.log(verifyToken);
      // const token_header = req.header.jwt;
      // console.log("header token in header authentication " + token_header);
      res.status(200);
      next();
    }
  } catch (error) {
    res.status(401).send(error);
  }
};

module.exports = auth;
