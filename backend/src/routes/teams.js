const express = require("express");
const sql = require("mssql/msnodesqlv8");
const jwt = require("jsonwebtoken");

const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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
router.post("/get", (req, res) => {
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
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('UserId', sql.BigInt, userId)
        const QUERY = `BEGIN TRANSACTION
                        BEGIN TRY
                          SELECT t.TeamId, t.TeamName, t.Description, t.CurrentMembers, t.MaxMembers, t.LogoPath,
                          (SELECT COUNT(*) 
                           FROM Tasks
                           WHERE UserId = @userId AND TeamId = ut.TeamId) AS TaskCount
                          FROM UsersTeams ut
                             INNER JOIN Teams t
                             ON t.TeamId = ut.TeamId
                          WHERE ut.UserId = @UserId
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
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordset });
        });
    })
})
router.post("/", upload.single('image'), (req, res) => {
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
    })
    if (!tokenValid) return;
    if (req.body === undefined) {
        res.status(403).json({ message: "Expected body property in the request." });
        return;
    }
    console.log("CREATING A TEAM");
    const teamName = req.body.teamName;
    const maxMembers = req.body.maxMembers;
    const description = req.body.description;
    const types = req.body.teamTypes.split(",");
    if (types.length === 0) {
        res.status(401).json({ message: "The team must contain at least one team type." });
        return;
    }
    if (isNaN(Number(maxMembers)) || Math.floor(Number(maxMembers) != Number(maxMembers))) {
        res.status(403).json({ message: "Expected integer for max members." });
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('teamName', sql.VarChar, teamName);
        request.input('maxMembers', sql.VarChar, Number(maxMembers) <= 0 ? 30 : Number(maxMembers));
        request.input('description', sql.VarChar, description);
        request.input('imageUrl', sql.VarChar, `http://localhost:5000/images/${req.file.filename}`);
        request.input('userId', sql.BigInt, userId);
        request.input('type0', sql.VarChar, types[0]);
        let additQueryString = 'TeamType = @type0 OR ', insertString = ``, i = 1;
        while (i < types.length) {
            request.input('type' + i, sql.VarChar, types[i]);
            additQueryString += `TeamType = @type${i} OR `;
            insertString += `INSERT INTO TeamsTeamTypes(TeamType, TeamId) VALUES (@type${i}, @TeamId);`;
            i++;
        }
        additQueryString = additQueryString.substring(0, additQueryString.length - 3);
        const QUERY = `BEGIN TRANSACTION;
                        BEGIN TRY     
                         DECLARE @Orientation VARCHAR(7);
                         SELECT @Orientation = Orientation
                         FROM TeamTypes
                         WHERE TeamType = @type0;

                         DECLARE @CountTypes INT;
                        
                         SELECT @CountTypes = COUNT(*)
                         FROM TeamTypes 
                         WHERE (${additQueryString}) AND Orientation = @Orientation;
                         
                         IF(@CountTypes = ${types.length})
                          BEGIN
                           INSERT INTO Posters(PosterType) VALUES(@Orientation);

                           DECLARE @TeamId BIGINT;

                           SELECT @TeamId = MAX(PosterId)
                           FROM Posters;

                           INSERT INTO Teams (TeamId, TeamName, UserId, MaxMembers, Description, LogoPath, Orientation) VALUES 
                           (@TeamId, @teamName, @userId, @maxMembers, @description, @imageUrl, @Orientation);
                        
                           INSERT INTO UsersTeams(TeamId, UserId) VALUES(@TeamId, @userId);
                           INSERT INTO TeamsTeamTypes(TeamType, TeamId) VALUES(@type0, @TeamId);
                           ${insertString}
                          END
                        END TRY
                        BEGIN CATCH
                         THROW;
                         ROLLBACK;
                        END CATCH;
                       COMMIT;`;
        console.log(QUERY);
        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            res.status(201).json({ message: "Successfully added resource." });

        });
    })
});
router.delete("/leave/:id", (req, res) => {
    const token = req.headers['auth'];
    let tokenValid = false, userId = null;
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
    if (tokenValid === false) return;

    const leavingUserId = req.params.id;
    const teamId = req.body.teamId;
    console.log(teamId, leavingUserId);
    if (isNaN(Number(teamId)) || Math.floor(Number(teamId) != Number(teamId))) {
        res.status(403).json({ message: "Expected integer for id." });
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const QUERY = `BEGIN TRANSACTION
                        BEGIN TRY
                         DECLARE @CanKick BIT;

                         SET @CanKick = CASE WHEN ((SELECT COUNT(*) 
                                                   FROM Teams  
                                                   WHERE UserId = @userId) = 1 AND
                                                   (SELECT COUNT(*) 
                                                   FROM UsersTeams
                                                   WHERE UserId = @leavingUserId AND TeamId = @teamId) = 1 OR @leavingUserId = @userId) THEN 1 ELSE 0 END;
                         IF(@CanKick = 1)
                         BEGIN 
                           DELETE FROM UsersTeams
                           WHERE UserId = @leavingUserId AND TeamId = @teamId;

                           DECLARE @members INT;

                           SELECT @members = CurrentMembers
                           FROM Teams 
                           WHERE TeamId = @teamId;

                           IF(@members = 1)
                           BEGIN
                             DELETE FROM Teams WHERE TeamId = @teamId;
                           END
                           ELSE 
                           BEGIN 
                             UPDATE Teams
                             SET CurrentMembers = CurrentMembers - 1
                             WHERE TeamId = @teamId;
                           END
                         END
                         END TRY
                         BEGIN CATCH
                           THROW;
                           ROLLBACK;
                         END CATCH;
                       COMMIT`;

        const request = new sql.Request();
        request.input('userId', sql.BigInt, userId);
        request.input('leavingUserId', sql.BigInt, leavingUserId);
        request.input('teamId', sql.BigInt, teamId);
        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            if (result.rowsAffected <= 0) {
                res.status(403).json({ message: "User unauthorized, access denied." });
                return;
            }
            res.status(204).json({ message: "Successfully deleted resource." });
        });
    });
});
router.get("/", (req, res) => {
    const token = req.headers['auth'];
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
    if (!isValid) return;
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('UserId', sql.BigInt, userId);
        const QUERY = `SELECT TeamId, TeamName, Orientation
                       FROM Teams t
                       WHERE UserId = @UserId;`;

        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "Something went wrong on our side." });
                return;
            }
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordset });
        });

    });
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
    });
    if (!isValid) return;
    const teamId = req.params.id;
    if (isNaN(Number(teamId)) || Math.floor(Number(teamId)) !== Number(teamId)) {
        res.status(403).json({ message: "Expected integer for id." });
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('TeamId', sql.BigInt, teamId);
        request.input('UserId', sql.BigInt, userId);
        const QUERY = `BEGIN TRANSACTION;
                       DECLARE @UserExists INT;
                       SELECT @UserExists = COUNT(*) FROM UsersTeams WHERE TeamId = @TeamId AND UserId = @UserId;

                       IF(@UserExists > 0)
                       BEGIN
                         DECLARE @Count INT;
                         SELECT @Count = COUNT(*) FROM Teams WHERE TeamId = @TeamId AND UserId = @UserId;

                         SELECT * FROM Teams WHERE TeamId = @TeamId;
                         SELECT UserId, Username, @Count AS Count FROM Users WHERE UserId IN (SELECT UserId FROM UsersTeams WHERE TeamId = @TeamId);
                         SELECT opt.PostType
                         FROM OrientationPostTypes opt
                            JOIN Teams t
                            ON opt.Orientation = t.Orientation AND t.TeamId = @teamId;
                       END
                       COMMIT;`;

        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "Something went wrong on our side." });
                return;
            }
            if (result.recordsets.length === 0) {
                console.log("Not all select statements executed.");
                res.status(404).json({ message: "User is unauthorized, access denied." });
                return;
            }
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordsets });
        });

    });
});
router.delete("/delete/:id", (req, res) => {
    const token = req.headers['auth'];
    let userId = null, isValid = false;
    console.log("I AM HEER");
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
    const teamId = req.params.id;
    if (isNaN(Number(teamId)) || Math.floor(Number(teamId)) !== Number(teamId)) {
        res.status(403).json({ message: "Expected integer for id." });
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('TeamId', sql.BigInt, teamId);
        request.input('UserId', sql.BigInt, userId);
        const QUERY = `BEGIN TRANSACTION;
                        BEGIN TRY
                         DECLARE @CanDelete BIT;

                         SET @CanDelete = CASE WHEN (SELECT COUNT(*)
                                                     FROM Teams
                                                     WHERE UserId = @UserId AND TeamId = @TeamId) = 1 THEN 1 ELSE 0 END;
                         IF(@CanDelete = 1)
                         BEGIN 
                          DELETE FROM Teams WHERE TeamId = @TeamId;
                         END
                         END TRY
                         BEGIN CATCH
                          THROW;
                          ROLLBACK;
                         END CATCH;
                       COMMIT;`;

        request.query(QUERY, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "Something went wrong on our side." });
                return;
            }
            if (result.rowsAffected <= 0) {
                res.status(403).json({ message: "User is unauthorized, access denied." });
                return;
            }
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordsets });
        });

    });
});
module.exports = router;