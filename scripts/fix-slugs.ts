import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function main() {
  const links = await prisma.link.findMany({
    where: {
      slug: null,
    },
  });

  console.log(`Found ${links.length} links without slugs.`);

  for (const link of links) {
    let slug = slugify(link.title);
    
    // Check for collisions
    const existing = await prisma.link.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
    }

    await prisma.link.update({
      where: { id: link.id },
      data: { slug },
    });
    console.log(`Updated link ${link.id} with slug: ${slug}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
