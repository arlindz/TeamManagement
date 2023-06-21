const express = require("express");
const sql = require("mssql/msnodesqlv8");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const config = {
    database: 'TeamManagement',
    server: process.env.SERVERNAME,
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true
    }
};

const tokenKey = process.env.TOKEN_KEY;

const router = express.Router();

router.get("/:token", (req, res) => {

    const token = req.params.token;
    let isValid = false;
    jwt.verify(token, tokenKey, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: "Token is invalid" });
            return;
        }
        if (Date.now() / 1000 > decoded.exp) {
            res.status(401).json({ message: "Token is invalid" });
            return;
        }
        isValid = true;
    });
    if (!isValid) return;

    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        const QUERY = `SELECT * FROM TeamTypes`;

        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordset });
        });
    })
});
module.exports = router;