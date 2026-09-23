/**
 * Seed a sample blog post about Hakkiveda hair oil.
 * Run: node prisma/seed-blog.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const post = await prisma.blogPost.upsert({
    where: { slug: "the-ancient-art-of-ayurvedic-hair-oiling-why-hakkivedas-maha-bhringraj-oil-is-different" },
    update: {},
    create: {
      title: "The Ancient Art of Ayurvedic Hair Oiling: Why Hakkiveda's Maha Bhringraj Oil Is Different",
      slug: "the-ancient-art-of-ayurvedic-hair-oiling-why-hakkivedas-maha-bhringraj-oil-is-different",
      featuredImage: null,
      excerpt:
        "For centuries, families across Nepal have gathered wild Bhringraj from the middle hills and slow-cooked it into potent hair oils using bronze kansa cauldrons. Discover how this living tradition shapes every bottle of Hakkiveda Maha Bhringraj Hair Oil.",
      content: `Long before commercial shampoos and synthetic serums lined store shelves, the people of the Himalayan foothills had a simple, powerful ritual for healthy hair — Ayurvedic hair oiling. In Nepal, this practice has been passed down through generations, rooted in the wisdom of Ayurveda and the incredible biodiversity of the region's wild botanicals.

At Hakkiveda, we honour that tradition. Our Maha Bhringraj Hair Oil is not a modern lab formulation — it is a classical Vedic recipe, slow-crafted over 21 days using methods that have remained unchanged for centuries.

What Makes Bhringraj the "King of Hair"?

Bhringraj (Eclipta alba), known in Sanskrit as Kesharaja — literally "king of hair" — is the most revered herb in Ayurvedic hair care. Modern research has begun to validate what Ayurvedic practitioners have known for millennia: Bhringraj promotes hair growth, reduces hair fall, and nourishes the scalp at a cellular level.

But not all Bhringraj oils are created equal. Most commercial brands use Bhringraj extract diluted in mineral oil and manufactured in hours. The result is a fraction of the herb's true potency.

How Hakkiveda's Oil Is Made

Our process begins in the middle hills of Nepal, where family cooperatives hand-harvest wild Bhringraj, Amla, Brahmi, Manjistha, Neem, and over 25 other rare Himalayan botanicals during their peak season.

These herbs are then slow-infused into cold-pressed sesame oil — a classical Ayurvedic carrier known for its deep penetration and Pitta-calming properties — inside traditional kansa (bronze) cauldrons. The oil simmers gently for 21 days, allowing each herb's active compounds to fully release into the carrier.

No heat extraction. No chemical processing. No synthetic preservatives.

The result is a dark, aromatic oil that carries the full spectrum of these botanicals — exactly as Ayurvedic texts intended it.

The Benefits You Can Expect

When massaged into the scalp weekly, Maha Bhringraj Hair Oil works on multiple levels:

Nourishes hair roots — The herb-infused sesame base delivers nutrients directly to the follicle, strengthening hair from within.

Reduces hair fall — Bhringraj and Amla work together to anchor hair at the root and reduce breakage.

Calms Pitta dosha — In Ayurveda, excess heat (Pitta) in the scalp is a primary cause of premature greying and thinning. Bhringraj is one of the most powerful Pitta-pacifying herbs.

Promotes dense, glossy growth — Brahmi improves blood circulation to the scalp, while Manjistha purifies and rejuvenates the skin tissue beneath.

Soothes the mind — The ritual of warm oil massage (Shiro Abhyanga) calms the nervous system, improves sleep, and reduces stress — one of the most overlooked causes of hair loss.

How to Use It

Warm a tablespoon of oil by placing the bottle in warm water for a few minutes. Part your hair into sections and apply the oil directly to the scalp using your fingertips. Massage in gentle circular motions for five to ten minutes, working from the crown outward.

Leave the oil on for at least 30 minutes — or, for the deepest nourishment, overnight on a silk pillowcase. Wash out with a mild, sulfate-free shampoo.

For best results, repeat once or twice a week.

Why It Matters Where Your Oil Comes From

Nepal's middle hills sit between 1,000 and 3,000 metres — a unique altitude band where wild medicinal plants grow in mineral-rich soil, watered by Himalayan snowmelt, and exposed to intense UV light. These conditions produce botanicals with exceptionally high concentrations of active compounds.

When you choose Hakkiveda, you are not just buying a hair oil. You are supporting the family cooperatives who sustainably harvest these wild herbs, preserving both the biodiversity of the Himalayan foothills and the living Ayurvedic knowledge of the communities who have tended them for generations.

Every bottle tells a story — from the hills of Nepal to your daily self-care ritual.`,
      category: "Ayurveda",
      author: "Hakkiveda Team",
      tags: ["hair oil", "Bhringraj", "Ayurveda", "hair care", "natural", "Nepal", "wellness"],
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  console.log("Blog post created:", post.title, "(id:", post.id + ")");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
