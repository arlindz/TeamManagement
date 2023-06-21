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

router.post("/:id/:token", async (req, res) => {

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
    const toFollow = req.params.id;
    sql.connect(config, async (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();

        request.input('toFollow', sql.VarChar, toFollow);
        request.input('username', sql.VarChar, username);
        const QUERY = `BEGIN TRANSACTION;
                        BEGIN TRY
                          INSERT INTO Followers (Followee, Follower) VALUES (@toFollow, @username);
                          UPDATE Users SET Following = Following + 1 WHERE Username = @username;
                          UPDATE Users SET Followers = Followers + 1 WHERE Username = @toFollow;
                        END TRY
                        BEGIN CATCH
                          ROLLBACK;
                          THROW;
                        END CATCH;
                       COMMIT;`;

        request.query(QUERY, async (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            console.log("Followed user successfully.");
            res.status(201).json({ message: "Successfully added resource." });
        });
    });
});
router.delete("/:id/:token", (req, res) => {

    const token = req.params.token;
    let username = null;
    jwt.verify(token, tokenKey, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: "Token is invalid" });
            return;
        }
        if (Date.now() / 1000 > decoded.exp) {
            res.status(401).json({ message: "Token is invalid" });
            return;
        }
        username = decoded.username;
    })
    const toFollow = req.params.id;
    if (toFollow == username) {
        res.status(401).json({ message: "You cannot follow your own account." });
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();

        request.input('toFollow', sql.VarChar, toFollow);
        request.input('username', sql.VarChar, username);

        const QUERY = `BEGIN TRANSACTION;
                        BEGIN TRY
                         DECLARE @Count INT;

                         SELECT @Count = COUNT(*)
                         FROM Followers 
                         WHERE Followee = @toFollow AND Follower = @username;

                         SELECT *
                         FROM Followers 
                         WHERE Followee = @toFollow AND Follower = @username;
                         
                         IF(@Count = 1)
                         BEGIN
                          DELETE FROM Followers 
                          WHERE Followee = @toFollow AND Follower = @username;

                          UPDATE Users SET Following = Following - 1 WHERE Username = @username;
                          UPDATE Users SET Followers = Followers - 1 WHERE Username = @toFollow;

                         END
                        END TRY
                        BEGIN CATCH
                         ROLLBACK;
                         THROW;
                        END CATCH;
                       COMMIT;`;

        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            console.log(result.recordset);
            res.status(204).json({ message: "Successfully deleted resource." });
        });
    })
});
module.exports = router;

