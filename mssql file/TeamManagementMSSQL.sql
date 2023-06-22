CREATE DATABASE TeamManagement
USE TeamManagement

CREATE TABLE Orientation(
   Orientation VARCHAR(7) PRIMARY KEY,
);
CREATE TABLE PostTypes(
   PostType VARCHAR(20) PRIMARY KEY
);
CREATE TABLE Posters(
   PosterId BIGINT IDENTITY(1,1) PRIMARY KEY,
   PosterType VARCHAR(7) NOT NULL,
   FOREIGN KEY(PosterType) REFERENCES Orientation(Orientation)
);

CREATE TABLE Posts(
   PostId BIGINT IDENTITY(1,1) PRIMARY KEY,
   PosterId BIGINT NOT NULL,
   Content VARCHAR(300),
   PostedAt DATETIME NOT NULL,
   IsPublic BIT NOT NULL,
   PostType VARCHAR(20) NOT NULL,
   FOREIGN KEY (PostType) REFERENCES PostTypes(PostType),
   FOREIGN KEY (PosterId) REFERENCES Posters(PosterId) ON DELETE CASCADE,
);
CREATE TABLE Challenges(
   ChallengeId BIGINT NOT NULL,
   PRIMARY KEY(ChallengeId)
   ChallengeFormat VARCHAR(50) ,
   DurationType VARCHAR(40) ,
   DurationLength VARCHAR(30) ,
   FOREIGN KEY (ChallengeId) REFERENCES Posts(PostId) ON DELETE CASCADE,
   FOREIGN KEY (ChallengeFormat) REFERENCES ChallengeFormats(ChallengeFormat),
   FOREIGN KEY (DurationType) REFERENCES ChallengeDurationTypes(ChallengeDurationType)
);
CREATE NONCLUSTERED INDEX IDX_Challenges_ChallengeId ON Challenges(ChallengeId);

INSERT INTO ChallengeFormats(ChallengeFormat) VALUES ('1v1');
INSERT INTO ChallengeFormats(ChallengeFormat) VALUES ('2v2');
INSERT INTO ChallengeFormats(ChallengeFormat) VALUES ('3v3');
INSERT INTO ChallengeFormats(ChallengeFormat) VALUES ('4v4');
INSERT INTO ChallengeFormats(ChallengeFormat) VALUES ('5v5');
INSERT INTO ChallengeFormats(ChallengeFormat) VALUES ('6v6');
INSERT INTO ChallengeFormats(ChallengeFormat) VALUES ('7v7');
INSERT INTO ChallengeFormats(ChallengeFormat) VALUES ('11v11');

CREATE TABLE ChallengeFormatsTeamTypes(
    ChallengeFormat VARCHAR(50) NOT NULL,
	TeamType VARCHAR(40) NOT NULL,
	FOREIGN KEY(ChallengeFormat) REFERENCES ChallengeFormats(ChallengeFormat) ON DELETE CASCADE,
	FOREIGN KEY(TeamType) REFERENCES TeamTypes(TeamType) ON DELETE CASCADE
);
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('1v1', 'Basketball');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('2v2', 'Basketball');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('3v3', 'Basketball');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('3v3', 'Basketball');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('4v4', 'Basketball');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('5v5', 'Basketball');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('3v3', 'Football');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('4v4', 'Football');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('5v5', 'Football');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('6v6', 'Football');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('7v7', 'Football');
INSERT INTO ChallengeFormatsTeamTypes(ChallengeFormat, TeamType) VALUES('11v11', 'Football');

CREATE TABLE ChallengeDurationTypes(
    ChallengeDurationType VARCHAR(40) PRIMARY KEY
);
INSERT INTO ChallengeDurationTypes(ChallengeDurationType) VALUES ('First to score');
INSERT INTO ChallengeDurationTypes(ChallengeDurationType) VALUES ('2 halves');
INSERT INTO ChallengeDurationTypes(ChallengeDurationType) VALUES ('1 half');
INSERT INTO ChallengeDurationTypes(ChallengeDurationType) VALUES ('3 quarters');
INSERT INTO ChallengeDurationTypes(ChallengeDurationType) VALUES ('1 quarter');
INSERT INTO ChallengeDurationTypes(ChallengeDurationType) VALUES ('4 quarters');
INSERT INTO ChallengeDurationTypes(ChallengeDurationType) VALUES ('2 quarters');

