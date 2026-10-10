-- CreateTable
CREATE TABLE `Player` (
    `puuid` VARCHAR(78) NOT NULL,
    `gameName` VARCHAR(191) NOT NULL,
    `tagLine` VARCHAR(191) NOT NULL,
    `profileIconId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`puuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Champion` (
    `id` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Champion_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `matchId` VARCHAR(30) NOT NULL,
    `queueId` INTEGER NOT NULL,
    `gameCreation` DATETIME(3) NOT NULL,
    `gameDuration` INTEGER NOT NULL,

    INDEX `Match_gameCreation_idx`(`gameCreation`),
    PRIMARY KEY (`matchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchParticipant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matchId` VARCHAR(30) NOT NULL,
    `puuid` VARCHAR(78) NOT NULL,
    `championId` INTEGER NOT NULL,
    `teamPosition` VARCHAR(191) NOT NULL,
    `win` BOOLEAN NOT NULL,
    `kills` INTEGER NOT NULL,
    `deaths` INTEGER NOT NULL,
    `assists` INTEGER NOT NULL,
    `cs` INTEGER NOT NULL,
    `visionScore` INTEGER NOT NULL,

    UNIQUE INDEX `MatchParticipant_matchId_puuid_key`(`matchId`, `puuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RankSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `puuid` VARCHAR(78) NOT NULL,
    `queueType` VARCHAR(191) NOT NULL,
    `tier` VARCHAR(191) NOT NULL,
    `rank` VARCHAR(191) NOT NULL,
    `leaguePoints` INTEGER NOT NULL,
    `wins` INTEGER NOT NULL,
    `losses` INTEGER NOT NULL,
    `takenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RankSnapshot_puuid_takenAt_idx`(`puuid`, `takenAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MatchParticipant` ADD CONSTRAINT `MatchParticipant_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`matchId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchParticipant` ADD CONSTRAINT `MatchParticipant_puuid_fkey` FOREIGN KEY (`puuid`) REFERENCES `Player`(`puuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchParticipant` ADD CONSTRAINT `MatchParticipant_championId_fkey` FOREIGN KEY (`championId`) REFERENCES `Champion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RankSnapshot` ADD CONSTRAINT `RankSnapshot_puuid_fkey` FOREIGN KEY (`puuid`) REFERENCES `Player`(`puuid`) ON DELETE RESTRICT ON UPDATE CASCADE;
