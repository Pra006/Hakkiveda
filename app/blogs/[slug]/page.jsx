import Link from "next/link";
import { notFound } from "next/navigation";
import StorefrontShell from "@/components/layout/StorefrontShell";
import { Section } from "@/components/ui/Section";
import Icon from "@/components/ui/Icon";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, excerpt: true },
  });
  if (!post) return { title: "Blog Post" };
  return {
    title: `${post.title} — Hakkiveda Blog`,
    description: post.excerpt || undefined,
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
  });

  if (!post) return notFound();

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";

  // Get related posts (same category, excluding current)
  const related = post.category
    ? await prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          category: post.category,
          NOT: { id: post.id },
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: { title: true, slug: true, featuredImage: true, category: true, publishedAt: true },
      })
    : [];

  return (
    <StorefrontShell>
      {/* Hero */}
      <section className="relative h-64 sm:h-80 overflow-hidden bg-forest-deep">
        <img
          src={post.featuredImage || PLACEHOLDER}
          alt=""
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/50 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 pb-8">
            <nav className="text-xs text-earth-sand/80 flex items-center gap-1.5 mb-3">
              <Link href="/" className="hover:text-antique-gold">Home</Link>
              <Icon name="chevron_right" size={14} />
              <Link href="/blogs" className="hover:text-antique-gold">Blog</Link>
              <Icon name="chevron_right" size={14} />
              <span className="text-antique-gold font-semibold truncate max-w-[200px]">{post.title}</span>
            </nav>
            {post.category && (
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-antique-gold bg-forest-base/80 px-2.5 py-0.5 rounded mb-3">
                {post.category}
              </span>
            )}
            <h1 className="font-headline text-3xl sm:text-5xl text-ivory-canvas leading-tight max-w-3xl">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-earth-sand/80">
              {post.author && (
                <span className="flex items-center gap-1.5">
                  <Icon name="person" size={16} />
                  {post.author}
                </span>
              )}
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Icon name="calendar_today" size={16} />
                  {fmtDate(post.publishedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <Section className="py-10">
        <div className="max-w-3xl mx-auto">
          {post.excerpt && (
            <p className="text-lg text-on-surface-variant italic border-l-4 border-antique-gold/40 pl-5 mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <article className="prose prose-slate prose-lg max-w-none whitespace-pre-wrap text-on-surface leading-relaxed">
            {post.content}
          </article>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-outline-variant">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon name="sell" size={16} className="text-on-surface-variant" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-surface-container-low border border-outline-variant rounded-full text-xs text-forest-deep font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back */}
          <div className="mt-10">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-forest-deep hover:text-antique-gold transition-colors"
            >
              <Icon name="arrow_back" size={16} />
              Back to all articles
            </Link>
          </div>
        </div>
      </Section>

      {/* Related */}
      {related.length > 0 && (
        <Section className="pb-16">
          <div className="border-t border-outline-variant pt-10">
            <h2 className="font-headline text-2xl text-forest-deep mb-6">More in {post.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blogs/${r.slug}`}
                  className="group bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-surface-container-low">
                    <img
                      src={r.featuredImage || PLACEHOLDER}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-headline text-sm text-forest-deep line-clamp-2 group-hover:text-forest-base transition-colors">
                      {r.title}
                    </h3>
                    {r.publishedAt && (
                      <p className="text-xs text-on-surface-variant mt-1">
                        {new Date(r.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}
    </StorefrontShell>
  );
}
