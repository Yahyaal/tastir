# Turn on feedback: your remaining steps

Prepared for your existing site, **https://tastir-studio.vercel.app**, on **29 October 2026**. PR #14 is merged. You do not need to create another website or database.

## Already done for you

| Item | Result |
| --- | --- |
| Database migration | Applied `0004_feedback` to the database saved in your private Studio settings. The migration history and required columns now match all five checked-in migrations. No manual SQL is needed. |
| Turnstile bot protection | Created **Tastir pattern feedback**, in **Managed** mode, allowing `tastir-studio.vercel.app`. Its real site key and secret key are saved locally. |
| Cleanup secret | Generated a separate random 64-character `CRON_SECRET` and saved it locally. |
| Private settings file | Added the feedback entries to `.env.studio-preflight.local`, preserved the existing Studio settings, and restricted the file to your user. Git ignores it. |
| Live endpoint | After migration, `/api/feedback/config` returned HTTP 200 with `enabled: false` and `attachments: true`. The deployed server recognizes storage configuration; an actual private image upload still needs the check below. |
| Local setup check | `pnpm studio:check` passes against the real database after repairing the check's list of recognized feedback/platform settings. Its regression suite passes all 13 tests. |

Reporting remains **off**. I could use your existing database and Cloudflare login, but this computer has no authenticated Vercel connection. The remaining account changes happen in your Vercel dashboard. You also need to choose the public contact email and complete the real browser check.

## 1. Choose the contact email

1. Open your Tastir folder in your editor: `/home/yahya/Documents/projects/Tastir`.
2. Open **`.env.studio-preflight.local`**. The leading dot makes it a hidden file in some file managers; press **Ctrl+H** to show hidden files.
3. Find `TASTIR_FEEDBACK_CONTACT=` and add an email address you check. This address is shown to learners for privacy/deletion requests, so choose an address you are comfortable making public. The app does not send email automatically.
4. Save the file. Leave `TASTIR_FEEDBACK_ENABLED=0` for now.

The two Turnstile entries and `CRON_SECRET` are already filled in. Do not generate replacement keys or paste the private file into chat, GitHub, or a screenshot.

## 2. Copy five settings into Vercel

