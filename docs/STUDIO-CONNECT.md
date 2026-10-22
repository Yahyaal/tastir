# Connect your other apps

This walks you through adding your online studio to ChatGPT, Codex and Antigravity, the way you already added it to claude.ai. Each app then signs in as itself, so the studio's history shows which app drew what, and you can remove any one of them later without touching the others.

- **How long:** about 10 minutes per app. Do them in any order, one at a time, and skip any you do not use.
- **What it costs:** nothing beyond the plans you already have.

**How connecting works.** You do everything inside the app you are connecting (ChatGPT, Codex or Antigravity), never in your browser's address bar. You give the app one address, `https://tastir-studio.vercel.app/mcp`, and the app then opens a sign-in page for you by itself: first Google, where you choose your account, then the studio's own page asking whether that app may work on your studio projects, where you click **Allow**. Each part below says exactly when that happens.

Do not open `https://tastir-studio.vercel.app/mcp` in your browser: it is only for the apps, and a browser just gets `{"error":"invalid_token" …}`. That is normal, not a fault.

If a control is missing, check the troubleshooting table below. If you are still stuck, tell the agent which app and step you reached, which plan and workspace you are using, and the labels you actually see.

Each part ends with the same small test, so we can compare the apps:

```
Use the Tastir studio. Make a new project called "Square check
from ChatGPT". Starting from O and A only, construct the
square whose corners are the four points where the unit circle
about O meets the horizontal and vertical through O. Ink its
four sides, make that square the repeating tile, and color its
piece #2453a6. Show me the finished colored repeating wall.
```

Use the prompt as written in ChatGPT. For Codex or Antigravity, replace `ChatGPT` in the project title with that app's name.

The project is saved online in Tastir. Sign in at https://tastir-studio.vercel.app with the same Google account, then open **Your work → Studio projects**, or **Studio**, from the homepage. You can watch the drawing there while the agent works. In the project editor, **View finished wall** opens the repeating tiles and colors. The live chat card also shows the finished wall once the project has a usable tile; before that it shows the construction.

**Why the chat and Studio link can look different:** a `#/studio/<project>` link opens the construction editor, showing the compass circles, lines and tile outline. The finished chat card shows the colored repeat. Click **View finished wall** at the top of the editor to see that result in Tastir. An outline in the construction editor does not mean the saved tile or paint is missing.

## Part 1: ChatGPT (on the website)

**Checked against official OpenAI documentation on 21 October 2026.** The current setup starts in **Plugins**. It does not list **Advanced settings** or a **Developer mode** switch as prerequisites. The previous version of this guide incorrectly made those controls a required first step. [Official connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).

1. Sign in at https://chatgpt.com in a desktop browser. Open **Plugins**.
2. Click **+**, then **Add custom MCP server**. Enter:
   - **Name:** `Tastir studio`.
   - **Description:** `My Islamic geometric pattern studio`.
   - For the connection, use the public server address `https://tastir-studio.vercel.app/mcp`.
   - Use OAuth authentication for the studio.
3. Accept the risk acknowledgement and click **Create as a plugin**. Review the discovered tools.
4. Install the resulting plugin. When prompted to connect, choose the Google account you use for the studio, then approve access on the studio's consent page. Authentication may happen during installation or on first use. [Plugin installation and authentication](https://learn.chatgpt.com/docs/plugins).
5. Start a new conversation, type `@`, select **Tastir studio**, and paste the square test above. Approve requested edits after reviewing them.

### If you cannot find the controls

Missing **Advanced settings** or **Developer mode** alone is not a reason to stop: try the Plugins steps above. If your screen explicitly requires Developer mode, record the message and the settings you see; this guide does not establish a toggle location for that interface.

If **Plugins**, **+**, or the option to add a custom MCP server is absent, check which account and workspace you are in. OpenAI says account and workspace policies apply to custom servers. In a managed workspace, ask the administrator to check your plugin and MCP access. [Workspace access controls](https://learn.chatgpt.com/docs/enterprise/apps-and-connectors).

The official connection guide does not give a complete plan eligibility table, so this guide cannot promise that your particular plan can add the studio or edit drawings. If access is unavailable or edits are blocked, keep the exact message and use **Part 2: Codex** to try connecting from the terminal. Missing controls alone do not establish that you need to upgrade.

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
2. In the app you connected, ask: `Use the Tastir studio: in my project "Square check from ChatGPT", ask me which colour I want for the tile, and wait for my answer.` Use your actual project title if you tested Codex or Antigravity instead.
3. On the phone, open that project. The question shows in a box with an answer field. Type a colour and send it. The agent carries on with your answer.

## When you are done

Tell Claude which apps you connected and how each test went (finished, stuck, or refused something). Claude then reads the studio's history, measures how fast each app's edits reached your screen, and writes it all in the log.

To see or remove the apps you allowed, open https://tastir-studio.vercel.app/connections. **Remove** stops that app at once; you can always add it again with this guide.

A plugin entry in ChatGPT and an authorization on the Studio connections page are separate records. If ChatGPT says the connector already exists, reuse its existing entry and refresh the tools there. If you see duplicates, identify the working entry before removing an unwanted copy; repeating Add is unnecessary.

## Stop approving every tool

The studio tells each app which of its tools only read (inspect, check, view, the lists, notes and waiting for an answer), that every edit can be undone, and that only **set_reference** replaces something for good (the reference photo and its alignment). Apps use this to group the tools and ask less.

- **claude.ai:** open Settings → Connectors, choose the Tastir studio connector, and set its tools to **Always allow**, a whole group at once or one by one. Choosing **Always allow** when a chat asks also lasts for that tool. Disconnect and connect again if the groups still show the old list.
- **ChatGPT, Codex and Antigravity:** each asks in its own way; choose the option that remembers the choice for this app when it asks.

## If something goes wrong

| What you see | What it means and what to do |
| --- | --- |
| The app shows an error containing **The studio does not send sign-ins to** … | The app returns to an address the studio does not know yet. Tell Claude the app's name and the address that follows those words. |
| ChatGPT has no **Advanced settings** or **Developer mode** | The current documented flow starts in **Plugins**. Follow Part 1; those settings are not listed as prerequisites. |
| ChatGPT has no **Create an MCP app** button | The current labels are **Add custom MCP server** and **Create as a plugin**. If those are missing too, follow Part 1's account and workspace checks. |
| ChatGPT lists the plugin but never uses it | Make sure it is installed and connected. Start a new chat, type `@`, and select **Tastir studio** before sending the test. |
| ChatGPT says the connector already exists | Open the existing Tastir plugin and refresh its tools or connect it there. A previous attempt may have created the connector before discovery failed; adding another copy is unnecessary. |
| ChatGPT can read the studio but refuses edits | Keep the exact refusal. Workspace action controls or other account restrictions may apply; use Part 2 to try Codex. |
| ChatGPT says **Authentication succeeded, action discovery failed**, with **Invalid MCP tool schema** | Login worked. ChatGPT rejected one of the studio's tool definitions. Give the agent the tool name; the server needs a schema fix and redeployment. After that, refresh the plugin's tools or retry connecting. Changing Google login settings will not fix this error. |
| Codex says `tastir-online` is not logged in | Run `codex mcp login tastir-online` again. |
| Antigravity shows no **Authenticate** button | The settings file did not save, or a comma is missing. Open it again (Part 3, step 2) and check it against the example. |
| Google says **Access blocked** | You chose a Google account that is not yours, or not on the studio's list. Choose the same account you use for the studio. |
