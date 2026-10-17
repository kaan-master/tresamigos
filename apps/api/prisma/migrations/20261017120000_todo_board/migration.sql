-- To do board, copied from the OfferteCRM task board.

CREATE TABLE "TodoBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grouped" BOOLEAN NOT NULL DEFAULT false,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "columns" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TodoBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TodoCategory" (
    "id" TEXT NOT NULL,
    "boardId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TodoCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TodoCustomer" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TodoCustomer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TodoTask" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "customerId" TEXT,
    "assigneeId" TEXT,
    "startDate" DATE,
    "dueDate" DATE,
    "includeInAgenda" BOOLEAN NOT NULL DEFAULT false,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TodoTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TodoAssignee" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TodoAssignee_pkey" PRIMARY KEY ("taskId","userId")
);

CREATE TABLE "TodoComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TodoComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TodoFile" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TodoFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TodoBoard_sortOrder_idx" ON "TodoBoard"("sortOrder");
CREATE INDEX "TodoCategory_boardId_sortOrder_idx" ON "TodoCategory"("boardId", "sortOrder");
CREATE INDEX "TodoCustomer_companyName_idx" ON "TodoCustomer"("companyName");
CREATE INDEX "TodoTask_boardId_sortOrder_idx" ON "TodoTask"("boardId", "sortOrder");
CREATE INDEX "TodoTask_categoryId_idx" ON "TodoTask"("categoryId");
CREATE INDEX "TodoTask_customerId_idx" ON "TodoTask"("customerId");
CREATE INDEX "TodoTask_assigneeId_idx" ON "TodoTask"("assigneeId");
CREATE INDEX "TodoAssignee_userId_idx" ON "TodoAssignee"("userId");
CREATE INDEX "TodoComment_taskId_createdAt_idx" ON "TodoComment"("taskId", "createdAt");
CREATE INDEX "TodoFile_taskId_createdAt_idx" ON "TodoFile"("taskId", "createdAt");

ALTER TABLE "TodoCategory" ADD CONSTRAINT "TodoCategory_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TodoBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TodoTask" ADD CONSTRAINT "TodoTask_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TodoBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TodoTask" ADD CONSTRAINT "TodoTask_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TodoCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TodoTask" ADD CONSTRAINT "TodoTask_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "TodoCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TodoTask" ADD CONSTRAINT "TodoTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TodoAssignee" ADD CONSTRAINT "TodoAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TodoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TodoAssignee" ADD CONSTRAINT "TodoAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TodoComment" ADD CONSTRAINT "TodoComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TodoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TodoComment" ADD CONSTRAINT "TodoComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TodoFile" ADD CONSTRAINT "TodoFile_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TodoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TodoFile" ADD CONSTRAINT "TodoFile_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "AdminUser"
SET permissions = array_append(permissions, 'todo')
WHERE NOT ('todo' = ANY(permissions));
