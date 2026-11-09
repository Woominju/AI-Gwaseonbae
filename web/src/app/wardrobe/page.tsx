import { WardrobeClient } from "./WardrobeClient";

export default async function WardrobePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <WardrobeClient onboarding={sp.step === "create"} />;
}
