var snowflake = require("snowflake-sdk");

const connectionPool = snowflake.createPool(
  // connection options
  {
    account: "qigjzsg-bv93326",
    username: "rizwan19",
    password: "Stayaway@123",
    database: "MYDATABASE",
  },
  // pool options
  {
    max: 10, // specifies the maximum number of connections in the pool
    min: 0, // specifies the minimum number of connections in the pool
  }
);

connectionPool.use(async (clientConnection: any) => {
  console.log("DB Connection successful");
});

module.exports = connectionPool;
