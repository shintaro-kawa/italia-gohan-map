/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SHEETS_ID?: string;
  readonly SHEET_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
