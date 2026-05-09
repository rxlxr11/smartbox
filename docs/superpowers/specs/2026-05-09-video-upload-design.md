# Video Upload Page Design

## Goal

Build `src/pages/video/video.vue` into a file upload and file library page. Users can upload videos, images, text files, and other supported files to Alibaba Cloud OSS, attach title/category/description metadata, and view uploaded records from Supabase on the same page.

## Constraints

- The page must use Wot Design Uni `wd-upload` for file selection and upload UI.
- OSS upload credentials are read from Vite env variables.
- Env variables prefixed with `VITE_` are bundled into the frontend. This is accepted for this task, but it is not a secure credential boundary.
- Page code must access Supabase through `src/api/*` and `src/api/index.ts`, not directly.
- The file list should follow the existing `z-paging` list-page pattern.

## OSS Configuration

Required env keys:

```env
VITE_OSS_ACCESS_KEY_ID=
VITE_OSS_ACCESS_KEY_SECRET=
VITE_OSS_BUCKET=
VITE_OSS_REGION=
VITE_OSS_DIR=mini-program/video
VITE_OSS_HOST=https://<bucket>.oss-<region>.aliyuncs.com
```

`src/lib/oss.ts` will build a browser-side OSS POST policy and signature. `wd-upload` will submit to `VITE_OSS_HOST` with form data containing `key`, `policy`, `OSSAccessKeyId`, `signature`, and `success_action_status`.

## Data Model

Create `video_files` in Supabase:

- `id`: bigint primary key
- `title`: text
- `category`: text
- `file_type`: text, one of `video`, `image`, `text`, `file`
- `file_name`: text
- `file_size`: bigint
- `mime_type`: text
- `oss_key`: text
- `url`: text
- `description`: text
- `is_deleted`: boolean default false
- `user_id`: uuid default `auth.uid()`
- `created_at`: timestamptz default `now()`
- `updated_at`: timestamptz default `now()`

RPC functions:

- `video_create_file(p_file jsonb)` inserts a record for the current user.
- `video_get_files()` returns non-deleted files ordered by newest first.

## Frontend Structure

Add:

- `src/types/video.ts`
- `src/api/video/video.ts`
- `src/api/video/video.sql`
- `src/lib/oss.ts`

Update:

- `src/api/index.ts`
- `src/pages/video/video.vue`
- `src/env.d.ts` if needed for env typings

## Page Behavior

The page contains:

- `BackBar` header.
- Metadata form: title, category, description.
- `wd-upload` with `accept="all"` and `limit=1`.
- Upload success handler that creates the Supabase record.
- File list rendered with `z-paging`.

Validation:

- Title is required.
- Category is required.
- One file is uploaded per submission.
- Missing OSS env configuration shows a toast and prevents upload.

Display:

- Videos render with `video`.
- Images render with `image`.
- Text and other files render as file cards with file name, type, size, and URL open action.

## Error Handling

- OSS upload errors keep the Wot UI upload item in failed state and show a toast.
- Supabase insert errors show a toast and do not clear the upload form.
- List loading errors show a toast and keep the current list state.

## Verification

- Run TypeScript checking.
- Run an H5 build if type checking succeeds.
- Manually inspect the page in the local dev server if the build starts cleanly.
