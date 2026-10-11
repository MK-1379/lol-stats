-- CreateTable
CREATE TABLE `ScoreboardEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matchId` VARCHAR(30) NOT NULL,
    `puuid` VARCHAR(78) NOT NULL,
    `gameName` VARCHAR(191) NOT NULL,
    `tagLine` VARCHAR(191) NOT NULL,
    `championId` INTEGER NOT NULL,
    `teamId` INTEGER NOT NULL,
    `teamPosition` VARCHAR(191) NOT NULL,
    `win` BOOLEAN NOT NULL,
    `champLevel` INTEGER NOT NULL,
    `kills` INTEGER NOT NULL,
    `deaths` INTEGER NOT NULL,
    `assists` INTEGER NOT NULL,
    `cs` INTEGER NOT NULL,
    `visionScore` INTEGER NOT NULL,
    `goldEarned` INTEGER NOT NULL,
    `damageToChampions` INTEGER NOT NULL,

    UNIQUE INDEX `ScoreboardEntry_matchId_puuid_key`(`matchId`, `puuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ScoreboardEntry` ADD CONSTRAINT `ScoreboardEntry_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`matchId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreboardEntry` ADD CONSTRAINT `ScoreboardEntry_championId_fkey` FOREIGN KEY (`championId`) REFERENCES `Champion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
