# Musicfy 2.0

Musicfy 2.0 is a full-stack music discovery and social review platform inspired by Frutiger Aero design language. The app combines a React front end with an Express back end connected to TiDB Cloud, enabling artist catalog management, release browsing, user reviews, social interactions, and administrator tools.

## Architecture

- Front end: React + Vite
- Back end: Node.js + Express
- Database: TiDB Cloud (MySQL-compatible)
- Authentication: JWT with bcrypt password hashing
- Styling: custom CSS with glassmorphism and vibrant gradients

This combination keeps the project lightweight while still providing a real persistent database, protected API routes, and a production-ready structure suitable for local deployment and further scaling.

## Features implemented

- User registration and login
- Role-based access control with ADMIN and USER roles
- Artist and release catalog
- Tracklists and media links
- Review publishing and rating system; authors can edit or delete their own reviews from the home feed, release page, or profile
- Review likes with live counts on release pages, profiles, and the social feed
- Review text is limited to 300 characters and may include one uploaded GIF
- Artist detail pages and release detail pages
- Release and artist detail panels use blurred artwork as adaptive color gradients; animated GIF colors cross-fade slowly
- Personalized home feed with reviews from followed users and releases saved by the user
- Admin-managed home carousel for multiple releases, with controls to create, edit, reorder, and remove banners and descriptions; slides rotate automatically every five seconds and can be paused
- Home sidebar showing active releases from the previous two months
- Public user profiles with profile discovery, follow/unfollow, and follower/following lists
- Artist follows and in-app notifications for new followers, review likes, and new releases from followed artists or pre-saved releases
- User profile page with reviews, playlists, and favorite tracks
- Playlists with public detail pages, custom descriptions and covers, track add/remove/reordering, and owner-only edit/delete controls
- Track favorites
- Pre-save flow and notification model
- Admin dashboard for creating and editing artists and releases, with edit shortcuts on artist and release detail pages
- Admin catalog forms can search MusicBrainz for artist details and release groups, then import release metadata, track titles, durations, and available Cover Art Archive artwork
- Admin tools organized into catalog, homepage highlights, and moderation sections; profile suspensions are reversible and users can access their in-app notices
- Admin can enable or disable manual approval for new profiles; disabling it automatically approves existing pending profiles
- Responsive Frutiger Aero UI

## Local setup

### Requirements

- Node.js 20.19+ (or 22.12+) and npm
- A TiDB Cloud cluster with a database created for Musicfy

### Install and run

1. Create a database (for example, `musicfy`) in TiDB Cloud and get the cluster's connection details.

2. From the project root, install all front-end and back-end dependencies:

   npm install

3. Create and configure the local environment file. In PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Fill in `TIDB_HOST`, `TIDB_USER`, `TIDB_PASSWORD`, and `TIDB_DATABASE` from TiDB Cloud. Keep `TIDB_PORT=4000`; set `TIDB_CA_PATH` if TiDB Cloud gives you a CA certificate file. Set `JWT_SECRET` to a random value of at least 32 characters and choose a unique `MUSICFY_ADMIN_PASSWORD` of at least 12 characters for the first database startup. Do not commit `.env`.

   On macOS/Linux, create the file with `cp .env.example .env`.

4. Start the application in development mode:

   npm run dev

This runs both the API and the Vite front-end dev server. On startup, the API applies `server/schema.sql` to the configured TiDB database and seeds demo content if the tables are empty. Production does not automatically add the three demo artists, so deleting the catalog there will not recreate them on the next restart.

- Front end: http://localhost:5173
- API: http://localhost:4000

Useful commands:

- `npm run build` — build the front end for production
- `npm start` — start the API server and serve the production front end

## Deploying to Render

Render is the recommended host for this project. GitHub Pages only serves static files; it cannot run the Express API, authentication, or the TiDB connection. The included `render.yaml` configures one Render Web Service to build the Vite app and serve it alongside the API.

