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
router.post('/', (req, res) => {
    const token = req.headers['auth'];
    let userId = null, isValid = false;
    const postId = req.body.postId;
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
        const content = req.body.content;
        const request = new sql.Request();
        request.input('userId', sql.BigInt, userId);
        request.input('postId', sql.BigInt, postId);
        request.input('content', sql.VarChar, content);
        const QUERY = `BEGIN TRANSACTION
                         BEGIN TRY
                          DECLARE @CanComment BIT;
                          
                          SET @CanComment = 
                             CASE WHEN 
                              (
                                (SELECT COUNT(*) FROM Posts WHERE PostId = @postId AND IsPublic = 1) = 1 
                                OR
                                (
                                    (SELECT COUNT(*) FROM Posts WHERE PostId = @postId AND PosterId = @userId) = 1 OR 
                                    (SELECT COUNT(*) FROM UsersTeams ut WHERE ut.TeamId = @posterId AND ut.UserId = @userId) = 1
                                )
                              ) THEN 1 ELSE O END;
                           IF(@CanComment = 1)
                           BEGIN
                             INSERT INTO Comments (Content, UserId, PostId, CreatedAt) VALUES (@content, @userId, @postId, GETDATE());
                             DECLARE @CommentId BIGINT;
                             SELECT @CommentId = MAX(CommentId) FROM Comments;
                             SELECT * FROM Comments WHERE CommentId = @CommentId;
                           END
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
            res.status(201).json({ message: "Successfully created resource.", response: result.recordset });
        });
    });
});
router.put('/:id', (req, res) => {
    const token = req.headers['auth'];
    let userId = null, isValid = false;
    const postId = req.body.postId;
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
        const content = req.body.content;
        const commentId = req.params.id;
        const request = new sql.Request();
        request.input('userId', sql.BigInt, userId);
        request.input('postId', sql.BigInt, postId);
        request.input('content', sql.VarChar, content);
        request.input('commentId', sql.BigInt, commentId);
        const QUERY = `BEGIN TRANSACTION
                         BEGIN TRY
                          DECLARE @CanUpdate BIT;
                          
                          SET @CanUpdate = 
                             CASE WHEN 
                              (
                                 SELECT COUNT(*) FROM Comments WHERE CommentId = @commentId AND UserId = @userId
                              ) THEN 1 ELSE O END;
                           IF(@CanUpdate = 1)
                           BEGIN
                             DECLARE @IsModified BIT;
                             SET @IsModified = CASE WHEN (SELECT COUNT(*) FROM Comments WHERE CommentId = @commentId AND Content = @content) = 1 THEN 0 ELSE 1 END;
                             IF(@IsModified = 1)
                             BEGIN
                               UPDATE Comments
                               SET Content = @content, Edited = 1
                               WHERE CommentId = @commentId;
              
                               SELECT * FROM Comments WHERE CommentId = @commentId;
                             END
                           END
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
            res.status(200).json({ message: "Successfully updated resource.", response: result.recordset });
        });
    });
})
router.delete('/:id', (req, res) => {
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
            res.status(500).json({ message: "An error happened on our side." });
            return;
        }
        const commentId = req.params.id;
        const request = new sql.Request();
        request.input('userId', sql.BigInt, userId);
        request.input('commentId', sql.BigInt, commentId);
        const QUERY = `BEGIN TRANSACTION
                         BEGIN TRY
                          DECLARE @CanDelete BIT;
                          
                          SET @CanDelete = 
                             CASE WHEN 
                              (
                                 SELECT COUNT(*) FROM Comments WHERE CommentId = @commentId AND UserId = @userId
                              ) THEN 1 ELSE O END;
                           IF(@CanDelete = 1)
                           BEGIN
                             DELETE FROM Comments WHERE CommentId = @commentId;                
                           END
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
            res.status(201).json({ message: "Successfully created resource.", response: result.recordset });
        });
    });
})
router.get('/:id', (req, res) => {
    const token = req.headers['auth'];
    const rows = req.headers['rows'], page = req.headers['page'];
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
            res.status(500).json({ message: "An error happened on our side." });
            return;
        }
        const postId = req.params.id;
        const request = new sql.Request();
        request.input('rows', sql.BigInt, rows);
        request.input('userId', sql.BigInt, userId);
        request.input('postId', sql.BigInt, postId);
        request.input('offset', sql.Int, (page - 1) * rows);
        const QUERY = `BEGIN TRANSACTION
                         BEGIN TRY
                          DECLARE @CanGet BIT;
                          
                          SET @CanGet = 
                          CASE WHEN 
                          (
                            (SELECT COUNT(*) FROM Posts WHERE PostId = @postId AND IsPublic = 1) = 1 
                            OR
                            (
                                (SELECT COUNT(*) FROM Posts WHERE PostId = @postId AND PosterId = @userId) = 1 OR 
                                (SELECT COUNT(*) FROM UsersTeams ut WHERE ut.TeamId = @posterId AND ut.UserId = @userId) = 1
                            )
                          ) THEN 1 ELSE O END;
                           IF(@CanGet = 1)
                           BEGIN
                             SELECT * FROM Comments
                             WHERE PostId = @postId
                             ORDER BY Created DESC
                             OFFSET @offset ROWS
                             FETCH NEXT @rows ROWS ONLY;;           
                           END
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
            res.status(201).json({ message: "Successfully created resource.", response: result.recordset });
        });
    });
})
module.exports = router;