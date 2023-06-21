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

router.post("/", (req, res) => {
    if (req.body === undefined) {
        res.status(401).json({ message: "Body expected." });
        return;
    }

    const token = req.body.auth;
    let userId = null, tokenValid = false;
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
        userId = decoded.userId;
    });
    if (!tokenValid) return;
    const teamId = req.body.teamId, taskForUserId = req.body.userId;
    const taskDescription = req.body.taskDescription;

    if (typeof taskDescription !== 'string' || isNaN(Number(teamId)) || taskDescription.length > 150) {
        res.status(401).json({ message: "Input is not valid." });
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }

        const request = new sql.Request();
        request.input('taskDescription', sql.VarChar, taskDescription);
        request.input('taskForUserId', sql.BigInt, taskForUserId);
        request.input('teamId', sql.BigInt, teamId);
        request.input('taskerId', sql.BigInt, userId);

        const QUERY = `BEGIN TRANSACTION;
                        BEGIN TRY
                         DECLARE @Count INT;
                         DECLARE @TeamName VARCHAR(30);

                         SELECT @Count = COUNT(*), @TeamName = TeamName 
                         FROM Teams 
                         WHERE TeamId = @teamId AND UserId = @taskerId
                         GROUP BY TeamName;

                         IF(@Count > 0)
                           BEGIN
                             INSERT INTO Tasks (Description, UserId, TeamId) VALUES (@taskDescription, @taskForUserId, @teamId);
                             INSERT INTO Notifications (Description, UserId, TeamId, Seen, ReceivedAt) VALUES ('You got assigned a new task for team '+@TeamName+'!'+@taskDescription, 
                             @taskForUserId, @teamId, 0, GETDATE());
                             DECLARE @TaskId BIGINT;

                             SELECT @TaskId = MAX(TaskId)
                             FROM Tasks

                             SELECT t.Status, t.TaskId, u.Username, t.Description
                             FROM Tasks t
                               JOIN Users u
                               ON u.UserId = t.UserId
                             WHERE TaskId = @TaskId
                           END
                        END TRY
                        BEGIN CATCH
                          THROW;
                          ROLLBACK;
                        END CATCH;
                       COMMIT;`;
        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            if (result.rowsAffected === 0) {
                res.status(403).json({ message: "User unauthorized, access denied." });
                return;
            }
            res.status(201).json({ message: "Successfully added resource.", response: result.recordset[0] });
            console.log("Added task.");
        });
    })
});
router.put("/:id/:token", (req, res) => {
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
    });
    if (!isValid) {
        console.log("invalid token for setting user task.");
        return;
    }
    const taskId = req.params.id;
    const statusToSet = req.body.status;
    if (statusToSet != 1 && statusToSet != 0) {
        res.status(401).json({ message: "Status to set is not valid." });
        return;
    }
    if (isNaN(Number(taskId))) {
        res.status(401).status({ message: "Task Id is not valid" });
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('taskId', sql.BigInt, taskId);
        request.input('userId', sql.BigInt, userId);
        request.input('status', sql.Bit, statusToSet);
        const QUERY = `BEGIN TRANSACTION
                         BEGIN TRY
                           DECLARE @Count INT;
                           
                           SELECT @Count = COUNT(*)
                           FROM Tasks 
                           WHERE TaskId = @taskId AND UserId = @userId AND Status <> @status
                           
                           IF(@Count = 1)
                            BEGIN
                              UPDATE Tasks
                              SET Status = @status
                              WHERE TaskId = @taskId AND UserId = @userId
                            END
                         END TRY
                         BEGIN CATCH
                           THROW;
                           ROLLBACK;
                         END CATCH;
                        COMMIT;`;
        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            console.log(result.rowsAffected);
            res.status(200).json({ message: "Successfully updated resource." });
        });
    })
})
router.get("/mytasks/:token", (req, res) => {

    const token = req.params.token;
    let userId = null, isValid = false;;
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
    if (!isValid) {
        console.log("invalid token for getting user tasks.");
        return;
    }

    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('userId', sql.BigInt, userId);
        const QUERY = `SELECT te.TeamId, te.TeamName, ta.Description, ta.TaskId, ta.Status
                       FROM Tasks ta
                         JOIN Teams te
                         ON te.TeamId = ta.TeamId
                       WHERE ta.UserId = @userId`;
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
router.delete("/:id/:token", (req, res) => {
    const token = req.params.token;
    let userId = null;
    jwt.verify(token, tokenKey, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: "Token is invalid." });
            return;
        }
        if (Date.now() / 1000 > decoded.exp) {
            res.status(401).json({ message: "Token is expired." });
            return;
        }
        userId = decoded.userId;
    })
    const taskId = req.params.id;
    if (isNaN(Number(taskId))) {
        res.status(401).json("Expected integer for team id.");
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            console.log(err);
            return;
        }
        const request = new sql.Request();
        request.input('taskId', sql.BigInt, taskId);
        request.input('userId', sql.BigInt, userId);
        const QUERY = `BEGIN TRANSACTION; 
                       DECLARE @Count INT; 
                       SELECT @Count = COUNT(*) 
                       FROM Tasks ta 
                           JOIN Teams te
                           ON te.TeamId = ta.TeamId
                       WHERE ta.TaskId = @taskId AND te.UserId = @userId;
                       
                       IF(@Count > 0)
                       BEGIN
                        DELETE FROM Tasks WHERE TaskId = @taskId;
                       END
                       COMMIT;`;

        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }

            res.status(204).json({ message: "Successfully deleted resource." });
        });
    })
});
router.get("/:id/:token", (req, res) => {
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
    if (isValid === false) return;
    const teamId = req.params.id;
    if (isNaN(Number(teamId))) {
        res.status(401).json("Expected integer for team id.");
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('teamId', sql.BigInt, teamId);
        request.input('userId', sql.BigInt, userId);
        const QUERY = `BEGIN TRANSACTION; 
                       DECLARE @Count INT; 
                       SELECT @Count = COUNT(*) FROM Teams WHERE TeamId = @teamId AND UserId = @userId;
 
                       IF(@Count > 0)
                       BEGIN
                         SELECT t.Status, t.TaskId, u.Username, t.Description 
                         FROM Tasks t
                           JOIN Users u
                           ON u.UserId = t.UserId
                         WHERE TeamId = @teamId;
                       END
                       ELSE 
                       BEGIN
                         SELECT TaskId, Description 
                         FROM Tasks 
                         WHERE TeamId = @teamId AND UserId = @userId;
                       END
                       COMMIT;`;

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