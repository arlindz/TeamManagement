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

router.get("/count/:token", async (req, res) => {

    const token = req.params.token;
    let userId = null, tokenValid = false;
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
        userId = decoded.userId;
    })
    if (!tokenValid) return;

    sql.connect(config, async (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('UserId', sql.BigInt, userId)
        const QUERY = `SELECT COUNT(*) AS Count FROM Notifications WHERE UserId = @UserId AND Seen = 0;`;
        request.query(QUERY, async (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            console.log("Notifications fetched(count).");
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordset });
        });
    });
});
router.get("/:token", (req, res) => {
    const token = req.params.token;
    let userId = null, isValid = false;
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
    })
    if (!isValid) return;
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input("UserId", sql.BigInt, userId);
        const QUERY = `SELECT NotificationId, Description, Seen, ReceivedAt
                       FROM Notifications
                       WHERE UserId = @UserId
                       ORDER BY ReceivedAt DESC;`;

        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                return;
            }
            console.log("Notifications fetched(not count).")
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordset });
        });
    })
});
router.put("/:id/:token", (req, res) => {
    const token = req.params.token;
    let tokenValid = false;
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
    })
    if (!tokenValid) return;

    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const notificationId = req.params.id;
        const request = new sql.Request();
        request.input('notificationId', sql.Int, notificationId);
        const QUERY = `UPDATE Notifications SET Seen = 1 WHERE NotificationId = @notificationId;`;

        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                return;
            }
            console.log("Notifications updated(not count).")
            res.status(200).json({ message: "Successfully updated resource.", response: result.recordset });
        });
    })
});
module.exports = router;
