-- dev.Guild definition

CREATE TABLE `Guild` (
`id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`teshrole` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.LogError definition

CREATE TABLE `LogError` (
`id` int NOT NULL AUTO_INCREMENT,
`app` varchar(3) NOT NULL,
`category` varchar(50) DEFAULT NULL,
`error` text NOT NULL,
`time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.LogUse definition

CREATE TABLE `LogUse` (
`id` int NOT NULL AUTO_INCREMENT,
`app` varchar(3) NOT NULL,
`time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`content` text NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.`User` definition

CREATE TABLE `User` (
`id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`web` tinyint(1) NOT NULL DEFAULT '0',
`levelping` tinyint(1) NOT NULL DEFAULT '1',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.Channel definition

CREATE TABLE `Channel` (
`id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`type` varchar(3) NOT NULL,
`guild` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
PRIMARY KEY (`id`),
KEY `Channel_FK` (`guild`),
CONSTRAINT `Channel_FK` FOREIGN KEY (`guild`) REFERENCES `Guild` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.`Level` definition

CREATE TABLE `Level` (
`guild` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`border` int NOT NULL DEFAULT '20',
`xp` int NOT NULL DEFAULT '10',
`factor` int NOT NULL DEFAULT '1',
`channel` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
PRIMARY KEY (`guild`),
CONSTRAINT `Level_FK` FOREIGN KEY (`guild`) REFERENCES `Guild` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.Levelgoals definition

CREATE TABLE `Levelgoals` (
`level` int NOT NULL,
`message` varchar(1500) DEFAULT NULL,
`role` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
`guild` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
PRIMARY KEY (`level`),
KEY `Levelgoals_FK` (`guild`),
CONSTRAINT `Levelgoals_FK` FOREIGN KEY (`guild`) REFERENCES `Guild` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.Report definition

CREATE TABLE `Report` (
`id` int NOT NULL AUTO_INCREMENT,
`user` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`level` float NOT NULL DEFAULT '1',
`archived` tinyint(1) NOT NULL DEFAULT '0',
`guild` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`content` text,
`json` json DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `Report_FK` (`user`),
KEY `Report_FK_1` (`guild`),
CONSTRAINT `Report_FK` FOREIGN KEY (`user`) REFERENCES `User` (`id`),
CONSTRAINT `Report_FK_1` FOREIGN KEY (`guild`) REFERENCES `Guild` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.Ticket definition

CREATE TABLE `Ticket` (
`id` int NOT NULL AUTO_INCREMENT,
`channel` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`user` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`guild` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`closed` tinyint(1) NOT NULL DEFAULT '0',
`content` json NOT NULL,
`log` varchar(30) NOT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `Ticket_UN` (`channel`),
KEY `Ticket_FK` (`user`),
KEY `Ticket_FK_1` (`guild`),
CONSTRAINT `Ticket_FK` FOREIGN KEY (`user`) REFERENCES `User` (`id`),
CONSTRAINT `Ticket_FK_1` FOREIGN KEY (`guild`) REFERENCES `Guild` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.Ticketp definition

CREATE TABLE `Ticketp` (
`message` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`channel` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`guild` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`category` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`text` varchar(1500) DEFAULT NULL,
`log` varchar(30) DEFAULT NULL,
PRIMARY KEY (`message`),
KEY `Ticketp_FK` (`guild`),
CONSTRAINT `Ticketp_FK` FOREIGN KEY (`guild`) REFERENCES `Guild` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.Words definition

CREATE TABLE `Words` (
`guild` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`min` int NOT NULL DEFAULT '2',
`max` int NOT NULL DEFAULT '10',
`channel` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
`warning` tinyint(1) NOT NULL DEFAULT '1',
`toggle` tinyint(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`guild`),
CONSTRAINT `Words_FK` FOREIGN KEY (`guild`) REFERENCES `Guild` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- dev.Xp definition

CREATE TABLE `Xp` (
`user` varchar(30) NOT NULL,
`guild` varchar(30) NOT NULL,
`xp` int NOT NULL DEFAULT '0',
KEY `Xp_FK_1` (`user`),
CONSTRAINT `Xp_FK` FOREIGN KEY (`user`) REFERENCES `Guild` (`id`),
CONSTRAINT `Xp_FK_1` FOREIGN KEY (`user`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
