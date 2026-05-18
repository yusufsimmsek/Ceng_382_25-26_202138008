PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
    "ProductVersion" TEXT NOT NULL
);
INSERT INTO __EFMigrationsHistory VALUES('20260518084350_InitialCreate','8.0.27');
CREATE TABLE IF NOT EXISTS "AspNetRoles" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_AspNetRoles" PRIMARY KEY,
    "Name" TEXT NULL,
    "NormalizedName" TEXT NULL,
    "ConcurrencyStamp" TEXT NULL
);
INSERT INTO AspNetRoles VALUES('29165214-5801-44fa-a58d-889a54fdd9eb','Admin','ADMIN',NULL);
INSERT INTO AspNetRoles VALUES('928781f2-537b-44cc-b8e3-6e684a781e59','Caterer','CATERER',NULL);
INSERT INTO AspNetRoles VALUES('759f17dd-c5fb-498f-bfb9-19e03ed0f71d','User','USER',NULL);
CREATE TABLE IF NOT EXISTS "AspNetUsers" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_AspNetUsers" PRIMARY KEY,
    "FullName" TEXT NOT NULL,
    "Address" TEXT NULL,
    "Latitude" REAL NULL,
    "Longitude" REAL NULL,
    "CreatedAt" TEXT NOT NULL,
    "UserName" TEXT NULL,
    "NormalizedUserName" TEXT NULL,
    "Email" TEXT NULL,
    "NormalizedEmail" TEXT NULL,
    "EmailConfirmed" INTEGER NOT NULL,
    "PasswordHash" TEXT NULL,
    "SecurityStamp" TEXT NULL,
    "ConcurrencyStamp" TEXT NULL,
    "PhoneNumber" TEXT NULL,
    "PhoneNumberConfirmed" INTEGER NOT NULL,
    "TwoFactorEnabled" INTEGER NOT NULL,
    "LockoutEnd" TEXT NULL,
    "LockoutEnabled" INTEGER NOT NULL,
    "AccessFailedCount" INTEGER NOT NULL
);
INSERT INTO AspNetUsers VALUES('504ad9cb-f1c0-4980-9e85-935474018c3d','Sistem Yöneticisi',NULL,NULL,NULL,'2026-05-18 08:44:07.704307','admin@sofranet.com','ADMIN@SOFRANET.COM','admin@sofranet.com','ADMIN@SOFRANET.COM',1,'AQAAAAIAAYagAAAAEG/g70x5Lp15QjafcQgOfgyuWpLarRnImT8TikmKwJJwziwFvCfM8HzzVysLGMf67A==','VGM7NCRQS4S5CCHI6S6XL5KIMTUJKTPC','155a412f-7614-4a82-ab87-69bb4ee91ebb',NULL,0,0,NULL,1,0);
INSERT INTO AspNetUsers VALUES('6e1b4258-f782-4451-b25f-f559cfc4d8b3','Lezzet Mutfağı','Moda Cad. No:42, Kadıköy / İstanbul',40.99280000000000257,29.02639999999999887,'2026-05-18 08:44:07.77021','lezzet@sofranet.com','LEZZET@SOFRANET.COM','lezzet@sofranet.com','LEZZET@SOFRANET.COM',1,'AQAAAAIAAYagAAAAEMAYgZ9TL1zU0ERtyozCu2iyY9Q8bvtb7KsHaPwaWh9X94NVWUIz3tz/6C3BXAjnUA==','3JFGPZ2GOK2ZGOJCSJYSISJ3TYL5EZ2R','1d7afc25-449b-4bf6-9be3-c2a572a53852',NULL,0,0,NULL,1,0);
INSERT INTO AspNetUsers VALUES('eb8de06e-6933-4da2-8fdd-4044db7f1324','Mahalle Sofrası','Cihangir Mah. Sıraselviler Cad. No:11, Beyoğlu / İstanbul',41.03190000000000026,28.98059999999999903,'2026-05-18 08:44:07.801515','mahalle@sofranet.com','MAHALLE@SOFRANET.COM','mahalle@sofranet.com','MAHALLE@SOFRANET.COM',1,'AQAAAAIAAYagAAAAEGCoFfpj0KejyBSzWgRFodIVmHoTGQMBdoLSU8qy1qZ2DJg9QuYZ+BIvlTsX/C6ozg==','6U473V2DVUNAXPU4RXXQX67MNZROJO3N','186f20a7-91bb-4511-8bec-f63406726b6c',NULL,0,0,NULL,1,0);
INSERT INTO AspNetUsers VALUES('ab8bdfea-a469-4382-b521-8fe689670655','Ankara Gurme','Tunalı Hilmi Cad. No:88, Çankaya / Ankara',39.90339999999999777,32.86169999999999903,'2026-05-18 08:44:07.831679','ankaragurme@sofranet.com','ANKARAGURME@SOFRANET.COM','ankaragurme@sofranet.com','ANKARAGURME@SOFRANET.COM',1,'AQAAAAIAAYagAAAAEFsMKSJR7O7i8Au4xxzb1zM48/Cht4f9e+YQ3vhx+Q4z4lA1WyeoiXPmVU+w+zzrYA==','T562FKZBJPBYIHDESDTNR63754KACPKX','aafb8a60-2d35-495d-9eba-bc42c5af091f',NULL,0,0,NULL,1,0);
INSERT INTO AspNetUsers VALUES('412e8141-62de-4040-911e-29ec0f95fe06','Ali Yılmaz','Kadıköy / İstanbul',40.98469999999999657,29.03160000000000096,'2026-05-18 08:44:07.862802','ali@example.com','ALI@EXAMPLE.COM','ali@example.com','ALI@EXAMPLE.COM',1,'AQAAAAIAAYagAAAAEJfWU+tb12hhysSJKtlcqCiM+C0gqktjLXn9lr3motMT9N59Yrkxy67GEXPIE6gx7g==','Q2GYSSQCU42DPXILUGXTYALY7VXQ74YI','15228f35-0281-4a88-8cc6-17320421917c',NULL,0,0,NULL,1,1);
INSERT INTO AspNetUsers VALUES('38975dbb-cb81-4ce0-b2e9-6b5d74a4997d','Ayşe Demir','Beyoğlu / İstanbul',41.03699999999999904,28.98499999999999944,'2026-05-18 08:44:07.895532','ayse@example.com','AYSE@EXAMPLE.COM','ayse@example.com','AYSE@EXAMPLE.COM',1,'AQAAAAIAAYagAAAAEF2BPfE0ZRIvo9oqVl7+flkI8sUUiNx24OeUDANzcLduB0jABT2CHxWYxZPDuiXgkA==','67HP5Q24IRVH6SNITOIDJE52MQQG65V5','f563f3e4-974b-41e3-88c6-707868cd6271',NULL,0,0,NULL,1,0);
INSERT INTO AspNetUsers VALUES('5e17b2d3-53e8-4e9b-a5c5-8df98e31d217','Mehmet Kaya','Çankaya / Ankara',39.90800000000000125,32.85410000000000252,'2026-05-18 08:44:07.927734','mehmet@example.com','MEHMET@EXAMPLE.COM','mehmet@example.com','MEHMET@EXAMPLE.COM',1,'AQAAAAIAAYagAAAAEIVYng9UKu2bGxWNR6d+kpZlV6ZHuSIv3TGKz+SMvrKXGU+3Dwqilj3VqCyuQnsMkw==','ME2AI2X2CXZSUUA7X2ZNWD23YA6RF5ZR','f14638b9-069b-48c2-97dd-425a88c1f541',NULL,0,0,NULL,1,0);
INSERT INTO AspNetUsers VALUES('be7bff69-754d-4e85-8a4e-ed6825bdca92','Zeynep Şahin','Üsküdar / İstanbul',41.02139999999999987,29.01510000000000033,'2026-05-18 08:44:07.958426','zeynep@example.com','ZEYNEP@EXAMPLE.COM','zeynep@example.com','ZEYNEP@EXAMPLE.COM',1,'AQAAAAIAAYagAAAAEG/s+08SVYQSG0beg8okuJp/p3I1ZzvcvYAIJChJsliDKw2dIlzgMEcT0gnqfM0jww==','XZN2JDXZJDGLRBFGX4RD4SYSDT3KS22Y','e1b93a6c-6fab-4868-b747-0e85f7fe02cb',NULL,0,0,NULL,1,0);
INSERT INTO AspNetUsers VALUES('358da026-107b-478f-8a4a-6eb0d4128098','Can Aydın','Yenimahalle / Ankara',39.96500000000000342,32.78719999999999857,'2026-05-18 08:44:07.989323','can@example.com','CAN@EXAMPLE.COM','can@example.com','CAN@EXAMPLE.COM',1,'AQAAAAIAAYagAAAAEEahekbfsjmpFwAs9jgATiBFMCdpveCJBAMDXO709aSZX9nLjGvaD3d0DIVQM+Skcw==','YKPLX72JKXASZXKU6TPIFM3AXNDGLURP','cfd8775d-4a65-460f-8f0e-c4a5d6b3a1f4',NULL,0,0,NULL,1,0);
CREATE TABLE IF NOT EXISTS "AspNetRoleClaims" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY AUTOINCREMENT,
    "RoleId" TEXT NOT NULL,
    "ClaimType" TEXT NULL,
    "ClaimValue" TEXT NULL,
    CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "AspNetUserClaims" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AspNetUserClaims" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "ClaimType" TEXT NULL,
    "ClaimValue" TEXT NULL,
    CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "AspNetUserLogins" (
    "LoginProvider" TEXT NOT NULL,
    "ProviderKey" TEXT NOT NULL,
    "ProviderDisplayName" TEXT NULL,
    "UserId" TEXT NOT NULL,
    CONSTRAINT "PK_AspNetUserLogins" PRIMARY KEY ("LoginProvider", "ProviderKey"),
    CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "AspNetUserRoles" (
    "UserId" TEXT NOT NULL,
    "RoleId" TEXT NOT NULL,
    CONSTRAINT "PK_AspNetUserRoles" PRIMARY KEY ("UserId", "RoleId"),
    CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
INSERT INTO AspNetUserRoles VALUES('504ad9cb-f1c0-4980-9e85-935474018c3d','29165214-5801-44fa-a58d-889a54fdd9eb');
INSERT INTO AspNetUserRoles VALUES('6e1b4258-f782-4451-b25f-f559cfc4d8b3','928781f2-537b-44cc-b8e3-6e684a781e59');
INSERT INTO AspNetUserRoles VALUES('eb8de06e-6933-4da2-8fdd-4044db7f1324','928781f2-537b-44cc-b8e3-6e684a781e59');
INSERT INTO AspNetUserRoles VALUES('ab8bdfea-a469-4382-b521-8fe689670655','928781f2-537b-44cc-b8e3-6e684a781e59');
INSERT INTO AspNetUserRoles VALUES('412e8141-62de-4040-911e-29ec0f95fe06','759f17dd-c5fb-498f-bfb9-19e03ed0f71d');
INSERT INTO AspNetUserRoles VALUES('38975dbb-cb81-4ce0-b2e9-6b5d74a4997d','759f17dd-c5fb-498f-bfb9-19e03ed0f71d');
INSERT INTO AspNetUserRoles VALUES('5e17b2d3-53e8-4e9b-a5c5-8df98e31d217','759f17dd-c5fb-498f-bfb9-19e03ed0f71d');
INSERT INTO AspNetUserRoles VALUES('be7bff69-754d-4e85-8a4e-ed6825bdca92','759f17dd-c5fb-498f-bfb9-19e03ed0f71d');
INSERT INTO AspNetUserRoles VALUES('358da026-107b-478f-8a4a-6eb0d4128098','759f17dd-c5fb-498f-bfb9-19e03ed0f71d');
CREATE TABLE IF NOT EXISTS "AspNetUserTokens" (
    "UserId" TEXT NOT NULL,
    "LoginProvider" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Value" TEXT NULL,
    CONSTRAINT "PK_AspNetUserTokens" PRIMARY KEY ("UserId", "LoginProvider", "Name"),
    CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "LogEntries" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_LogEntries" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NULL,
    "Action" TEXT NOT NULL,
    "Details" TEXT NOT NULL,
    "IpAddress" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    CONSTRAINT "FK_LogEntries_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "MenuItems" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_MenuItems" PRIMARY KEY AUTOINCREMENT,
    "CatererId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Price" numeric(10,2) NOT NULL,
    "Description" text NULL,
    "ImagePath" TEXT NULL,
    "IsAvailable" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    CONSTRAINT "FK_MenuItems_AspNetUsers_CatererId" FOREIGN KEY ("CatererId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT
);
INSERT INTO MenuItems VALUES(1,'6e1b4258-f782-4451-b25f-f559cfc4d8b3','Lahmacun',60,'İnce hamur üzerinde özel kıymalı harç, taş fırında.','/images/menu/lahmacun.jpg',1,'2026-05-18 08:44:08.030106','2026-05-18 08:44:08.030106');
INSERT INTO MenuItems VALUES(2,'6e1b4258-f782-4451-b25f-f559cfc4d8b3','Adana Dürüm',180,'Acılı kıyma kebabı, lavaşta sarılmış.','/images/menu/adana-durum.jpg',1,'2026-05-18 08:44:08.030275','2026-05-18 08:44:08.030275');
INSERT INTO MenuItems VALUES(3,'6e1b4258-f782-4451-b25f-f559cfc4d8b3','Künefe',130,'Tel kadayıf arasında peynir, üzerine şerbet ve fıstık.','/images/menu/kunefe.jpg',1,'2026-05-18 08:44:08.030276','2026-05-18 08:44:08.030276');
INSERT INTO MenuItems VALUES(4,'6e1b4258-f782-4451-b25f-f559cfc4d8b3','Kıymalı Pide',140,'El açması hamur, taze kıyma, biber, taş fırın.','/images/menu/kiymali-pide.jpg',1,'2026-05-18 08:44:08.030277','2026-05-18 08:44:08.030277');
INSERT INTO MenuItems VALUES(5,'eb8de06e-6933-4da2-8fdd-4044db7f1324','Kuru Fasulye',120,'Etli kuru fasulye, salça ve tereyağı ile.','/images/menu/kuru-fasulye.jpg',1,'2026-05-18 08:44:08.04822','2026-05-18 08:44:08.04822');
INSERT INTO MenuItems VALUES(6,'eb8de06e-6933-4da2-8fdd-4044db7f1324','Mantı',150,'El açması mantı, yoğurt ve tereyağlı sos.','/images/menu/manti.jpg',1,'2026-05-18 08:44:08.048221','2026-05-18 08:44:08.048221');
INSERT INTO MenuItems VALUES(7,'eb8de06e-6933-4da2-8fdd-4044db7f1324','İçli Köfte (4 adet)',110,'Bulgur ve iç harç, kızartma.','/images/menu/icli-kofte.jpg',1,'2026-05-18 08:44:08.048222','2026-05-18 08:44:08.048222');
INSERT INTO MenuItems VALUES(8,'eb8de06e-6933-4da2-8fdd-4044db7f1324','Fırın Sütlaç',70,'Geleneksel fırın sütlaç, üzeri karamelize.','/images/menu/firin-sutlac.jpg',1,'2026-05-18 08:44:08.048222','2026-05-18 08:44:08.048222');
INSERT INTO MenuItems VALUES(9,'ab8bdfea-a469-4382-b521-8fe689670655','Tavuk Döner Porsiyon',170,'Pilav üstü tavuk döner, közlenmiş biber.','/images/menu/tavuk-doner.jpg',1,'2026-05-18 08:44:08.04834','2026-05-18 08:44:08.04834');
INSERT INTO MenuItems VALUES(10,'ab8bdfea-a469-4382-b521-8fe689670655','İskender',220,'Pide üzerinde döner, tereyağı, domates sos, yoğurt.','/images/menu/iskender.jpg',1,'2026-05-18 08:44:08.048341','2026-05-18 08:44:08.048341');
INSERT INTO MenuItems VALUES(11,'ab8bdfea-a469-4382-b521-8fe689670655','Beyti',200,'Sarma kebap, yoğurt ve domates sos.','/images/menu/beyti.jpg',1,'2026-05-18 08:44:08.048341','2026-05-18 08:44:08.048341');
CREATE TABLE IF NOT EXISTS "Orders" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Orders" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "CatererId" TEXT NOT NULL,
    "TotalAmount" numeric(10,2) NOT NULL,
    "Status" TEXT NOT NULL,
    "PaymentStatus" TEXT NOT NULL,
    "DeliveryAddress" text NULL,
    "DeliveryLat" REAL NULL,
    "DeliveryLng" REAL NULL,
    "CreatedAt" TEXT NOT NULL,
    "CompletedAt" TEXT NULL,
    CONSTRAINT "FK_Orders_AspNetUsers_CatererId" FOREIGN KEY ("CatererId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Orders_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "OptionGroups" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_OptionGroups" PRIMARY KEY AUTOINCREMENT,
    "MenuItemId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "IsRequired" INTEGER NOT NULL,
    "MinSelect" INTEGER NOT NULL,
    "MaxSelect" INTEGER NOT NULL,
    CONSTRAINT "FK_OptionGroups_MenuItems_MenuItemId" FOREIGN KEY ("MenuItemId") REFERENCES "MenuItems" ("Id") ON DELETE CASCADE
);
INSERT INTO OptionGroups VALUES(1,1,'Sos',0,0,2);
INSERT INTO OptionGroups VALUES(2,2,'Acılık',1,1,1);
INSERT INTO OptionGroups VALUES(3,2,'Garnitür',0,0,3);
INSERT INTO OptionGroups VALUES(4,3,'Yanında',0,0,1);
INSERT INTO OptionGroups VALUES(5,5,'Yanında',1,1,2);
INSERT INTO OptionGroups VALUES(6,9,'Sos',0,0,2);
INSERT INTO OptionGroups VALUES(7,10,'Porsiyon',1,1,1);
CREATE TABLE IF NOT EXISTS "RemovableIngredients" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_RemovableIngredients" PRIMARY KEY AUTOINCREMENT,
    "MenuItemId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    CONSTRAINT "FK_RemovableIngredients_MenuItems_MenuItemId" FOREIGN KEY ("MenuItemId") REFERENCES "MenuItems" ("Id") ON DELETE CASCADE
);
INSERT INTO RemovableIngredients VALUES(1,1,'Soğan');
INSERT INTO RemovableIngredients VALUES(2,1,'Maydanoz');
INSERT INTO RemovableIngredients VALUES(3,1,'Domates');
INSERT INTO RemovableIngredients VALUES(4,2,'Soğan');
INSERT INTO RemovableIngredients VALUES(5,4,'Biber');
INSERT INTO RemovableIngredients VALUES(6,4,'Soğan');
INSERT INTO RemovableIngredients VALUES(7,6,'Sarımsak');
INSERT INTO RemovableIngredients VALUES(8,6,'Nane');
INSERT INTO RemovableIngredients VALUES(9,11,'Sarımsak');
CREATE TABLE IF NOT EXISTS "OrderItems" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_OrderItems" PRIMARY KEY AUTOINCREMENT,
    "OrderId" INTEGER NOT NULL,
    "MenuItemId" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "ItemPrice" numeric(10,2) NOT NULL,
    "CustomizationExtra" numeric(10,2) NOT NULL,
    CONSTRAINT "FK_OrderItems_MenuItems_MenuItemId" FOREIGN KEY ("MenuItemId") REFERENCES "MenuItems" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_OrderItems_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "Ratings" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Ratings" PRIMARY KEY AUTOINCREMENT,
    "OrderId" INTEGER NOT NULL,
    "UserId" TEXT NOT NULL,
    "MenuItemId" INTEGER NULL,
    "CatererId" TEXT NOT NULL,
    "MenuRating" INTEGER NOT NULL,
    "CatererRating" INTEGER NOT NULL,
    "Comment" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    CONSTRAINT "FK_Ratings_AspNetUsers_CatererId" FOREIGN KEY ("CatererId") REFERENCES "AspNetUsers" ("Id"),
    CONSTRAINT "FK_Ratings_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Ratings_MenuItems_MenuItemId" FOREIGN KEY ("MenuItemId") REFERENCES "MenuItems" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Ratings_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "MenuOptions" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_MenuOptions" PRIMARY KEY AUTOINCREMENT,
    "GroupId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "ExtraPrice" numeric(10,2) NOT NULL,
    CONSTRAINT "FK_MenuOptions_OptionGroups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "OptionGroups" ("Id") ON DELETE CASCADE
);
INSERT INTO MenuOptions VALUES(1,1,'Acı Sos',0);
INSERT INTO MenuOptions VALUES(2,1,'Sumak',0);
INSERT INTO MenuOptions VALUES(3,1,'Limon',0);
INSERT INTO MenuOptions VALUES(4,2,'Az Acılı',0);
INSERT INTO MenuOptions VALUES(5,2,'Orta',0);
INSERT INTO MenuOptions VALUES(6,2,'Çok Acılı',0);
INSERT INTO MenuOptions VALUES(7,3,'Bulgur Pilavı',25);
INSERT INTO MenuOptions VALUES(8,3,'Patates Kızartması',30);
INSERT INTO MenuOptions VALUES(9,3,'Közlenmiş Biber',15);
INSERT INTO MenuOptions VALUES(10,4,'Dondurma',25);
INSERT INTO MenuOptions VALUES(11,4,'Kaymak',20);
INSERT INTO MenuOptions VALUES(12,5,'Pilav',20);
INSERT INTO MenuOptions VALUES(13,5,'Bulgur Pilavı',20);
INSERT INTO MenuOptions VALUES(14,5,'Turşu',15);
INSERT INTO MenuOptions VALUES(15,6,'Mayonez',5);
INSERT INTO MenuOptions VALUES(16,6,'Ketçap',5);
INSERT INTO MenuOptions VALUES(17,6,'Acı Sos',5);
INSERT INTO MenuOptions VALUES(18,7,'Yarım',0);
INSERT INTO MenuOptions VALUES(19,7,'Tam',60);
CREATE TABLE IF NOT EXISTS "OrderItemRemovals" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_OrderItemRemovals" PRIMARY KEY AUTOINCREMENT,
    "OrderItemId" INTEGER NOT NULL,
    "RemovableIngredientId" INTEGER NOT NULL,
    CONSTRAINT "FK_OrderItemRemovals_OrderItems_OrderItemId" FOREIGN KEY ("OrderItemId") REFERENCES "OrderItems" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_OrderItemRemovals_RemovableIngredients_RemovableIngredientId" FOREIGN KEY ("RemovableIngredientId") REFERENCES "RemovableIngredients" ("Id") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "OrderItemOptions" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_OrderItemOptions" PRIMARY KEY AUTOINCREMENT,
    "OrderItemId" INTEGER NOT NULL,
    "OptionId" INTEGER NOT NULL,
    CONSTRAINT "FK_OrderItemOptions_MenuOptions_OptionId" FOREIGN KEY ("OptionId") REFERENCES "MenuOptions" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_OrderItemOptions_OrderItems_OrderItemId" FOREIGN KEY ("OrderItemId") REFERENCES "OrderItems" ("Id") ON DELETE CASCADE
);
INSERT INTO sqlite_sequence VALUES('MenuItems',11);
INSERT INTO sqlite_sequence VALUES('OptionGroups',7);
INSERT INTO sqlite_sequence VALUES('RemovableIngredients',9);
INSERT INTO sqlite_sequence VALUES('MenuOptions',19);
INSERT INTO sqlite_sequence VALUES('LogEntries',40);
INSERT INTO sqlite_sequence VALUES('Orders',1);
INSERT INTO sqlite_sequence VALUES('OrderItems',1);
INSERT INTO sqlite_sequence VALUES('OrderItemOptions',1);
INSERT INTO sqlite_sequence VALUES('OrderItemRemovals',1);
INSERT INTO sqlite_sequence VALUES('Ratings',1);
CREATE INDEX "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" ("RoleId");
CREATE UNIQUE INDEX "RoleNameIndex" ON "AspNetRoles" ("NormalizedName");
CREATE INDEX "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" ("UserId");
CREATE INDEX "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" ("UserId");
CREATE INDEX "IX_AspNetUserRoles_RoleId" ON "AspNetUserRoles" ("RoleId");
CREATE INDEX "EmailIndex" ON "AspNetUsers" ("NormalizedEmail");
CREATE UNIQUE INDEX "UserNameIndex" ON "AspNetUsers" ("NormalizedUserName");
CREATE INDEX "IX_LogEntries_Action" ON "LogEntries" ("Action");
CREATE INDEX "IX_LogEntries_CreatedAt" ON "LogEntries" ("CreatedAt");
CREATE INDEX "IX_LogEntries_UserId" ON "LogEntries" ("UserId");
CREATE INDEX "IX_MenuItems_CatererId" ON "MenuItems" ("CatererId");
CREATE INDEX "IX_MenuOptions_GroupId" ON "MenuOptions" ("GroupId");
CREATE INDEX "IX_OptionGroups_MenuItemId" ON "OptionGroups" ("MenuItemId");
CREATE INDEX "IX_OrderItemOptions_OptionId" ON "OrderItemOptions" ("OptionId");
CREATE INDEX "IX_OrderItemOptions_OrderItemId" ON "OrderItemOptions" ("OrderItemId");
CREATE INDEX "IX_OrderItemRemovals_OrderItemId" ON "OrderItemRemovals" ("OrderItemId");
CREATE INDEX "IX_OrderItemRemovals_RemovableIngredientId" ON "OrderItemRemovals" ("RemovableIngredientId");
CREATE INDEX "IX_OrderItems_MenuItemId" ON "OrderItems" ("MenuItemId");
CREATE INDEX "IX_OrderItems_OrderId" ON "OrderItems" ("OrderId");
CREATE INDEX "IX_Orders_CatererId" ON "Orders" ("CatererId");
CREATE INDEX "IX_Orders_CreatedAt" ON "Orders" ("CreatedAt");
CREATE INDEX "IX_Orders_Status" ON "Orders" ("Status");
CREATE INDEX "IX_Orders_UserId" ON "Orders" ("UserId");
CREATE INDEX "IX_Ratings_CatererId" ON "Ratings" ("CatererId");
CREATE INDEX "IX_Ratings_MenuItemId" ON "Ratings" ("MenuItemId");
CREATE UNIQUE INDEX "IX_Ratings_OrderId" ON "Ratings" ("OrderId");
CREATE INDEX "IX_Ratings_UserId" ON "Ratings" ("UserId");
CREATE INDEX "IX_RemovableIngredients_MenuItemId" ON "RemovableIngredients" ("MenuItemId");
COMMIT;
