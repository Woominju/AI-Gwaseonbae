"use client";
import * as React from "react";
import type { SeniorRecord } from "@/lib/types";

let cache: SeniorRecord[] | null = null;

export function useRecords() {
  const [records, setRecords] = React.useState<SeniorRecord[] | null>(cache);
  React.useEffect(() => {
    if (cache) return;
    fetch("/api/records")
      .then((r) => r.json())
      .then((j) => {
        cache = j.records;
        setRecords(j.records);
      })
      .catch(() => setRecords([]));
  }, []);
  const byId = React.useMemo(() => new Map((records ?? []).map((r) => [r.record_id, r])), [records]);
  return { records, byId };
}
