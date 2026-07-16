import { PrismaClient } from "@prisma/client";

const HERO_VIDEOS = [
  {
    id: "beef-tacos",
    title: "Beef tacos",
    caption: "Zachte tortillas, pulled beef en frisse toppings.",
    src: "assets/brand/Beef tacos TA.mp4"
  },
  {
    id: "sfeervideo",
    title: "Tres Amigos sfeer",
    caption: "Een korte blik op de energie achter de toonbank.",
    src: "assets/brand/Tres Amigos sfeervideo (1).mp4"
  },
  {
    id: "fresh-kitchen",
    title: "Fresh from the kitchen",
    caption: "Casual, vers en snel klaar voor je bestelling.",
    src: "assets/brand/Tres amigos vid 5.mp4"
  }
] as const;

const BRAND_VIDEOS = [
  {
    id: "ig-1",
    image: "assets/brand/streetfood-secret.mp4",
    caption: "Amsterdam’s best kept streetfood secret"
  },
  {
    id: "ig-2",
    image: "assets/brand/best-in-amsterdam.mp4",
    caption: "The best in Amsterdam"
  },
  {
    id: "ig-3",
    image: "assets/brand/mega-burrito.mp4",
    caption: "MEGA burrito in Amsterdam"
  },
  {
    id: "ig-4",
    image: "assets/brand/catering-event.mp4",
    caption: "Catering for your next event"
  }
] as const;

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.video.deleteMany({});
    for (const [index, video] of HERO_VIDEOS.entries()) {
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
    ig.posts = BRAND_VIDEOS.map((post) => ({
      ...post,
      url: "https://www.instagram.com/tresamigosamsterdam/",
      active: true,
      isVideo: true
    }));

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
          heroVideos: HERO_VIDEOS.map((v) => v.id),
          storySide: story.sideImage,
          ig: BRAND_VIDEOS.map((p) => p.image)
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
