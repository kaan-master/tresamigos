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
    const ig =
      site.instagramFeed && typeof site.instagramFeed === "object" && !Array.isArray(site.instagramFeed)
        ? { ...(site.instagramFeed as Record<string, unknown>) }
        : {};
    const vacancy =
      site.vacancyRoles && typeof site.vacancyRoles === "object" && !Array.isArray(site.vacancyRoles)
        ? { ...(site.vacancyRoles as Record<string, unknown>) }
        : {};

    story.sideImage = "assets/brand/Tres Amigos sfeervideo (1).mp4";

    if (Array.isArray(ig.posts)) {
      ig.posts = ig.posts.map((post) => {
        const row = post as Record<string, unknown>;
        const image = String(row.image || "");
        if (image.includes("eat-like-a-mexican")) {
          return { ...row, image: "assets/brand/streetfood-secret.mp4", isVideo: true };
        }
        if (image.includes("home-card")) {
          return { ...row, image: "assets/brand/mega-burrito.mp4", isVideo: true };
        }
        return row;
      });
    }

    if (typeof vacancy.formImage === "string" && vacancy.formImage.includes("home-card")) {
      vacancy.formImage = "assets/brand/mega-burrito.mp4";
    }
    if (typeof vacancy.formImage === "string" && vacancy.formImage.includes("eat-like-a-mexican")) {
      vacancy.formImage = "assets/brand/streetfood-secret.mp4";
    }

    if (Array.isArray(vacancy.jobs)) {
      vacancy.jobs = vacancy.jobs.map((job) => {
        const row = job as Record<string, unknown>;
        const image = String(row.image || "");
        if (image.includes("home-card")) {
          return { ...row, image: "assets/brand/mega-burrito.mp4" };
        }
        if (image.includes("eat-like-a-mexican")) {
          return { ...row, image: "assets/brand/streetfood-secret.mp4" };
        }
        return row;
      });
    }

    await prisma.siteSettings.update({
      where: { id: "default" },
      data: {
        ourStory: story as object,
        instagramFeed: ig as object,
        vacancyRoles: vacancy as object
      }
    });

    console.log("Updated sideImage:", story.sideImage);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
