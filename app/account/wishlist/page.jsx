import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatNPR } from "@/lib/utils";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import WishlistRemoveButton from "@/components/account/WishlistRemoveButton";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/account/wishlist");

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  let items = [];
  if (customer) {
    const wishlist = await prisma.customerWishlist.findUnique({
      where: { customerId: customer.id },
    });
    if (wishlist) {
      items = await prisma.customerWishlistItem.findMany({
        where: { wishlistId: wishlist.id },
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, images: true,
              retailPrice: true, compareAt: true, isActive: true, stock: true,
            },
          },
        },
        orderBy: { addedAt: "desc" },
      });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl text-forest-deep">Wishlist</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {items.length === 0 ? "No items saved" : `${items.length} item${items.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>
        <Button as={Link} href="/shop" variant="secondary" size="sm">
          <Icon name="shopping_bag" size={16} /> Browse shop
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-center px-6 py-16">
          <Icon name="favorite" size={48} className="text-outline-variant mx-auto mb-4" />
          <h2 className="font-headline text-xl text-forest-deep">Your wishlist is empty</h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
            Save products you love and come back to them later.
          </p>
          <Button as={Link} href="/shop" className="mt-6">
            Start shopping
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ id, product }) => {
            const image = product.images?.[0];
            const outOfStock = product.stock <= 0;
            return (
              <div
                key={id}
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden group"
              >
                <Link href={product.isActive ? `/products/${product.slug}` : "#"} className="block relative">
                  {image ? (
                    <img src={image} alt={product.name} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-surface-container flex items-center justify-center">
                      <Icon name="image" size={40} className="text-on-surface-variant/20" />
                    </div>
                  )}
                  {outOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {!product.isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-full">
                        Unavailable
                      </span>
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link
                    href={product.isActive ? `/products/${product.slug}` : "#"}
                    className="text-sm font-semibold text-forest-deep hover:text-antique-gold line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="font-headline text-lg text-forest-deep">{formatNPR(product.retailPrice)}</span>
                    {product.compareAt && product.compareAt > product.retailPrice && (
                      <span className="text-xs text-on-surface-variant line-through">{formatNPR(product.compareAt)}</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <WishlistRemoveButton productId={product.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