1. Push the repository to GitHub. Keep `.env` out of the repository.
2. In Render, create a **Blueprint** from the repository; Render will read `render.yaml`.
3. In the service's Environment settings, provide `TIDB_HOST`, `TIDB_USER`, `TIDB_PASSWORD`, and `MUSICFY_ADMIN_PASSWORD`. The TiDB database (default name `musicfy`) must already exist. `JWT_SECRET` is generated by Render.
4. Configure TiDB Cloud's network access to permit the Render service's outbound IP addresses. If your TiDB connection requires a CA certificate, add it as a Render Secret File and set `TIDB_CA_PATH` to its path.

The Render health check uses `/api/health`. New profile images, artist photos, and release covers (JPG, PNG, GIF, or WebP, up to 10 MB) are stored in TiDB, so they are available from every computer using the same site and remain available after server restarts or redeploys. The database schema creates the `image_assets` table automatically. Images uploaded by older versions were stored on the server filesystem; if those files are no longer present, upload them again in the admin/profile forms. Existing filesystem uploads and artist banners still require the files to remain on the server (for example, on a persistent disk mounted at `/var/data` with `UPLOADS_DIR=/var/data`).

## Admin account

The first database startup creates the admin account using `MUSICFY_ADMIN_USERNAME`, `MUSICFY_ADMIN_EMAIL`, `MUSICFY_ADMIN_NAME`, and `MUSICFY_ADMIN_PASSWORD`. Choose and keep the password private in `.env`; there is no default admin password.

If the admin account already exists but its password is unknown, changing `MUSICFY_ADMIN_PASSWORD` does not update the stored password. With TiDB connection settings in your local `.env` and network access enabled for your machine, run `npm run admin:reset-password`. The command uses `MUSICFY_ADMIN_USERNAME` (default `admin`), prompts for a new password without echoing it, and updates only that account if its role is `ADMIN`.

If your computer cannot connect to TiDB, reset through Render instead: set `MUSICFY_ADMIN_PASSWORD` to a new password and add `MUSICFY_ADMIN_RESET_PASSWORD=true` in the service's Environment settings, then redeploy. Confirm the startup log reports a reset, and immediately remove `MUSICFY_ADMIN_RESET_PASSWORD` and save the environment. Do not leave this flag enabled; it reapplies the configured password on every startup.

## Database notes

The TiDB schema is defined in `server/schema.sql` using MySQL-compatible types and syntax. The API applies it to the database named by `TIDB_DATABASE` at startup. The database must already exist in TiDB Cloud. Connection settings are read from `.env`; the server fails with a configuration error if required `TIDB_*` values are missing.

The relational catalog links artists to releases and releases (albums, EPs, or singles) to tracks. App-wide settings, including the manual profile approval choice, are persisted in `app_settings`. Artist, release, and track URLs are stored in `artist_links`, `release_links`, and `track_links`. Lyrics and translations are stored in `track_texts`, keyed by track, content type, and language code; use `und` when the language is unknown. The existing local SQLite database is not uploaded or copied to TiDB automatically; it remains untouched.

In the admin panel, create an artist before creating a release, then select that artist from the catalog list. The API validates the selected artist ID against TiDB to prevent invalid release-to-artist links.

The catalog forms can search MusicBrainz without an API key. Artist name and genre tags can be copied into an artist form; a release search can prefill its title, type, full release date when available, genres, track titles/durations, and Cover Art Archive URL. Review all imported data before saving: MusicBrainz does not supply the site's artist biography, artist images, lyrics, translations, or streaming links, and a complete release date or cover image may not be available. The integration identifies Musicfy in its MusicBrainz User-Agent and spaces requests to respect the service's rate limit.

The admin panel separates catalog management, homepage carousel highlights, profile approvals, and moderation. In profile approvals, the admin can decide whether new accounts require manual approval; this is enabled by default. Disabling it automatically approves and notifies any profiles already waiting, while enabling it again only affects future registrations. Moderators can hide a standard user profile without deleting the account or its data, restore it later, and remove reviews. The affected user receives an in-app notification; while a profile is suspended, its owner can sign in only to read and acknowledge notifications.

### Importing a local SQLite catalog

The import command requires Node.js 22.12 or newer and reads the SQLite source in read-only mode. From the project root, preview the default `server/data/musicfy.db`:

```powershell
npm run db:import-sqlite-catalog
```

The preview reports catalog counts and does not connect to TiDB. To import, first allow your current public IP in the TiDB Cloud cluster's IP Access List, then run:

