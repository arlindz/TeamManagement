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
router.get('/postTypes/:id', (req, res) => {
    const token = req.headers['auth'];
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
        request.input('userId', sql.BigInt, req.params.id);
        const QUERY = `SELECT opt.PostType
                       FROM Posters p
                          JOIN OrientationPostTypes opt
                          ON opt.Orientation = p.PosterType
                       WHERE p.PosterId = @userId;`;
        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "An error happened on our side." });
                return;
            }
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordset });
        });
    });
})
router.get('/orientations', (req, res) => {
    const token = req.headers['auth'];
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
        request.input('teamId', sql.BigInt, teamId);
        request.input('userId', sql.BigInt, userId);
        const QUERY = `SELECT * FROM OrientationPostTypes;`;
        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "An error happened on our side." });
                return;
            }
            res.status(200).json({ message: "Successfully created resource.", response: result.recordset });
        });
    });
});
router.post('/showInterest/:id', (req, res) => {
    const token = req.headers['auth'];
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
        const challengerId = req.params.id;
        const interestedChallengerId = req.body.interestedChallengerId;
        request.input('challengerId', sql.BigInt, challengerId);
        request.input('interestedChallengerId', sql.BigInt, interestedChallengerId);
        const QUERY = `BEGIN TRANSACTION
                        BEGIN TRY
                          DECLARE @CanShowInterest BIT;
                          SET @CanShowInterest = 
                          CASE WHEN
                             ((SELECT Orientation FROM Teams WHERE TeamId = @challengerId) = (SELECT Orientation FROM Teams WHERE TeamId = @interestedChallengerId)) THEN 1 ELSE 0 END;
                           
                          IF(@CanShowInterest = 1)
                          BEGIN
                           INSERT INTO InterestedChallengers (ChallengerId, InterestedChallengerId) VALUES (@challengerId, @interestedChallengerId);
                          END
                        END TRY
                        BEGIN CATCH
                          THROW;
                          ROLLBACK;
                        END CATCH;
                       COMMIT`;
        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "An error happened on our side." });
                return;
            }
            if (result.rowsAffected <= 0) {
                res.status(409).json({ message: "You already showed interest in this challenge for that team." });
                return;
            }
            res.status(201).json({ message: "Successfully created resource." });
        });
    });
})
router.get("/:id", (req, res) => {
    const token = req.headers['auth'];
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
        request.input('teamId', sql.BigInt, teamId);
        request.input('userId', sql.BigInt, userId);
        const QUERY = `BEGIN TRANSACTION
                        BEGIN TRY
                         DECLARE @CanPost BIT;
                         SET @CanPost = CASE WHEN (SELECT COUNT(*) 
                                                   FROM Teams
                                                   WHERE TeamId = @teamId AND UserId = @userId) = 1 THEN 1 ELSE 0 END;
                         IF(@CanPost = 1)
                         BEGIN
                          SELECT cf.ChallengeFormat
                          FROM ChallengeFormats cf
                            JOIN ChallengeFormatsTeamTypes cftt
                            ON cftt.ChallengeFormat = cf.ChallengeFormat
                               JOIN TeamsTeamTypes ttt
                               ON ttt.TeamType = cftt.TeamType AND ttt.TeamId = @teamId;

                          SELECT cdt.ChallengeDurationType AS DurationType
                          FROM ChallengeDurationTypes cdt
                             JOIN ChallengeDurationTypeTeamTypes cdttt
                             ON cdttt.ChallengeDurationType = cdt.ChallengeDurationType
                                JOIN TeamsTeamTypes ttt
                                ON ttt.TeamType = cdttt.TeamType AND ttt.TeamId = @teamId;

                          SELECT ctl.ChallengeTimeLength AS TimeLength, cltdt.ChallengeDurationType AS DurationType
                          FROM ChallengeTimeLengths ctl
                             JOIN ChallengeTimeLengthsDurationTypes cltdt
                             ON cltdt.ChallengeTimeLength = ctl.ChallengeTimeLength
                                JOIN ChallengeDurationTypeTeamTypes cdttt
                                ON cdttt.ChallengeDurationType = cltdt.ChallengeDurationType
                                  JOIN TeamsTeamTypes ttt
                                  ON ttt.TeamType = cdttt.TeamType AND ttt.TeamId = @teamId;
                        END
                        END TRY
                        BEGIN CATCH
                          THROW;
                          ROLLBACK;
                        END CATCH;
                       COMMIT`;
        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "An error happened on our side." });
                return;
            }
            res.status(200).json({ message: "Successfully created resource.", response: result.recordsets });
        });
    });
});

module.exports = router