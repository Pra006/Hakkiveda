import Link from "next/link";
import StorefrontShell from "@/components/layout/StorefrontShell";
import { Section, SectionHeader } from "@/components/ui/Section";
import Icon from "@/components/ui/Icon";
import prisma from "@/lib/prisma";

export const metadata = { title: "Blog — Hakkiveda" };
export const dynamic = "force-dynamic";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80";

export default async function BlogListingPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      featuredImage: true,
      excerpt: true,
      category: true,
      author: true,
      publishedAt: true,
    },
  });

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";

  return (
    <StorefrontShell>
      <Section className="py-6">
        <nav className="text-xs text-on-surface-variant flex items-center gap-1.5">
          <Link href="/" className="hover:text-forest-deep">Home</Link>
          <Icon name="chevron_right" size={14} />
          <span className="text-forest-deep font-semibold">Blog</span>
        </nav>
      </Section>

      <Section className="pb-16">
        <SectionHeader
          eyebrow="From the Journal"
          title="Stories, traditions & wisdom from Nepal."
        />

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blogs/${post.slug}`}
                className="group bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[16/10] overflow-hidden bg-surface-container-low">
                  <img
                    src={post.featuredImage || PLACEHOLDER}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  {post.category && (
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-antique-gold">
                      {post.category}
                    </span>
                  )}
                  <h3 className="font-headline text-lg text-forest-deep mt-1 mb-2 line-clamp-2 group-hover:text-forest-base transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    {post.author && (
                      <span className="flex items-center gap-1">
                        <Icon name="person" size={13} />
                        {post.author}
                      </span>
                    )}
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Icon name="calendar_today" size={13} />
                        {fmtDate(post.publishedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Icon name="article" size={48} className="text-outline-variant mx-auto mb-3" />
            <p className="text-on-surface-variant">
              No articles published yet. Check back soon!
            </p>
          </div>
        )}
      </Section>
    </StorefrontShell>
  );
}
