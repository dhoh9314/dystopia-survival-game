-- CreateTable
CREATE TABLE "Shelter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registered" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Shelter_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "superpower" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "statPoints" INTEGER NOT NULL DEFAULT 0,
    "maxHp" INTEGER NOT NULL DEFAULT 100,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "strength" INTEGER NOT NULL DEFAULT 5,
    "agility" INTEGER NOT NULL DEFAULT 5,
    "perception" INTEGER NOT NULL DEFAULT 5,
    "vitality" INTEGER NOT NULL DEFAULT 5,
    "hunger" REAL NOT NULL DEFAULT 100,
    "thirst" REAL NOT NULL DEFAULT 100,
    "fatigue" REAL NOT NULL DEFAULT 0,
    "locationId" TEXT NOT NULL DEFAULT 'rq_checkpoint',
    "inventory" TEXT NOT NULL DEFAULT '[]',
    "equippedWeapon" TEXT,
    "equippedArmor" TEXT,
    "discoveredLore" TEXT NOT NULL DEFAULT '[]',
    "discoveredMobs" TEXT NOT NULL DEFAULT '[]',
    "interactedPlayers" TEXT NOT NULL DEFAULT '[]',
    "isDead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("accountId", "agility", "createdAt", "discoveredLore", "discoveredMobs", "equippedArmor", "equippedWeapon", "fatigue", "hp", "hunger", "id", "inventory", "isDead", "level", "locationId", "maxHp", "name", "perception", "statPoints", "strength", "superpower", "thirst", "updatedAt", "vitality", "xp") SELECT "accountId", "agility", "createdAt", "discoveredLore", "discoveredMobs", "equippedArmor", "equippedWeapon", "fatigue", "hp", "hunger", "id", "inventory", "isDead", "level", "locationId", "maxHp", "name", "perception", "statPoints", "strength", "superpower", "thirst", "updatedAt", "vitality", "xp" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE INDEX "Character_accountId_idx" ON "Character"("accountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Shelter_ownerId_key" ON "Shelter"("ownerId");