CREATE TABLE ChallengeDurationTypeTeamTypes(
   TeamType VARCHAR(40) NOT NULL,
   ChallengeDurationType VARCHAR(40) NOT NULL,
   FOREIGN KEY (TeamType) REFERENCES TeamTypes(TeamType),
   FOREIGN KEY (ChallengeDurationType) REFERENCES ChallengeDurationTypes(ChallengeDurationType)
);
INSERT INTO ChallengeDurationTypeTeamTypes(ChallengeDurationType, TeamType) VALUES ('First to score', 'Basketball');
INSERT INTO ChallengeDurationTypeTeamTypes(ChallengeDurationType, TeamType) VALUES ('First to score', 'Football');
INSERT INTO ChallengeDurationTypeTeamTypes(ChallengeDurationType, TeamType) VALUES ('2 halves', 'Football');
INSERT INTO ChallengeDurationTypeTeamTypes(ChallengeDurationType, TeamType) VALUES ('1 half', 'Football');
INSERT INTO ChallengeDurationTypeTeamTypes(ChallengeDurationType, TeamType) VALUES ('3 quarters', 'Basketball');
INSERT INTO ChallengeDurationTypeTeamTypes(ChallengeDurationType, TeamType) VALUES ('1 quarter', 'Basketball');
INSERT INTO ChallengeDurationTypeTeamTypes(ChallengeDurationType, TeamType) VALUES ('4 quarters', 'Basketball');
INSERT INTO ChallengeDurationTypeTeamTypes(ChallengeDurationType, TeamType) VALUES ('2 quarters', 'Basketball');

CREATE TABLE ChallengeTimeLengths(
   ChallengeTimeLength VARCHAR(30) PRIMARY KEY
);

INSERT INTO ChallengeTimeLengths(ChallengeTimeLength) VALUES ('90mins');
INSERT INTO ChallengeTimeLengths(ChallengeTimeLength) VALUES ('75mins');
INSERT INTO ChallengeTimeLengths(ChallengeTimeLength) VALUES ('60mins');
INSERT INTO ChallengeTimeLengths(ChallengeTimeLength) VALUES ('45mins');
INSERT INTO ChallengeTimeLengths(ChallengeTimeLength) VALUES ('30mins');
INSERT INTO ChallengeTimeLengths(ChallengeTimeLength) VALUES ('15mins');
INSERT INTO ChallengeTimeLengths(ChallengeTimeLength) VALUES ('10mins');
INSERT INTO ChallengeTimeLengths(ChallengeTimeLength) VALUES ('5mins');

