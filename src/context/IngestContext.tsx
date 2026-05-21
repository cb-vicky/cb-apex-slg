/**
 * Barrel re-exports for ingest context.
 *
 * `createContext` + `useIngestContext` live in `ingest-context-core.ts` so Vite Fast
 * Refresh does not recreate the context instance when `IngestProvider.tsx` hot-reloads.
 */
export { useIngestContext, type IngestContextValue } from "@/context/ingest-context-core";
export { IngestProvider } from "@/context/IngestProvider";
