-- CreateTable
CREATE TABLE `ChampionMastery` (
    `puuid` VARCHAR(78) NOT NULL,
    `championId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `points` INTEGER NOT NULL,
    `lastPlayedAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`puuid`, `championId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChampionMastery` ADD CONSTRAINT `ChampionMastery_puuid_fkey` FOREIGN KEY (`puuid`) REFERENCES `Player`(`puuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChampionMastery` ADD CONSTRAINT `ChampionMastery_championId_fkey` FOREIGN KEY (`championId`) REFERENCES `Champion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

