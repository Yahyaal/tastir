# Connect your other apps

This walks you through adding your online studio to ChatGPT, Codex and Antigravity, the way you already added it to claude.ai. Each app then signs in as itself, so the studio's history shows which app drew what, and you can remove any one of them later without touching the others.

- **How long:** about 10 minutes per app. Do them in any order, one at a time, and skip any you do not use.
- **What it costs:** nothing beyond the plans you already have.

**How connecting works.** You do everything inside the app you are connecting (ChatGPT, Codex or Antigravity), never in your browser's address bar. You give the app one address, `https://tastir-studio.vercel.app/mcp`, and the app then opens a sign-in page for you by itself: first Google, where you choose your account, then the studio's own page asking whether that app may work on your studio projects, where you click **Allow**. Each part below says exactly when that happens.

Do not open `https://tastir-studio.vercel.app/mcp` in your browser: it is only for the apps, and a browser just gets `{"error":"invalid_token" …}`. That is normal, not a fault.

If a screen looks different from what is described, look for the button with the same name nearby; these apps move their settings around often. If you are stuck, tell Claude which step and what you see.

Each part ends with the same small test, so we can compare the apps:

```
Use the Tastir studio. Make a new project called "Square check
from <app name>". Starting from O and A only, construct the
square whose corners are the four points where the unit circle
about O meets the horizontal and vertical through O. Ink its
four sides, make that square the repeating tile, and color its
piece #2453a6.
```

Replace `<app name>` with ChatGPT, Codex or Antigravity. While it works, open https://tastir-studio.vercel.app/#/studio and you can watch the drawing appear.

## Part 1: ChatGPT (on the website)

ChatGPT calls outside tools like the studio "MCP apps", and only shows the button for them once you switch on **Developer mode**.

1. Open https://chatgpt.com and sign in.
2. Switch on Developer mode:
   - Click your name or picture at the bottom left, then **Settings**.
   - Open **Security and sign-in** (older versions put it under **Apps** or **Connectors**, then **Advanced settings**).
   - Switch on **Developer mode**. ChatGPT warns that it is "high risk", because it allows apps OpenAI has not reviewed. That is expected: the studio is yours.
3. Add the studio:
   - In Settings, open **Plugins** (it may be called **Apps** or **Connectors**).
   - Click **+** at the top right, then **Create an MCP app**. If there is no **Create** button, Developer mode is not on yet; go back to step 2.
   - **Name:** `Tastir studio`.
   - **Description:** `My Islamic geometric pattern studio`.
   - **Connection** (or **MCP server URL**): `https://tastir-studio.vercel.app/mcp`.
   - **Authentication:** leave it on **OAuth**.
   - Tick **I understand and want to continue**, then click **Create**.
4. Sign in. Clicking **Create** makes ChatGPT open a sign-in page by itself, in a new tab or a pop-up. If nothing opens (a pop-up blocker can stop it), find **Tastir studio** in the **Plugins** list, open it and click **Connect**.
   - The page is Google's: choose your own account.
   - Next comes the studio's own page, "Allow ChatGPT to work on your studio projects?" (the name is whatever ChatGPT calls itself). Click **Allow**.
   - The tab closes or sends you back to ChatGPT, which now lists the studio's tools.
5. Try it: start a **new** chat (not a temporary one), click **+** next to the message box, choose **Developer mode** or **Tastir studio**, and paste the test above.

ChatGPT asks before each tool that changes something; click **Confirm** (or **Always allow** for this chat). If it says your plan cannot use apps that make changes, tell Claude what it says.

## Part 2: Codex (in the terminal)

Your Codex already knows the studio on this computer as `tastir-studio`. The online one gets its own name, `tastir-online`, so the two never mix.

1. Open a terminal anywhere and add it:

   ```sh
   codex mcp add tastir-online --url https://tastir-studio.vercel.app/mcp
   ```

2. Sign in:

   ```sh
   codex mcp login tastir-online
   ```

   A browser page opens. Choose your Google account, then click **Allow** when the studio asks whether Codex may work on your studio projects (it may show Codex's own name or `127.0.0.1`, its sign-in helper on this computer). The page then says you can close it, and the terminal says it is logged in.
3. Check it: run `codex mcp list`. The `tastir-online` line says it is enabled and logged in.
4. Try it: start `codex`, paste the test, and when Codex asks to use a studio tool, approve it.

In the Codex window of VS Code or the ChatGPT desktop app, the same server shows up after a restart, because they read the same settings. Type `/mcp` there to see it.

## Part 3: Antigravity

Antigravity keeps its tools in a settings file that you edit from inside the app.

1. Open Antigravity and the agent side panel.
2. Click **…** at the top of the agent panel, then **MCP Servers**, then **Manage MCP Servers**, then **View raw config**. A file called `mcp_config.json` opens.
3. Add the studio inside `"mcpServers"`. If the file is empty or only has `{}`, replace everything with:

   ```json
   {
     "mcpServers": {
       "tastir-studio": {
         "serverUrl": "https://tastir-studio.vercel.app/mcp"
       }
     }
   }
   ```

   If other servers are already listed, add the `"tastir-studio": { … }` part beside them, with a comma between entries. Save the file.
4. Sign in:
   - Open Antigravity's settings (**Ctrl + ,**) and the **Customizations** tab.
   - Next to `tastir-studio`, click **Authenticate**.
   - Your browser opens. Choose your Google account, then click **Allow** when the studio asks whether Antigravity may work on your studio projects (it may show `antigravity.google`).
   - The browser shows a code. Copy it, paste it into the box in Antigravity's settings, and click **Submit**. The studio's tools appear under it.
5. Try it: in a new agent chat, paste the test.

## Part 4: Answer a question from your phone

Agents sometimes ask you something and wait. To check that works away from the computer:

1. On your phone, open https://tastir-studio.vercel.app/#/studio and sign in with Google.
2. In any of the apps above, ask: `Use the Tastir studio: in my project "Square check from Codex", ask me which colour I want for the tile, and wait for my answer.`
3. On the phone, open that project. The question shows in a box with an answer field. Type a colour and send it. The agent carries on with your answer.

## When you are done

Tell Claude which apps you connected and how each test went (finished, stuck, or refused something). Claude then reads the studio's history, measures how fast each app's edits reached your screen, and writes it all in the log.

To see or remove the apps you allowed, open https://tastir-studio.vercel.app/connections. **Remove** stops that app at once; you can always add it again with this guide.

## If something goes wrong

| What you see | What it means and what to do |
| --- | --- |
| The app shows an error containing **The studio does not send sign-ins to** … | The app returns to an address the studio does not know yet. Tell Claude the app's name and the address that follows those words. |
| ChatGPT has no **Create an MCP app** button | Developer mode is off. Part 1, step 2. |
| ChatGPT lists the app but never uses it | Start a new chat and choose the app with **+** before you send the message. |
| Codex says `tastir-online` is not logged in | Run `codex mcp login tastir-online` again. |
| Antigravity shows no **Authenticate** button | The settings file did not save, or a comma is missing. Open it again (Part 3, step 2) and check it against the example. |
| Google says **Access blocked** | You chose a Google account that is not yours, or not on the studio's list. Choose the same account you use for the studio. |