```powershell
npm run db:import-sqlite-catalog -- --apply
```

The command imports artists, genres, artist-genre relationships, releases, and tracks (including legacy lyrics, translations, and YouTube URLs). It reuses matching artist names, matches releases by artist/title/date, skips existing track numbers, and runs in a transaction. It does not import users or their passwords, reviews, playlists, favorites, notifications, or separate link/translation tables not present in the legacy SQLite database.

User passwords are stored as bcrypt hashes. Reviews and their likes use `reviews` and `review_likes`; track favorites use `favorites`. Playlists, playlist tracks, pre-saves, notifications, and featured releases are persisted in their corresponding tables. A new database is seeded with roles, the configured admin account, a demo user, artists, releases, and tracks.

User follow relationships are stored in `user_follows`, artist follows in `artist_follows`, and in-app notifications in `notifications`. The authenticated social page searches public profiles; user/artist follows and review likes require a signed-in user. Public profile pages include follower/following lists and social counts. Notifications are polled while signed in and can be marked as read individually or all at once. Review GIFs are stored in `review_media`.

Additional content endpoints (writes require an admin token):

- `GET /api/content/:entityType/:id/links` — list links for an `artist`, `release`, or `track`
- `POST /api/content/:entityType/:id/links` — add a link (`platform`, `url`, optional `link_type`)
- `DELETE /api/content/:entityType/:id/links/:linkId` — remove a link
- `GET /api/tracks/:id/texts` — list a track's lyrics and translations
- `PUT /api/tracks/:id/texts` — add/update text (`content_type`, `language_code`, `content`, optional `source_language_code` and `source_url`)
- `DELETE /api/tracks/:id/texts/:contentType/:languageCode` — remove a language entry

Social endpoints:

- `GET /api/users?q=...` — search public profiles (authentication required)
- `POST /api/users/:userId/follow` and `DELETE /api/users/:userId/follow` — follow or unfollow a user (authentication required)
- `GET /api/users/:userId/followers` and `GET /api/users/:userId/following` — list profile connections
- `GET /api/profile/:userId` — read a public profile, including reviews, playlists, favorites, and follow state
- `GET /api/playlists/:playlistId` — read a public playlist and its ordered track list
- `POST /api/playlists` and `PUT /api/playlists/:playlistId` — create or edit an owned playlist
- `DELETE /api/playlists/:playlistId` — delete an owned playlist
- `POST /api/playlists/:playlistId/tracks` and `DELETE /api/playlists/:playlistId/tracks/:trackId` — add or remove a track
- `PUT /api/playlists/:playlistId/tracks/order` — reorder all tracks in an owned playlist
- `POST /api/reviews/:id/like` — like or unlike a review (authentication required)
- `GET /api/artists/:id/follow`, `POST /api/artists/:id/follow`, and `DELETE /api/artists/:id/follow` — read or change an artist follow (authentication required)
- `GET /api/notifications` — list notifications and unread count (authentication required)
- `POST /api/notifications/:id/read` and `POST /api/notifications/read-all` — mark notifications as read (authentication required)
- `GET /api/home-feed` — return a personalized review feed and releases from the last two months

## Build for production

npm run build

To serve the built static front end with the API in production mode:

PowerShell: `$env:NODE_ENV='production'; npm run start`

macOS/Linux: `NODE_ENV=production npm run start`

## Project structure

- `server/index.js` — Express API, database bootstrap and endpoints
- `server/schema.sql` — TiDB/MySQL-compatible database schema
- `src/App.jsx` — React pages and UI logic
- `src/styles.css` — full visual styling
- `index.html` — Vite entry point
- `vite.config.js` — Vite configuration and API proxy

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/artists`
- `GET /api/artists/:id`
- `GET /api/releases`
- `GET /api/releases/:id`
- `GET /api/home-feed`
- `POST /api/reviews`
- `PUT /api/reviews/:id`
- `POST /api/reviews/:id/like`
- `GET /api/profile/:userId`
- `GET /api/explore`
- `GET /api/dashboard` (admin only)

## Notes

This project is built as a functional MVP aligned with the requested product brief. It prioritizes real persistence, secure API handling, and working feature flows over a static mockup.
