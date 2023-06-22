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
router.post('/post/:id', (req, res) => {
    const token = req.headers['auth'];
    let userId = null, isValid = false;
    const postId = req.params.id;
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
        const like = req.body.like === true ? 1 : 0;
        request.input('userId', sql.BigInt, userId);
        request.input('postId', sql.BigInt, postId);
        request.input('like', sql.Bit, like)
        const QUERY = `BEGIN TRANSACTION
                         BEGIN TRY
                          DECLARE @CanInteract BIT;
                          
                          SET @CanInteract = 
                             CASE WHEN 
                              (
                                (SELECT COUNT(*) FROM Posts WHERE PostId = @postId AND IsPublic = 1) = 1 
                                OR
                                (
                                    (SELECT COUNT(*) FROM Posts WHERE PostId = @postId AND PosterId = @userId) = 1 OR 
                                    (SELECT COUNT(*) FROM UsersTeams ut WHERE ut.TeamId = @posterId AND ut.UserId = @userId) = 1
                                )
                              ) THEN 1 ELSE O END;
                           IF(@CanInteract = 1)
                           BEGIN
                            DECLARE @Exists BIT;

                            SET @Exists = CASE WHEN (SELECT COUNT(*) FROM Likes WHERE PostId = @postId AND UserId = @userId) = 1 THEN 1 ELSE 0 END;
                            IF(@Exists = 1)
                            BEGIN
                              DECLARE @IsLiked BIT;
                              SET @IsLiked = CASE WHEN (SELECT COUNT(*) FROM Likes WHERE PostId = @postId AND UserId = @userId AND State = @like) = 1 THEN 1 ELSE 0 END;
                                IF(@IsLiked = 1)
                                BEGIN
                                  DELETE FROM Likes WHERE PostId = @postId AND UserId = @userId;
                                END
                                ELSE
                                BEGIN
                                  UPDATE Likes SET State = @like, SET CreatedAt = GETDATE() WHERE PostId = @postId AND UserId = @userId;
                                END
                            END
                            ELSE
                            BEGIN 
                              INSERT INTO Likes (PostId, UserId, State) VALUES (@postId, @userId, @like, CreatedAt = GETDATE());
                            END
                           END
                           SELECT State FROM Likes
                           WHERE PostId = @postId AND UserId = @userId;
                          END TRY
                          BEGIN CATCH
                           THROW;
                           ROLLBACK;
                          END CATCH
                        COMMIT;`;
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
router.post('/comment/:id', (req, res) => {
    const token = req.headers['auth'];
    let userId = null, isValid = false;
    const commentId = req.params.id;
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
        const like = req.body.like === true ? 1 : 0;
        request.input('userId', sql.BigInt, userId);
        request.input('commentId', sql.BigInt, commentId);
        request.input('like', sql.Bit, like)
        const QUERY = `BEGIN TRANSACTION
                         BEGIN TRY
                          DECLARE @CanInteract BIT;
                          
                          SET @CanInteract = 
                             CASE WHEN 
                              (
                                (SELECT COUNT(*)
                                 FROM Comments
                                    JOIN Posts p
                                    ON c.PostId = p.PostId AND p.IsPublic = 1
                                 WHERE c.CommentId = @commentId) = 1 
                                OR
                                (
                                    (SELECT COUNT(*) 
                                     FROM Comments c
                                        JOIN Posts p 
                                        ON p.PostId = c.PostId AND p.PosterId = @userId
                                     WHERE c.CommentId = @commentId) = 1 OR 
                                    (SELECT COUNT(*) 
                                     FROM Comments c
                                        JOIN Posts p
                                        ON p.PostId = c.PostId
                                           JOIN UsersTeams ut 
                                           ON ut.TeamId = p.PosterId AND ut.UserId = @userId
                                     WHERE c.CommentId = @commentId) = 1
                                )
                              ) THEN 1 ELSE O END;

                           IF(@CanInteract = 1)
                           BEGIN
                            DECLARE @Exists BIT;
                            SET @Exists = CASE WHEN (SELECT COUNT(*) FROM CommentLikes WHERE CommentId = @commentId AND UserId = @userId) = 1 THEN 1 ELSE 0 END;

                            IF(@Exists = 1)
                            BEGIN
                              DECLARE @IsLiked BIT;
                              SET @IsLiked = CASE WHEN (SELECT COUNT(*) FROM CommentLikes WHERE CommentId = @commentId AND UserId = @userId AND State = @like) = 1 THEN 1 ELSE 0 END;
                                IF(@IsLiked = 1)
                                BEGIN
                                  DELETE FROM CommentLikes WHERE CommentId = @commentId AND UserId = @userId;
                                END
                                ELSE
                                BEGIN
                                  UPDATE CommentLikes SET State = @like, SET CreatedAt = GETDATE() WHERE CommentId = @commentId AND UserId = @userId;
                                END
                            END
                            ELSE
                            BEGIN 
                              INSERT INTO Likes (CommentId, UserId, State) VALUES (@commentId, @userId, @like, CreatedAt = GETDATE());
                            END
                           END
                           SELECT State FROM CommentLikes
                           WHERE CommentId = @commentId AND UserId = @userId;
                          END TRY
                          BEGIN CATCH
                           THROW;
                           ROLLBACK;
                          END CATCH
                        COMMIT;`;
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

module.exports = router;