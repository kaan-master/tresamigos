import { PrismaClient } from "@prisma/client";

const NEW_VIDEOS = [
  {
    id: "streetfood-secret",
    title: "Streetfood secret",
    caption: "Amsterdam’s best kept streetfood secret.",
    src: "assets/brand/streetfood-secret.mp4"
  },
  {
    id: "best-in-amsterdam",
    title: "Best in Amsterdam",
    caption: "The best Mexican street food in Amsterdam.",
    src: "assets/brand/best-in-amsterdam.mp4"
  },
  {
    id: "mega-burrito",
    title: "MEGA burrito",
    caption: "De allerlekkerste MEGA burrito in Amsterdam.",
    src: "assets/brand/mega-burrito.mp4"
  },
  {
    id: "catering-event",
    title: "Catering",
    caption: "Perfect voor babyshower, verjaardag of event.",
    src: "assets/brand/catering-event.mp4"
  }
] as const;

const IG_POSTS = NEW_VIDEOS.map((video, index) => ({
  id: `ig-${index + 1}`,
  image: video.src,
  url: "https://www.instagram.com/tresamigosamsterdam/",
  caption: video.caption,
  active: true,
  isVideo: true
}));

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.video.deleteMany({});
    for (const [index, video] of NEW_VIDEOS.entries()) {
      await prisma.video.create({
        data: {
          id: video.id,
          title: video.title,
          caption: video.caption,
          src: video.src,
          active: true,
          sortOrder: index
        }
      });
    }

    const site = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    if (!site) throw new Error("no site settings");

    const story =
      site.ourStory && typeof site.ourStory === "object" && !Array.isArray(site.ourStory)
        ? { ...(site.ourStory as Record<string, unknown>) }
        : {};
    story.sideImage = "assets/brand/best-in-amsterdam.mp4";

    const ig =
      site.instagramFeed && typeof site.instagramFeed === "object" && !Array.isArray(site.instagramFeed)
        ? { ...(site.instagramFeed as Record<string, unknown>) }
        : {};
    ig.posts = IG_POSTS;

    await prisma.siteSettings.update({
      where: { id: "default" },
      data: {
        ourStory: story as object,
        instagramFeed: ig as object
      }
    });

    console.log(
      JSON.stringify(
        {
          videos: NEW_VIDEOS.map((v) => v.id),
          storySide: story.sideImage,
          igPosts: IG_POSTS.map((p) => p.image)
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
