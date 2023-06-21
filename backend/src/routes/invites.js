const express = require("express");
const sql = require("mssql/msnodesqlv8");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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

router.post("/:id", (req, res) => {

    if (req.body === undefined) {
        res.status(401).json({ message: "Body expected." });
        return;
    }
    const token = req.body.auth;
    let userId = null, isValid = false;
    const teamId = req.params.id;
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
        userId = decoded.userId;
    });
    if (!isValid) return;
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "An error happened on our side." });
            return;
        }
        const request = new sql.Request();
        const invitationCode = crypto.randomBytes(16).toString('hex');
        request.input('teamId', sql.BigInt, teamId);
        request.input('userId', sql.BigInt, userId);
        const QUERY = `BEGIN TRANSACTION;
                       DECLARE @count INT;
                       SELECT @count = COUNT(*) FROM Teams WHERE TeamId = @teamId AND UserId = @userId;
                       IF(@count > 0)
                        BEGIN
                         INSERT INTO TeamInvitations (TeamId, Expires, Invitation) VALUES(@teamId, ${(Date.now() * 6 * (60 * 60))},'${invitationCode}');
                        END
                       COMMIT;`;
        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "An error happened on our side." });
                return;
            }
            if (result.rowsAffected <= 0) {
                res.status(403).json({ message: "User unauthorized, access denied." });
                return;
            }
            console.log(result.rowsAffected);
            res.status(201).json({ message: "Successfully created resource.", response: invitationCode });
        });
    });
});

router.post("/", (req, res) => {
    if (req.body === undefined) {
        res.status(401).json({ message: "Body expected." });
        return;
    }
    const token = req.body.auth;
    let username = null, tokenValid = false;
    jwt.verify(token, tokenKey, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: "Token is invalid" });
            return;
        }
        if (Date.now() / 1000 > decoded.exp) {
            res.status(401).json({ message: "Token is invalid" });
            return;
        }
        tokenValid = true;
        username = decoded.username;
    });
    if (!tokenValid) return;
    const invitationCode = req.body.invitationCode;
    if (invitationCode === undefined) {
        res.status(401).json({ message: "Invitation code not provided." });
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "An error happened on our side." });
            return;
        }
        const request = new sql.Request();
        request.input('invitation', sql.VarChar, invitationCode);
        console.log("username:" + username);
        const QUERY = `EXEC JoinTeam '${username}', @invitation, ${Date.now()}`;

        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "An error occurred on our part." });
                return;
            }
            if (result.rowsAffected <= 0) {
                res.status(404).json({ message: "Could not join team, invalid invite, team is full or you're already in that team." });
                return;
            }
            res.status(201).json({ message: "Successfully added user to the team." });
        })
    });
})
module.exports = router