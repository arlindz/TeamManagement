const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const uploadDirectory = path.join(__dirname, 'uploads');
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

const teamRouter = require("./routes/teams.js");
const logInRouter = require("./routes/logIn.js");
const inviteRouter = require("./routes/invites.js");
const notificationRouter = require("./routes/notifications.js");
const taskRouter = require("./routes/tasks.js");
const userRouter = require("./routes/users.js");
const followRouter = require("./routes/followers.js");
const postRouter = require("./routes/posts.js");
const orientationRouter = require("./routes/orientations.js");
const teamTypesRouter = require("./routes/teamtypes.js");
const challengesRouter = require(`./routes/challenges.js`);
const likesRouter = require(`./routes/likes.js`);
const commentsRouter = require(`./routes/comments.js`);

app.use("/team", teamRouter);
app.use("/authenticate", logInRouter);
app.use("/invite", inviteRouter);
app.use("/tasks", taskRouter);
app.use("/notifications", notificationRouter);
app.use("/users", userRouter);
app.use("/follow", followRouter);
app.use("/post", postRouter);
app.use('/orientations', orientationRouter);
app.use('/teamtypes', teamTypesRouter);
app.use('/challenges', challengesRouter);
app.use('/like', likesRouter);
app.use('/comment', commentsRouter);

app.use('/images', express.static(uploadDirectory));

app.listen(5000, () => {
    console.log('Server started on port 5000');
});