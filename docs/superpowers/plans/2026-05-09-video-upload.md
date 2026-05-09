# Video Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a UniApp video/file upload page that uploads through Wot UI `wd-upload` to Alibaba Cloud OSS and records metadata in Supabase.

**Architecture:** Keep Supabase access in `src/api/video/video.ts`, pure record types in `src/types/video.ts`, and OSS policy/signature logic in `src/lib/oss.ts`. The page coordinates form state, Wot UI upload events, and `z-paging` refreshes through the existing `API` aggregate.

**Tech Stack:** UniApp, Vue 3 `script setup`, TypeScript, Wot Design Uni `wd-upload`, Supabase RPC, Alibaba Cloud OSS POST upload.

---

## File Structure

- Create `src/types/video.ts`: database row, frontend item, DTO, file type/category types.
- Create `src/lib/oss.ts`: read `VITE_OSS_*` env values, build OSS POST form data, infer file metadata.
- Create `src/api/video/video.ts`: Supabase RPC wrappers for creating and listing file records.
- Create `src/api/video/video.sql`: table and RPC definitions.
- Modify `src/api/index.ts`: expose `API.video`.
- Modify `src/env.d.ts`: type the OSS env keys.
- Modify `.env`: add OSS env keys with empty defaults if absent.
- Replace `src/pages/video/video.vue`: Wot UI upload form and z-paging file library.

## Task 1: Add Video Types

**Files:**
- Create: `src/types/video.ts`

- [ ] **Step 1: Create shared types**

```ts
export type VideoFileType = 'video' | 'image' | 'text' | 'file'

export interface VideoFileRecord {
  id: number
  title: string
  category: string
  file_type: VideoFileType
  file_name: string
  file_size?: number
  mime_type?: string
  oss_key: string
  url: string
  description?: string
  is_deleted?: boolean
  user_id?: string
  created_at: string
  updated_at?: string
}

export interface CreateVideoFileDTO {
  title: string
  category: string
  file_type: VideoFileType
  file_name: string
  file_size?: number
  mime_type?: string
  oss_key: string
  url: string
  description?: string
}
```

- [ ] **Step 2: Run type check**

Run: `pnpm type-check`
Expected: existing project type check may expose unrelated issues, but `src/types/video.ts` should not introduce syntax or type errors.

## Task 2: Add OSS Upload Helpers

**Files:**
- Create: `src/lib/oss.ts`
- Modify: `src/env.d.ts`
- Modify: `.env`

- [ ] **Step 1: Add env typings and keys**

`src/env.d.ts` should include `VITE_OSS_ACCESS_KEY_ID`, `VITE_OSS_ACCESS_KEY_SECRET`, `VITE_OSS_BUCKET`, `VITE_OSS_REGION`, `VITE_OSS_DIR`, and `VITE_OSS_HOST`.

`.env` should include the same keys so local development has an obvious configuration surface.

- [ ] **Step 2: Implement OSS helper**

`src/lib/oss.ts` should export:

- `getOssConfig()`
- `assertOssConfig()`
- `buildOssUploadData(file)`
- `getOssPublicUrl(key)`
- `getVideoFileType(file)`
- `formatFileSize(size)`

Use Web Crypto HMAC-SHA1 where available and fail clearly if unsupported.

- [ ] **Step 3: Run type check**

Run: `pnpm type-check`
Expected: no new errors from the OSS helper.

## Task 3: Add Supabase Video API

**Files:**
- Create: `src/api/video/video.ts`
- Create: `src/api/video/video.sql`
- Modify: `src/api/index.ts`

- [ ] **Step 1: Write SQL**

Create `video_files`, enable RLS, add user-scoped policies, and define:

- `public.video_create_file(p_file jsonb)`
- `public.video_get_files()`

- [ ] **Step 2: Add API wrappers**

`videoApi.getFiles()` calls `video_get_files`.

`videoApi.createFile(file)` calls `video_create_file`.

- [ ] **Step 3: Expose aggregate API**

Add `import { videoApi } from '@/api/video/video'` and `video: { ...videoApi }` to `src/api/index.ts`.

- [ ] **Step 4: Run type check**

Run: `pnpm type-check`
Expected: no new API type errors.

## Task 4: Build Video Upload Page

**Files:**
- Replace: `src/pages/video/video.vue`

- [ ] **Step 1: Add render-facing state**

Top-level state includes `files`, `paging`, metadata form, category options, upload file list, and upload flags.

- [ ] **Step 2: Add business methods**

Add methods to validate metadata, build OSS upload data for `wd-upload`, handle upload success, create the Supabase record, refresh the list, preview/open files, and reset the form.

- [ ] **Step 3: Add template**

Use `z-paging`, `BackBar`, Wot UI inputs/select/upload controls, and file cards. Add template comments for header, upload form, and file library.

- [ ] **Step 4: Add scoped styles**

Keep page layout compact and mobile-friendly. Use stable dimensions for media previews and cards.

- [ ] **Step 5: Run type check**

Run: `pnpm type-check`
Expected: no new errors from `src/pages/video/video.vue`.

## Task 5: Verify Build

**Files:**
- No new files.

- [ ] **Step 1: Run full type check**

Run: `pnpm type-check`
Expected: no type errors from the video upload implementation.

- [ ] **Step 2: Run H5 build**

Run: `pnpm build:h5`
Expected: build completes successfully.

- [ ] **Step 3: Start dev server for manual verification**

Run: `pnpm dev:h5`
Expected: local UniApp dev server starts and the video page is available through the H5 route.
