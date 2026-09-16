import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Icon from "@/components/ui/Icon";
import AddressCard from "@/components/account/AddressCard";
import AddressFormModal from "@/components/account/AddressFormModal";

export const metadata = { title: "Saved Addresses" };

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/account/addresses");

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const addresses = customer
    ? await prisma.customerAddress.findMany({
        where: { customerId: customer.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl text-forest-deep">Saved Addresses</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {addresses.length === 0
              ? "No addresses saved"
              : `${addresses.length} address${addresses.length !== 1 ? "es" : ""} saved`}
          </p>
        </div>
        <AddressFormModal />
      </div>

      {addresses.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-center px-6 py-16">
          <Icon name="location_on" size={48} className="text-outline-variant mx-auto mb-4" />
          <h2 className="font-headline text-xl text-forest-deep">No saved addresses</h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
            Add a delivery address to speed up your checkout.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
