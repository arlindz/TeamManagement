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
router.put('/:id', (req, res) => {
    const token = req.headers['auth'];
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
    const posterId = req.params.id, content = req.body.content, public = req.body.public === true ? 1 : 0;
    const challengeFormat = req.body.format, challengeDurationType = req.body.durationType, challengeLength = req.body.durationLength;
    const postType = req.body.postType, postId = req.body.postId;
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        console.log(req.body)
        console.log(req.params.id);
        const request = new sql.Request();
        request.input('posterId', sql.BigInt, posterId);
        request.input('content', sql.VarChar, content);
        request.input('isPublic', sql.Bit, public);
        request.input('userId', sql.BigInt, userId);
        request.input('postId', sql.BigInt, postId);
        request.input('postType', sql.VarChar, postType + "s");
        request.input('format', sql.VarChar, challengeFormat === undefined ? 'A' : challengeFormat);
        request.input('durationType', sql.VarChar, challengeDurationType === undefined ? 'A' : challengeDurationType)
        request.input('durationLength', sql.VarChar, challengeLength === undefined ? 'A' : challengeLength);
        let QUERY = `BEGIN TRANSACTION
                        BEGIN TRY
                          DECLARE @CanUpdate BIT;
                          SET @CanUpdate = CASE WHEN (SELECT COUNT(*) 
                                                      FROM Posts
                                                      WHERE PostId = @postId AND PosterId = @posterId) = 1 THEN 1 ELSE 0 END;
                          IF(@CanUpdate = 1)
                          BEGIN
                            DECLARE @IsChallenge BIT = CASE WHEN @postType = 'Posts' THEN 0 ELSE 1 END;
                            DECLARE @IsValidInformation BIT;
                            SET @IsValidInformation = 
                            CASE WHEN 
                              (
                                (
                                  SELECT COUNT(*)
                                  FROM Posters p
                                  JOIN OrientationPostTypes opt ON opt.PostType = @postType AND opt.Orientation = p.PosterType
                                  WHERE PosterId = @posterId
                                ) = 1
                                AND
                                (
                                  SELECT COUNT(*)
                                  FROM Teams t
                                  JOIN TeamsTeamTypes ttt ON ttt.TeamId = t.TeamId
                                  JOIN ChallengeFormatsTeamTypes cftt ON cftt.TeamType = ttt.TeamType AND cftt.ChallengeFormat = @format
                                  WHERE t.TeamId = @posterId
                                ) = 1
                                AND
                                (
                                  SELECT COUNT(*)
                                  FROM Teams t
                                  JOIN TeamsTeamTypes ttt ON ttt.TeamId = t.TeamId
                                  JOIN ChallengeDurationTypeTeamTypes cdttt ON cdttt.TeamType = ttt.TeamType AND cdttt.ChallengeDurationType = @durationType
                                  WHERE t.TeamId = @posterId
                                ) = 1
                                AND
                                (
                                  (
                                    SELECT COUNT(*)
                                    FROM ChallengeTimeLengthsDurationTypes ctldt
                                    WHERE ctldt.ChallengeDurationType = @durationType AND ctldt.ChallengeTimeLength = @durationLength
                                  ) = 1
                                  OR
                                  (
                                  (
                                    SELECT COUNT(*)
                                    FROM ChallengeTimeLengthsDurationTypes ctldt
                                    WHERE ctldt.ChallengeDurationType = 'First to score' AND ctldt.ChallengeTimeLength = @durationLength
                                  ) = 1
                                  AND (ISNUMERIC(@durationLength) = 1 AND FLOOR(CAST(@durationLength AS FLOAT)) = CAST(@durationLength AS FLOAT))
                                )
                                )
                              )
                              THEN 1
                              ELSE 0
                              END;
                             IF(@IsValidInformation = 1)
                             BEGIN
                               UPDATE Posts 
                               SET Content = @content, IsPublic = @isPublic, PostType = @postType
                               WHERE PostId = @postId;

                               DECLARE @ChallengeExists BIT;
                               SET @ChallengeExists = CASE WHEN (SELECT COUNT(*) 
                                                                 FROM Challenges
                                                                 WHERE ChallengeId = @postId) = 1 THEN 1 ELSE 0 END;
                               IF(@ChallengeExists = 1)
                               BEGIN
                                 UPDATE Challenges
                                 SET ChallengeFormat = @format, DurationType = @durationType, DurationLength = @durationLength
                                 WHERE ChallengeId = @postId;
                               END
                               ELSE 
                                 BEGIN
                                   INSERT INTO Challenges(ChallengeId, ChallengeFormat, DurationType, DurationLength) VALUES(@postId, @format, @durationType, @durationLength); 
                                 END
                             END
                            END
                            ELSE
                            BEGIN
                               UPDATE Posts 
                               SET Content = @content, IsPublic = @isPublic, PostType = @postType
                               WHERE PostId = @postId;
                               DELETE FROM Challenges WHERE ChallengeId = @postId;
                            END
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
            if (result.rowsAffected <= 0) {
                res.status(401).json({ message: "Invalid information given." });
                return;
            }
            res.status(200).json({ message: "Successfully updated resource." });
        });
    });
});
router.post('/:id', (req, res) => {
    const token = req.headers['auth'];
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
    const posterId = req.params.id, content = req.body.content, public = req.body.public === true ? 1 : 0;
    const challengeFormat = req.body.format, challengeDurationType = req.body.durationType, challengeLength = req.body.durationLength;
    const postType = req.body.postType;
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        request.input('posterId', sql.BigInt, posterId);
        request.input('content', sql.VarChar, content);
        request.input('isPublic', sql.Bit, public);
        request.input('userId', sql.BigInt, userId);
        request.input('postType', sql.VarChar, postType + "s");
        request.input('format', sql.VarChar, challengeFormat === undefined ? 'A' : challengeFormat);
        request.input('durationType', sql.VarChar, challengeDurationType === undefined ? 'A' : challengeDurationType)
        request.input('durationLength', sql.VarChar, challengeLength === undefined ? 'A' : challengeLength);
        let QUERY = `BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @CanPost BIT;
    SET @CanPost = CASE WHEN ((SELECT COUNT(*) 
                            FROM Teams 
                            WHERE TeamId = @posterId AND userId = @userId) = 1 OR (@posterId = @userId)) THEN 1 ELSE 0 END;

    IF (@CanPost = 1)
    BEGIN
        DECLARE @IsChallenge BIT = CASE WHEN @postType = 'Posts' THEN 0 ELSE 1 END;

        IF (@IsChallenge = 1)
        BEGIN
            DECLARE @IsValidInformation BIT;

            SET @IsValidInformation = 
                CASE WHEN 
                    (
                        (
                            SELECT COUNT(*)
                            FROM Posters p
                              JOIN OrientationPostTypes opt
                              ON opt.PostType = @postType AND opt.Orientation = p.PosterType
                            WHERE PosterId = @posterId
                        ) = 1
                        AND
                        (
                            SELECT COUNT(*)
                            FROM Teams t
                            JOIN TeamsTeamTypes ttt ON ttt.TeamId = t.TeamId
                            JOIN ChallengeFormatsTeamTypes cftt ON cftt.TeamType = ttt.TeamType AND cftt.ChallengeFormat = @format
                            WHERE t.TeamId = @posterId
                        ) = 1
                        AND
                        (
                            SELECT COUNT(*)
                            FROM Teams t
                            JOIN TeamsTeamTypes ttt ON ttt.TeamId = t.TeamId
                            JOIN ChallengeDurationTypeTeamTypes cdttt ON cdttt.TeamType = ttt.TeamType AND cdttt.ChallengeDurationType = @durationType
                            WHERE t.TeamId = @posterId
                        ) = 1
                        AND
                        (
                            (
                                SELECT COUNT(*)
                                FROM ChallengeTimeLengthsDurationTypes ctldt
                                WHERE ctldt.ChallengeDurationType = @durationType AND ctldt.ChallengeTimeLength = @durationLength
                            ) = 1
                            OR
                            (
                                (
                                    SELECT COUNT(*)
                                    FROM ChallengeDurationTypes cdt
                                      LEFT JOIN ChallengeTimeLengthsDurationTypes ctldt
                                      ON ctldt.ChallengeDurationType = cdt.ChallengeDurationType
                                    WHERE ctldt.ChallengeTimeLength IS NULL AND cdt.ChallengeDurationType = @durationType
                                ) = 1
                                AND (ISNUMERIC(@durationLength) = 1 AND FLOOR(CAST(@durationLength AS FLOAT)) = CAST(@durationLength AS FLOAT))
                            )
                        )
                    )
                THEN 1
                ELSE 0
                END;

            IF (@IsValidInformation = 1)
            BEGIN
                INSERT INTO Posts(PosterId, Content, PostedAt, IsPublic, PostType)
                VALUES (@posterId, @content, GETDATE(), @isPublic, @postType);

                DECLARE @PostId BIGINT = (SELECT MAX(PostId) FROM Posts);

                INSERT INTO Challenges(ChallengeId, ChallengeFormat, DurationType, DurationLength)
                VALUES (@PostId, @format, @durationType, @durationLength); 

                SELECT p.*, c.*, u.Username, t.TeamName, 1 AS CanModify, 0 AS Likes, 0 AS Dislikes, NULL AS LikingStatus, 0 AS Comments
                FROM Posts p
                LEFT JOIN Challenges c ON c.ChallengeId = p.PostId
                LEFT JOIN Users u ON p.PosterId = u.UserId
                LEFT JOIN Teams t ON p.PosterId = t.TeamId
                WHERE PostId = @PostId;
            END
        END
        ELSE
        BEGIN
            INSERT INTO Posts(PosterId, Content, PostedAt, IsPublic, PostType)
            VALUES (@posterId, @content, GETDATE(), @isPublic, @postType);

            DECLARE @PostId2 BIGINT = (SELECT MAX(PostId) FROM Posts);
            SELECT p.*, c.*, u.Username, t.TeamName, 1 AS CanModify, 0 AS Likes, 0 AS Comments, 0 AS Dislikes, NULL AS LikingStatus
            FROM Posts p
            LEFT JOIN Challenges c ON c.ChallengeId = p.PostId
            LEFT JOIN Users u ON p.PosterId = u.UserId
            LEFT JOIN Teams t ON p.PosterId = t.TeamId
            WHERE PostId = @PostId2;
        END
    END
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
            if (result.rowsAffected <= 0) {
                res.status(401).json({ message: "Invalid information given." });
                return;
            }
            res.status(201).json({ message: "Successfully added resource.", response: result.recordset });
        });
    });
});
router.delete('/:id', (req, res) => {
    const token = req.headers['auth'];
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
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();
        const postId = req.params.id;
        const posterId = req.body.posterId
        request.input('posterId', sql.BigInt, posterId);
        request.input('postId', sql.BigInt, postId);
        request.input('userId', sql.BigInt, userId);

        let QUERY = `BEGIN TRANSACTION
                        BEGIN TRY
                          DECLARE @CanDelete BIT;
                          SET @CanDelete = CASE WHEN ((SELECT COUNT(*) 
                                                    FROM Teams 
                                                    WHERE TeamId = @posterId AND userId = @userId) = 1 OR (@posterId = @userId)) THEN 1 ELSE 0 END;
                          IF(@CanDelete = 1)
                          BEGIN
                             DELETE FROM Posts WHERE PostId = @postId;
                          END
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
            if (result.rowsAffected <= 0) {
                res.status(401).json({ message: "You are not authorized to delete this resource." });
                return;
            }
            res.status(204).json({ message: "Successfully added resource." });
        });
    });
});
router.get("/", async (req, res) => {
    const token = req.headers['auth'];
    const page = req.headers['page'], rows = req.headers['rows'];
    const q = req.headers['search'], by = req.headers['by'], postType = req.headers['posttype'];
    console.log(req.headers)
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
        request.input('userId', sql.BigInt, userId);
        request.input('rows', sql.Int, rows);
        request.input('offset', sql.Int, (page - 1) * rows);
        request.input('search', sql.VarChar, q);
        request.input('by', sql.VarChar, by);
        request.input('postType', sql.VarChar, postType);
        request.input('searchString', sql.VarChar, `%${q}%`);
        const QUERY = `DECLARE @posterType VARCHAR(10);
                       SET @posterType = CASE WHEN @by = 'All' THEN '%%' ELSE @by END;
                       DECLARE @type VARCHAR(30);
                       SET @type = CASE WHEN @postType = 'All' THEN '%%' ELSE @postType END;

                       SELECT p.*, c.*, u.Username, t.TeamName,
                        CASE WHEN (p.PosterId = @userId OR EXISTS(SELECT TeamId FROM Teams WHERE TeamId = p.PosterId AND UserId = @userId)) THEN 1 ELSE 0 END AS CanModify,
                        (SELECT COUNT(*) FROM Likes WHERE PostId = p.PostId AND State = 1) AS Likes,
                          (SELECT COUNT(*) FROM Likes WHERE PostId = p.PostId AND State = 0) AS Dislikes,
                          (SELECT State FROM Likes l WHERE PostId = p.PostId AND UserId = @userId) AS LikingStatus,
                          (SELECT COUNT(*) FROM Comments WHERE PostId = p.PostId) AS Comments
                       FROM Posts p
                          LEFT JOIN Challenges c 
                          ON c.ChallengeId = p.PostId
                            JOIN Posters po 
                            ON po.PosterId = p.PosterId AND po.PosterType LIKE @posterType
                               LEFT JOIN Teams t
                               ON t.TeamId = p.PosterId
                                 LEFT JOIN Users u
                                 ON u.UserId = p.PosterId
                       WHERE PostType LIKE @type AND 
                       (IsPublic = 1 OR (p.PosterId = @userId OR EXISTS(SELECT TeamId FROM UsersTeams WHERE TeamId = p.PosterId AND UserId = @userId))) AND
                       (p.Content LIKE @searchString OR u.Username LIKE @searchString OR t.TeamName LIKE @searchString)
                       ORDER BY p.PostedAt DESC
                       OFFSET @offset ROWS
                       FETCH NEXT @rows ROWS ONLY;`;

        request.query(QUERY, async (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }
            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordset });
        });
    });
});
router.get("/:id", async (req, res) => {
    const token = req.headers['auth'];
    const page = req.headers['page'], rows = req.headers['rows'];
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
        const posterId = req.params.id;
        request.input('userId', sql.BigInt, userId);
        request.input('posterId', sql.BigInt, posterId);
        request.input('rows', sql.Int, rows);
        request.input('offset', sql.Int, (page - 1) * rows);
        const QUERY = `BEGIN TRANSACTION
                        BEGIN TRY
                         DECLARE @CanSeePrivate BIT;
                         SET @CanSeePrivate = CASE WHEN 
                                               ((@posterId = @userId) OR 
                                               (SELECT COUNT(*) FROM UsersTeams WHERE TeamId = @posterId AND UserId = @userId) = 1)
                                              THEN 1 ELSE 0 END;
                         SELECT p.*, c.*, u.Username, t.TeamName,
                          CASE WHEN (p.PosterId = @userId OR EXISTS(SELECT TeamId FROM Teams WHERE TeamId = @posterId AND UserId = @userId)) THEN 1 ELSE 0 END AS CanModify,
                          (SELECT COUNT(*) FROM Likes WHERE PostId = p.PostId AND State = 1) AS Likes,
                          (SELECT COUNT(*) FROM Likes WHERE PostId = p.PostId AND State = 0) AS Dislikes,
                          (SELECT State FROM Likes l WHERE PostId = p.PostId AND UserId = @userId) AS LikingStatus,
                          (SELECT COUNT(*) FROM Comments WHERE PostId = p.PostId) AS Comments
                         FROM Posts p
                           LEFT JOIN Challenges c
                           ON c.ChallengeId = p.PostId
                             LEFT JOIN Users u
                             ON p.PosterId = u.UserId
                               LEFT JOIN Teams t
                               ON p.PosterId = t.TeamId
                         WHERE (p.isPublic = 1 OR p.isPublic <> @CanSeePrivate) AND p.PosterId = @posterId
                         ORDER BY p.PostedAt DESC
                         OFFSET @offset ROWS
                         FETCH NEXT @rows ROWS ONLY;

                         END TRY
                         BEGIN CATCH
                          THROW;
                          ROLLBACK;
                         END CATCH;
                       COMMIT`;

        request.query(QUERY, async (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }

            res.status(200).json({ message: "Successfully fetched resource.", response: result.recordset });
        });
    });
});
router.post("/:token", async (req, res) => {
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
    const content = req.body.content;
    const public = req.body.public;

    if (isNaN(Number(public)) || Number(public) !== 0 && Number(public) !== 1) {
        res.status(401).json({ message: "Expected integer for public property." });
        return;
    }
    if (typeof content != 'string' || content.length > 200 || content.length == 0) {
        res.status(401).json({ message: "Content for the post is not valid." });
        return;
    }
    sql.connect(config, async (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();

        request.input('username', sql.VarChar, username);
        request.input('content', sql.VarChar, content);
        request.input('public', sql.VarChar, public);

        const QUERY = `INSERT INTO Posts (Username, Content, PostedAt, IsPublic) VALUES (@username, @content, '${date.toISOString()}', @public);`;

        request.query(QUERY, async (err, result) => {
            if (err) {
                res.status(500).json({ message: "Something went wrong in our part." });
                console.log(err);
                return;
            }

            res.status(201).json({ message: "Successfully added resource." });
        });
    });
});
router.put("/:token", (req, res) => {
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
    const queryObject = {
        content: [req.body.content, sql.VarChar, `SET Content = @content`],
        public: [req.body.public, sql.Bit, `SET IsPublic = @public`]
    };
    const id = req.body.postId, content = req.body.content, public = req.body.public == true ? 1 : 0;

    if (typeof content != 'string' || content.length > 200) {
        res.status(401).json({ message: "Expected string, or different length for post content" });
    }
    if (isNaN(Number(id)) || Math.floor(Number(id)) != Number(id)) {
        res.status(401).json({ message: "Expected integer, instead got something else." });
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "Something went wrong in our part." });
            return;
        }
        const request = new sql.Request();

        request.input('postId', sql.Int, id);
        request.input('username', sql.VarChar, username);

        const date = new Date();

        let QUERY = `BEGIN TRANSACTION; 
                        BEGIN TRY
                         DECLARE @Count INT;

                         SELECT @Count = COUNT(*)
                         FROM Posts 
                         WHERE PostId = @postId AND Username = @username;
                         
                         IF(@Count = 1)
                          BEGIN
                           UPDATE Posts`;
        for (const key in queryObject)
            if (queryObject[key][0] != undefined) {
                request.input(key, queryObject[key][1], queryObject[key][0]);
                QUERY += queryObject[key][2];
            }
        QUERY += `WHERE PostId = @postId
                 END
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

            res.status(201).json({ message: "Successfully added resource." });
        });
    });
});
module.exports = router;
