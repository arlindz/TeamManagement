const express = require("express");
const sql = require("mssql/msnodesqlv8");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
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
const router = express.Router();
const salt = "57a41fbb9175f74213c3be6a7a1ba434", iterations = 1000, keylen = 64, hash = "sha512"

router.post("/logIn", (req, res) => {
    if (req.body === undefined) {
        res.status(401).json({ message: "Body property not included in the request." });
        return;
    }
    const username = req.body.username, password = req.body.password;

    if (typeof username != 'string' || typeof password != 'string') {
        res.status(401).json({ message: "Expected both password and username to be string, instead got: " + (typeof username) + ", and " + (typeof password) });
        return;
    }
    if (username.length > 30 || password.length > 30) {
        res.status(401).json({ message: "Username or password are too long." });
        return;
    }
    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "A mistake happened on our part." });
            return;
        }

        const hashedPassword = crypto.pbkdf2Sync(password, salt, iterations, keylen, hash).toString('hex');
        const request = new sql.Request();
        request.input('username', sql.VarChar, username);
        request.input('password', sql.VarChar, hashedPassword);
        const QUERY = `SELECT UserId
                       FROM Users 
                       WHERE Username = @username AND Password = @password`;

        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "A mistake happened on our part." });
                return;
            }

            if (result.recordset.length === 0) {
                res.status(403).json({ message: "You do not have access to this resource." });
                return;
            }
            const token = jwt.sign({ username: username, userId: result.recordset[0].UserId, exp: (Date.now()) / 1000 + 3 * (60 * 60) }, tokenKey);
            res.status(200).json({ message: "User authorized.", response: { token: token, username: username, userId: result.recordset[0].UserId } });
        });
    });
});
router.post("/register", upload.single('image'), (req, res) => {
    console.log("registered");
    if (req.body === undefined) {
        res.status(401).json({ message: "Body property not included in the request." });
        console.log("req.body undefined");
        return;
    }
    const username = req.body.username, password = req.body.password, description = req.body.description === undefined || req.body.description.length == 0 ? "Hello world!" : req.body.description;
    if (typeof username != 'string' || typeof password != 'string') {
        console.log("req.body undefined");
        res.status(401).json({ message: "Expected both password and usernmae to be string, instead got: " + (typeof username) + ", and " + (typeof password) });
        return;
    }
    if (username.length > 30 || password.length > 30) {
        res.status(401).json({ message: "Username or password are too long." });
        console.log("username too long pass too long");
        return;
    }
    console.log(req.file)
    const imageUrl = req.file === undefined ? `http://localhost:5000/images/defaultUserPFP` : `http://localhost:5000/images/${req.file.filename}`;

    sql.connect(config, (err) => {
        if (err) {
            res.status(500).json({ message: "A mistake happened on our part." });
            console.log("database connection failed.");
            return;
        }

        const hashedPassword = crypto.pbkdf2Sync(password, salt, iterations, keylen, hash).toString('hex');
        const request = new sql.Request();
        request.input('username', sql.VarChar, username);
        request.input('password', sql.VarChar, hashedPassword);
        request.input('imageUrl', sql.VarChar, imageUrl);
        request.input('description', sql.VarChar, description)
        const QUERY = `BEGIN TRANSACTION
                           BEGIN TRY
                            INSERT INTO Posters(PosterType) VALUES('User');
                            DECLARE @UserId BIGINT;

                            SELECT @UserId = MAX(PosterId)
                            FROM Posters
                            
                            INSERT INTO Users(UserId, Username, Password, Description, LogoPath) VALUES(@UserId, @username, @password, @description, @imageUrl);
                           END TRY
                           BEGIN CATCH
                            THROW; 
                            ROLLBACK;
                           END CATCH;
                       COMMIT;`;

        request.query(QUERY, (err, result) => {
            if (err) {
                res.status(500).json({ message: "A mistake happened on our part." });
                console.log(err);
                return;
            }
            if (result.rowsAffected === 0) {
                res.status(400).json({ message: "Could not add the resource." });
                return;
            }
            res.status(201).json({ message: "Successfully created resource." });
        });
    })
});
module.exports = router;