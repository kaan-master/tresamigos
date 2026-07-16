import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const site = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    if (!site) throw new Error("no site settings");

    const story =
      site.ourStory && typeof site.ourStory === "object" && !Array.isArray(site.ourStory)
        ? { ...(site.ourStory as Record<string, unknown>) }
        : {};

    story.sideImage = "assets/brand/best-in-amsterdam.mp4";

    await prisma.siteSettings.update({
      where: { id: "default" },
      data: { ourStory: story as object }
    });

    console.log("Updated ourStory.sideImage ->", story.sideImage);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