CREATE TABLE ChallengeTimeLengthsDurationTypes(
   ChallengeTimeLength VARCHAR(30) NOT NULL,
   ChallengeDurationType VARCHAR(40) NOT NULL,
   FOREIGN KEY (ChallengeDurationType) REFERENCES ChallengeDurationTypes(ChallengeDurationType) ON DELETE CASCADE,
   FOREIGN KEY (ChallengeTimeLength) REFERENCES ChallengeTimeLengths(ChallengeTimeLength) ON DELETE CASCADE
);
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('90mins', '1 half');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('75mins', '1 half');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('45mins', '1 half');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('45mins', '2 halves');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('30mins', '2 halves');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('60mins', '1 half');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('15mins', '2 halves');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('15mins', '4 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('15mins', '3 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('15mins', '2 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('15mins', '1 quarter');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('10mins', '4 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('10mins', '3 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('10mins', '2 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('10mins', '1 quarter');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('5mins', '4 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('5mins', '3 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('5mins', '2 quarters');
INSERT INTO ChallengeTimeLengthsDurationTypes(ChallengeTimeLength, ChallengeDurationType) VALUES ('5mins', '1 quarter');

CREATE TABLE Users(
  UserId BIGINT PRIMARY KEY,
  FOREIGN KEY (UserId) REFERENCES Posters(PosterId) ON DELETE CASCADE ON UPDATE CASCADE,
  Username VARCHAR(30) UNIQUE NOT NULL,
  Password VARCHAR(128) NOT NULL,
  Followers INT NOT NULL DEFAULT 0,
  Description VARCHAR(400) NOT NULL,
  LogoPath VARCHAR(200),
  Following INT NOT NULL DEFAULT 0,
  NameOfUser VARCHAR(30),
  LastNameOfUser VARCHAR(30)
);
CREATE INDEX IDX_Users_UserId ON Users(UserId);
CREATE TABLE TeamTypes(
   TeamType VARCHAR(40) PRIMARY KEY,
   Orientation VARCHAR(7) NOT NULL,
   FOREIGN KEY(Orientation) REFERENCES Orientation(Orientation)
);
CREATE TABLE OrientationPostTypes(
   PostType VARCHAR(20) NOT NULL,
   Orientation VARCHAR(7) NOT NULL,
   FOREIGN KEY(PostType) REFERENCES PostTypes(PostType),
   FOREIGN KEY(Orientation) REFERENCES Orientation(Orientation)
);

INSERT INTO PostTypes(PostType) VALUES('Posts');
INSERT INTO PostTypes(PostType) VALUES('Challenges');

INSERT INTO Orientation(Orientation) VALUES('Sport');
INSERT INTO Orientation(Orientation) VALUES('User');
INSERT INTO Orientation(Orientation) VALUES('Science');
INSERT INTO Orientation(Orientation) VALUES('Casual');
INSERT INTO Orientation(Orientation) VALUES('Other');
INSERT INTO Orientation(Orientation) VALUES('General');

INSERT INTO OrientationPostTypes(PostType, Orientation) VALUES('Posts', 'User');
INSERT INTO OrientationPostTypes(PostType, Orientation) VALUES('Posts', 'Sport');
INSERT INTO OrientationPostTypes(PostType, Orientation) VALUES('Posts', 'Science');
INSERT INTO OrientationPostTypes(PostType, Orientation) VALUES('Posts', 'Casual');
INSERT INTO OrientationPostTypes(PostType, Orientation) VALUES('Posts', 'Other');
INSERT INTO OrientationPostTypes(PostType, Orientation) VALUES('Posts', 'General');
INSERT INTO OrientationPostTypes(PostType, Orientation) VALUES('Challenges', 'Sport');

INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Football', 'Sport');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Basketball', 'Sport');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Baseball', 'Sport');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Tennis', 'Sport');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Fitness', 'Sport');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Parkour', 'Sport');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Singing', 'Casual');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Musical Instrument', 'Casual');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Mathematics', 'Science');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Programming', 'Science');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Physics', 'Science');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Chemistry', 'Science');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Biology', 'Science');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('General', 'General');
INSERT INTO TeamTypes(TeamType, Orientation) VALUES ('Other', 'Other');

