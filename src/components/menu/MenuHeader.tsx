interface MenuHeaderProps {
  restaurantName: string;
  address?: string | null;
}

export function MenuHeader({ restaurantName, address }: MenuHeaderProps) {
  return (
    <header className="bg-[#141414] px-6 py-10 text-center">
      <h1 className="font-display text-3xl font-bold tracking-tight text-white">
        {restaurantName}
      </h1>
      {address && (
        <p className="mt-1.5 text-sm tracking-wider text-[#666]">{address}</p>
      )}
      <div className="mx-auto mt-5 h-px w-16 bg-[#b49a5a]/50" />
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#555]">
        Carta
      </p>
    </header>
  );
}
