import "server-only";
/**
 * 그래프 입력 데이터. 호출마다 최신 권한으로 읽는다 (그래프를 저장하거나 메모리에 재사용하지 않는다).
 * 공식 수강편람은 web/data/catalog/*.json (Git 제외) 에 사용 허가를 확인한 자료만 넣는다.
 */
import fs from "node:fs";
import path from "node:path";
import syntheticCatalog from "@/data/catalog.synthetic.json";
import ncs from "@/data/career/ncs.fixture.json";
import { isPublicDemo } from "../demoMode";
import { getAllRecords } from "../data/repository.server";
import { getRagQa, type QaAudience } from "../qa/store.server";
import { buildKnowledgeGraph, type NcsStandards } from "./build";
import { CatalogFileSchema, officialDocUsable, type CatalogFile, type KnowledgeGraph } from "./schema";

export const CATALOG_DIR = path.join(process.cwd(), "data", "catalog");
const synthetic = CatalogFileSchema.parse(syntheticCatalog);

export function loadCatalog(): CatalogFile {
  const merged: CatalogFile = { documents: [...synthetic.documents], courses: [...synthetic.courses] };
  if (isPublicDemo()) return merged;
  let files: string[] = [];
  try {
    files = fs.readdirSync(CATALOG_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return merged;
  }
  for (const f of files) {
    try {
      const p = CatalogFileSchema.safeParse(JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, f), "utf8")));
      if (!p.success) continue;
      // 사용 허가·출처가 확인되지 않은 공식 자료는 그래프에 넣지 않는다
      const docs = p.data.documents.filter(officialDocUsable);
      const ids = new Set(docs.map((d) => d.doc_id));
      merged.documents.push(...docs);
      merged.courses.push(...p.data.courses.filter((c) => ids.has(c.doc_id)));
    } catch {
      /* 잘못된 파일은 건너뛴다 */
    }
  }
  return merged;
}

export function currentGraph(audience: QaAudience): { graph: KnowledgeGraph; catalog: CatalogFile } {
  const catalog = loadCatalog();
  return { catalog, graph: buildKnowledgeGraph({ records: getAllRecords(), catalog, qa: getRagQa(audience), ncs: ncs as NcsStandards }) };
}
