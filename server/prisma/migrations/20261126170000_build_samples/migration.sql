-- CreateTable
CREATE TABLE `BuildMatch` (
    `matchId` VARCHAR(30) NOT NULL,
    `source` VARCHAR(10) NOT NULL,
    `patch` VARCHAR(10) NOT NULL,
    `queueId` INTEGER NOT NULL,
    `gameCreation` DATETIME(3) NOT NULL,

    INDEX `BuildMatch_source_patch_idx`(`source`, `patch`),
    PRIMARY KEY (`matchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BuildSample` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matchId` VARCHAR(30) NOT NULL,
    `puuid` VARCHAR(78) NOT NULL,
    `championId` INTEGER NOT NULL,
    `teamPosition` VARCHAR(191) NOT NULL,
    `win` BOOLEAN NOT NULL,
    `spell1` INTEGER NOT NULL,
    `spell2` INTEGER NOT NULL,
    `primaryStyle` INTEGER NOT NULL,
    `subStyle` INTEGER NOT NULL,
    `perks` JSON NOT NULL,
    `shards` JSON NOT NULL,
    `startItems` JSON NOT NULL,
    `itemOrder` JSON NOT NULL,
    `finalItems` JSON NOT NULL,
    `skillOrder` VARCHAR(18) NOT NULL,

    INDEX `BuildSample_championId_teamPosition_idx`(`championId`, `teamPosition`),
    UNIQUE INDEX `BuildSample_matchId_puuid_key`(`matchId`, `puuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BuildSample` ADD CONSTRAINT `BuildSample_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `BuildMatch`(`matchId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BuildSample` ADD CONSTRAINT `BuildSample_championId_fkey` FOREIGN KEY (`championId`) REFERENCES `Champion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