CREATE TABLE Teams(
 TeamId BIGINT PRIMARY KEY,
 UserId BIGINT,
 Orientation VARCHAR(7) NOT NULL,
 Description VARCHAR(300),
 MaxMembers INT DEFAULT 10,
 CurrentMembers INT DEFAULT 1,
 TeamName VARCHAR(30) NOT NULL,
 LogoPath VARCHAR(200),
 FOREIGN KEY(UserId) REFERENCES Users(UserId) ON DELETE SET NULL,
 FOREIGN KEY (TeamId) REFERENCES Posters(PosterId)
);
CREATE INDEX IDX_Teams_TeamId ON Teams(TeamId);
CREATE NONCLUSTERED INDEX IDX_Teams_UserId ON Teams(UserId)
CREATE TABLE TeamsTeamTypes(
  TeamType VARCHAR(40) NOT NULL,
  TeamId BIGINT NOT NULL,
  PRIMARY KEY (TeamType, TeamId),
  FOREIGN KEY (TeamType) REFERENCES TeamTypes(TeamType) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (TeamId) REFERENCES Teams(TeamId) ON DELETE CASCADE 
);
CREATE NONCLUSTERED INDEX IDX_TeamsTeamTypes_TeamId ON TeamsTeamTypes(TeamId);
CREATE TABLE UsersTeams(
  UserId BIGINT NOT NULL,
  TeamId BIGINT NOT NULL,
  PRIMARY KEY (UserId, TeamId),
  FOREIGN KEY (UserId) REFERENCES Users(UserId),
  FOREIGN KEY (TeamId) REFERENCES Teams(TeamId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX IX_UsersTeams_TeamId ON UsersTeams(TeamId);
CREATE NONCLUSTERED INDEX IX_UsersTeams_UserId ON UsersTeams(UserId);
CREATE TABLE TeamInvitations(
  Invitation VARCHAR(64) PRIMARY KEY NOT NULL,
  TeamId BIGINT NOT NULL,
  Expires BIGINT NOT NULL,
  FOREIGN KEY (TeamId) REFERENCES Teams(TeamId) ON DELETE CASCADE ON UPDATE CASCADE
)

CREATE TABLE Tasks(
  TaskId BIGINT IDENTITY(1,1) PRIMARY KEY,
  Description VARCHAR(200),
  UserId BIGINT NOT NULL,
  TeamId BIGINT NOT NULL,
  Status BIT NOT NULL DEFAULT 0,
  FOREIGN KEY (UserId) REFERENCES Users(UserId),
  FOREIGN KEY (TeamId) REFERENCES Teams(TeamId) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE NONCLUSTERED INDEX IX_Tasks_Username ON Tasks(UserId);
CREATE NONCLUSTERED INDEX IX_Tasks_TeamId ON Tasks(TeamId);

CREATE TABLE Notifications(
  NotificationId INT IDENTITY(1,1) PRIMARY KEY,
  Description VARCHAR(200),
  UserId BIGINT NOT NULL,
  TeamId BIGINT NOT NULL,
  Seen BIT NOT NULL,
  ReceivedAt DATETIME NOT NULL,
  FOREIGN KEY (UserId) REFERENCES Users(UserId),
  FOREIGN KEY (TeamId) REFERENCES Teams(TeamId) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX IX_Notifications_UserId ON Notifications(UserId);

CREATE TABLE Followers(
  Follower BIGINT NOT NULL,
  Followee BIGINT NOT NULL,
  PRIMARY KEY (Follower, Followee),
  FOREIGN KEY (Follower) REFERENCES Users(UserId) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (Followee) REFERENCES Users(UserId) 
);
CREATE NONCLUSTERED INDEX IDX_Followers_Follower ON Followers(Follower);
CREATE NONCLUSTERED INDEX IDX_Followers_Followee ON Followers(Followee);

CREATE TABLE Likes(
   PostId BIGINT NOT NULL,
   UserId BIGINT NOT NULL,
   PRIMARY KEY(PostId, UserId)
   State BIT NOT NULL,
   CreatedAt DATETIME NOT NULL,
   FOREIGN KEY (PostId) REFERENCES Posts(PostId) ON DELETE CASCADE,
   FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX IDX_Likes_PostId ON Likes(PostId);

CREATE TABLE Comments(
   CommentId BIGINT IDENTITY(1,1) PRIMARY KEY,
   Content VARCHAR(400) NOT NULL,
   CreatedAt DATETIME NOT NULL,
   Edited BIT DEFAULT 0 NOT NULL,
   PostId BIGINT NOT NULL,
   UserId BIGINT NOT NULL,
   FOREIGN KEY (PostId) REFERENCES Posts(PostId) ON DELETE CASCADE,
   FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX IDX_Comments_PostId ON Comments(PostId);

CREATE TABLE CommentLikes(
   PostId BIGINT NOT NULL,
   UserId BIGINT NOT NULL,
   PRIMARY KEY(UserId, PostId),
   CreatedAt DATETIME NOT NULL,
   State BIT NOT NULL,
   FOREIGN KEY (PostId) REFERENCES Posts(PostId) ON DELETE CASCADE,
   FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX IDX_CommentLikes_PostId ON CommentLikes(PostId);

CREATE PROCEDURE JoinTeam @Username VARCHAR(30), @InvitationCode VARCHAR(64), @Expires BIGINT
				   AS
				   BEGIN
                         DECLARE @TeamId BIGINT;
                         DECLARE @Count INT;
						 DECLARE @UserId BIGINT;
						 SET @Count = 0;
			             SELECT @UserId = UserId
				     	 FROM Users 
				  		 WHERE Username = @Username;
						 PRINT @UserId;
                         SELECT @Count = COUNT(*), @TeamId = TeamId
                         FROM TeamInvitations  
                         WHERE Invitation = @InvitationCode AND Expires > @Expires
                         GROUP BY TeamId;
                         
                          IF(@Count > 0)
                          BEGIN 
                           DECLARE @UserExists INT = 0;
                       
                           SELECT @UserExists = COUNT(*)
                           FROM UsersTeams
                           WHERE TeamId = @TeamId AND UserId = @UserId;
						  
                           IF(@UserExists = 0)
                           BEGIN
                           DECLARE @CurrentMembers INT;
                           DECLARE @MaxMembers INT;

                           SELECT @CurrentMembers = CurrentMembers, @MaxMembers = MaxMembers
                           FROM Teams
                           WHERE TeamId = @TeamId;
						   PRINT @CurrentMembers;
						   PRINT @MaxMembers;
                            IF(@CurrentMembers < @MaxMembers)
                              BEGIN
                                DECLARE @TeamAdmin BIGINT;
                                DECLARE @TeamName VARCHAR(30);
                  

                                SELECT @TeamAdmin = UserId, @TeamName = TeamName
                                FROM Teams
                                WHERE TeamId = @TeamId;
								PRINT @TeamAdmin;
								PRINT @TeamName;
						    BEGIN TRANSACTION;
							   BEGIN TRY                          
                                   INSERT INTO UsersTeams(UserId, TeamId) VALUES (@UserId, @TeamId);
                                   UPDATE Teams
								   SET CurrentMembers = CurrentMembers + 1
								   WHERE TeamId = @TeamId;
                                   INSERT INTO Notifications(Description, TeamId, UserId, Seen, ReceivedAt) VALUES(@Username+' just joined '+@TeamName,
                                   @TeamId, @TeamAdmin, 0, GETDATE());
							   END TRY
							   BEGIN CATCH
							     ROLLBACK;
								 THROW;
							   END CATCH;
							  COMMIT;
                             END
                           END
                          END
                      END

	CREATE PROCEDURE GetUser @ProfileUsername VARCHAR(30), @Username VARCHAR(30)
	AS 
	   BEGIN
		 DECLARE @UserId BIGINT;
		 DECLARE @ProfileUserId BIGINT;
		 DECLARE @IsTheSame BIT;

		 SELECT @UserId = UserId
		 FROM Users
		 WHERE Username = @Username;

		 SELECT @ProfileUserId = UserId
		 FROM Users
		 WHERE Username = @ProfileUsername;
		 IF(@UserId = @ProfileUserId)
		 BEGIN
		   SET @IsTheSame = 1;
		 END
		 ELSE
		 BEGIN
		   SET @IsTheSame = 0;
		 END
		 SELECT COUNT(*) AS C
		 FROM Followers
		 WHERE Follower = @UserId AND Followee = @ProfileUserId;

		 SELECT Username, Followers, Following, @IsTheSame AS isOwnProfile, Description, LogoPath
		 FROM Users
		 WHERE UserId = @ProfileUserId

		 IF(@ProfileUsername = @Username)
		 BEGIN 
	    	 SELECT Content, IsPublic, PostedAt
		     FROM Posts 
		     WHERE PosterId = @ProfileUserId;
		 END
		 ELSE
		 BEGIN
		     SELECT Content, IsPublic, PostedAt
		     FROM Posts 
		     WHERE PosterId = @ProfileUserId AND IsPublic = 1;
		 END
	   END