1. Open [your Tastir Vercel project](https://vercel.com/yahyaal-gmailcoms-projects/tastir). If that opens a different account, use the [dashboard](https://vercel.com/dashboard) and select the project serving `tastir-studio.vercel.app`.
2. Open the project's **Environment Variables** page. Depending on the dashboard layout, it may be in the project sidebar or under **Settings → Environment Variables**. Stay inside the project rather than Team Settings.
3. Add the following rows, one at a time. Select **Production only** for each. If a name already exists, edit its Production value instead of adding another copy.

| Name | Value |
| --- | --- |
| `TURNSTILE_SITE_KEY` | Copy the value after `=` on that line in your private file. |
| `TURNSTILE_SECRET_KEY` | Copy the value after `=` on that line in your private file. |
| `TASTIR_FEEDBACK_CONTACT` | The email you just chose. |
| `CRON_SECRET` | Copy the generated value after `=` on that line in your private file. |
| `TASTIR_FEEDBACK_ENABLED` | `0` for preparation. You will change this to `1` in step 5. |

Copy only the value into Vercel's Value field, without the setting name, `=`, quotes, or extra spaces. Preserve the existing database, Google sign-in, session and live-room settings. Preview deployments can leave feedback disabled.

These are server setting names; do not add `VITE_` prefixes. Environment changes take effect on a new deployment. See [Vercel's environment-variable instructions](https://vercel.com/docs/environment-variables/managing-environment-variables).

## 3. Check the existing private drawing storage

1. In the same Vercel project, open **Storage** and open its connected Blob store.
2. Confirm the access is **Private**, and the store is connected to this project's **Production** environment.
3. The project should have a connected `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN`. Vercel manages the connection; you do not need to copy its token into chat or the local file.

The live endpoint already detects storage configuration, so first inspect the existing store. If there is no connected private store, use **Create Database / Create Storage → Blob → Private**, then connect it to this project. Keep any existing store that holds Studio reference photos. The final drawing test establishes whether reads and writes work. [Vercel documents private Blob storage and project connections](https://vercel.com/docs/vercel-blob/private-storage).

## 4. Deploy the preparation settings and check cleanup

1. Open **Deployments** in Vercel. Choose the latest successful **Production** deployment from `main`, containing merged PR #14. Its merge commit starts `8d9e025`, or it may be a later commit containing that merge.
2. Open its **⋯ → Redeploy** menu and confirm. Wait for **Ready**. If the latest production build is failed, open its Build Logs and address that failure before continuing.
3. Open [the feedback configuration](https://tastir-studio.vercel.app/api/feedback/config). It should show `"enabled": false`, a populated `siteKey`, your chosen `contact`, and `"attachments": true` if drawing storage is connected. This response contains public configuration only.
4. In a terminal in the Tastir folder, run:

   ```sh
   node --env-file=.env.studio-preflight.local tools/feedback-cleanup.mjs
   ```

   The command reads the saved secret privately and prints aggregate counts. Success has `"failed": 0`; a new inbox normally has zero reports. It performs the same bounded cleanup as the scheduled job, so it can remove expired data if any exists. If it fails, check that Vercel's Production `CRON_SECRET` matches your local value and that the redeploy finished.

5. In Vercel, open **Settings → Cron Jobs** (or the project's Cron Jobs page). Confirm `/api/feedback/cleanup` appears with schedule `0 8 * * *`. It runs daily around 08:00 UTC; a free-plan schedule may run later within that hour. Check its next scheduled invocation succeeds. In Chicago this is around 3 a.m. during daylight saving time and 2 a.m. during standard time.

Opening the cleanup URL directly in a browser gives **401**, because the browser has no secret header. That is expected. Vercel supplies that header for the scheduled job when `CRON_SECRET` is configured. [Vercel's cron guide explains authorization and scheduling](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

If you prefer, after saving the Vercel settings and redeploying, tell me **“The preparation settings are deployed.”** I can run the cleanup command and check the public configuration from this computer.

## 5. Turn reporting on

1. In the local terminal, run this readiness check after saving your contact address:

   ```sh
   TASTIR_FEEDBACK_ENABLED=1 pnpm studio:check
   ```

   Every line should say **OK**, including **Feedback setup** and **Database**. This command temporarily enables the extra configuration checks for that process; it does not switch on the live site. It checks that settings are present, not that the real Turnstile challenge or Blob upload has succeeded.
2. In Vercel's **Production** environment variables, change `TASTIR_FEEDBACK_ENABLED` from `0` to **`1`**. Save.
3. Redeploy Production again as in step 4. Reload the site after the deployment is Ready. The Feedback action should appear inside a lesson or Draw along.
4. Open the public configuration again. It should now say `"enabled": true`. If it remains false, check that the new deployment is Production and the owner inbox has not paused intake.

This enables reporting for everyone visiting the site. Do the following checks immediately while you have the dashboard open. After it is working, you can update the local file to `TASTIR_FEEDBACK_ENABLED=1` as a record of the live setting.

## 6. Send one real report and review it

1. Open a private/incognito browser window, go to [Tastir](https://tastir-studio.vercel.app), open a pattern, and enter **Draw along**. Make a small drawing, then open Feedback.
2. Write **“Owner launch test — please delete after checking”**, choose an issue category, and include the drawing. Leave the optional learner email empty for this test.
3. Let the Cloudflare check finish, if it asks you to interact, then send. You should get a success receipt. A Managed check may finish without showing a checkbox challenge.
4. In your normal browser, open [Studio](https://tastir-studio.vercel.app/#/studio) and sign in with your existing owner account. Then open [Feedback inbox](https://tastir-studio.vercel.app/#/feedback).
5. Open the launch report. Confirm the message, pattern, step and drawing image are correct. Download its drawing data if you want to check the editable snapshot. This proves more than the public `attachments` flag alone.
6. Select only this test report and try **Copy for AI** or **Download investigation bundle**. Review what will be shared before copying. No agent is started automatically.
7. In the private/incognito window, open `/#/feedback`. It should require owner sign-in and show no report data.
8. Delete the launch report from your owner inbox after checking it. Optionally send a second text-only report to confirm the no-drawing path.

For the first week, check the inbox's Quarantined/Spam views and capacity counters, and Vercel's function/storage usage. Check the first daily cleanup succeeds. These live checks and observation are the remaining F6 acceptance work; creating the widget and migrating the database do not complete them.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| Feedback button missing | Reload after the Production redeploy. Check `/api/feedback/config`. `enabled: false` means the Vercel flag is off or the inbox has paused intake. |
| Config endpoint returns 503 | Check the latest deployment's runtime logs. The migration is complete for the saved database; confirm Production still uses that same database and all required feedback settings are present. Share the error description without credentials. |
| Bot verification fails | The widget is for `tastir-studio.vercel.app`. Use that hostname and check that both Vercel keys came from the same **Tastir pattern feedback** widget. If you use another domain, it must be allowed in Cloudflare and match `TASTIR_STUDIO_URL`. |
| Drawing checkbox disabled | Confirm the private Blob connection and that attachments are not paused in the owner inbox. Text-only reports can still work. |
| Drawing fails to save | Keep the draft. Recheck the private store's permissions/connection; the form offers sending without the drawing. |
| Cleanup returns 401 | Check the Production/local secret match and redeploy. A direct browser visit is expected to fail; use the supplied cleanup command. |
| You need to stop new reports quickly | Click **Pause intake** in the owner inbox. The server stops accepting new reports immediately; reloading the learner page hides Feedback. You can still review existing reports. |
| The whole deployment fails to start after enabling | Change Vercel's `TASTIR_FEEDBACK_ENABLED` back to `0` and redeploy, then fix the reported configuration problem. Keep the migration and existing reports. |

You can say **“I finished step 4”** or **“I finished step 5”** without sending keys. I can then recheck the public endpoint, the database state, and authorized cleanup using the local private settings. The real browser challenge and owner sign-in still need the browser check above.

## Database command, for reference

The migration is already done on this computer's configured database. You do **not** need to run it again or paste `0004_feedback.sql` into Neon. If the configured database changes later, the existing command is:

```sh
pnpm studio:setup:db
pnpm studio:check
```

The first command applies pending checked-in migrations using `.env.studio-preflight.local`. Drizzle records completed migrations and skips them on later runs. Check the selected database before using it on another environment.

## Verification of this preparation

The setup-check repair and guide links passed `pnpm lint --parallel=1`, `pnpm typecheck --parallel=1`, the full `pnpm test --maxWorkers=1 --outputStyle=stream` across all eight projects, and all 14 `pnpm test:feedback:browser` checks. The preflight suite passed all 13 tests. Nx reused unchanged test results, including the engine's 4,026 geometry/golden tests; the player suite ran again and passed 2,998 tests. Commands ran sequentially with one worker and a 1,536 MiB Node heap limit. These local checks complement the real database/configuration checks above; the production submission, private image persistence and scheduled cleanup still need steps 4–6.
