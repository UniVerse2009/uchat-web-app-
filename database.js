const mysql = require("mysql2");
const util = require("util");

const connection = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "UChat"
});

const query = util.promisify(connection.query).bind(connection);

module.exports = {query:query};
