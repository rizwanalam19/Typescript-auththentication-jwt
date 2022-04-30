const jwt = require("jsonwebtoken");
// const userSchema = require("../models/register");

const auth = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies.jwt;
    // const token_header = req.headers.jwt;
    console.log("hm auth me hai " + token);
    res.header("x-auth-header", token);
    // console.log("yeh lo" + verifyToken);
    if (token === undefined) {
      console.log("Access Denied");

      await res.status(401).redirect("login");
    } else {
      const verifyToken = jwt.verify(token, "rizwanalam");

      console.log(verifyToken);
      next();
    }
  } catch (error) {
    res.status(401).send(error);
  }
};

module.exports = auth;
