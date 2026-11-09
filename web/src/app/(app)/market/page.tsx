import { MarketClient } from "./MarketClient";

export default async function MarketPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : null);
  return <MarketClient initialTab={one(sp.tab)} initialOccupation={one(sp.occupation)} />;
}
