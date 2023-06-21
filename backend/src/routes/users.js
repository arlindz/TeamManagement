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

router.get("/:id/:token", async (req, res) => {

    const token = req.params.token;
    let username = null, tokenValid = false;
    jwt.verify(token, tokenKey, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: "Token is invalid" });
            return;
        }
        if (Date.now() / 1000 > decoded.exp) {
            res.status(401).json({ message: "Token has expired" });
            return;
        }
        tokenValid = true;
        username = decoded.username;
    })
    if (!tokenValid) return;
    const userToGetDataFrom = req.params.id;
    sql.connect(config, async (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const QUERY = `EXEC GetUser @ProfileUsername = '${userToGetDataFrom}', @Username = '${username}'`;

        const request = new sql.Request();
        request.query(QUERY, async (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            if (result.recordsets[0].length === 0) {
                res.status(404).json({ message: "User could not be found." });
                return;
            }
            console.log("Fetched user successfully.");
            res.status(200).json({ message: "Successfully fetched resource.", response: [[{ ...result.recordsets[0][0], client: username }], result.recordsets[1], result.recordsets[2]] });
        });
    });
});

module.exports = router;

