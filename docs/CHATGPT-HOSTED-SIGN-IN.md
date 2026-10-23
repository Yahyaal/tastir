# Set up ChatGPT sign-in for Tastir

The website is deployed and the database is ready. Follow these steps in order. You do not need to run any commands.

## 1. Check your email for OpenAI's approval

- Open your email inbox. Search for **Sign in with ChatGPT**, then search for **oaiapp_**.
- Look for an OpenAI reply approving **Tastir's website** and providing a **client ID**. It may start with `oaiapp_`.
- If you have that reply, go to **step 3**.
- If you cannot find it, do **step 2**. Having a ChatGPT subscription or using the local assistant does not confirm website approval.

## 2. Request access if you do not already have it

- Open [OpenAI's request form](https://openai.com/form/sign-in-with-chatgpt-interest/).
- Enter your own name and email. For **Company name**, enter `Tastir`.
- For **Website URL**, enter `https://tastir-studio.vercel.app`.
- Select **Sign in and ChatGPT plan use for AI requests**, since you also want the chatbot.
- In the product description box, paste this:

  ```text
  Tastir is a web app for learning and drawing Islamic geometric patterns. I want people to sign in with ChatGPT and use their ChatGPT plan with an in-app drawing assistant.

  Website: https://tastir-studio.vercel.app
  Sign-in callback URL: https://tastir-studio.vercel.app/auth/openai/callback

  Please provide the website client ID, the registered token authentication method (none or client_secret_basic), and a client secret if required.
  ```

- Click **Submit**.
- **Wait for OpenAI to approve the request and provide the client details before continuing.** Submitting the form does not turn sign-in on.

## 3. Check the details OpenAI sends you

- Find the **website client ID** in OpenAI's reply.
- Find the **token authentication method**: it must be `none` or `client_secret_basic`.
- If the method is `client_secret_basic`, also find the **client secret**.
- Check that OpenAI has registered this exact callback: `https://tastir-studio.vercel.app/auth/openai/callback`.
- If any of those details are missing, reply to OpenAI's email with this text, then wait for their answer:

  ```text
  Please confirm Tastir's website client ID and whether its token authentication method is none or client_secret_basic. If a secret is required, please provide it through your secure channel. Please also confirm this registered callback URL: https://tastir-studio.vercel.app/auth/openai/callback
  ```

## 4. Add the details to Vercel

- Open [Tastir's Environment Variables page](https://vercel.com/yahyaal-gmailcoms-projects/tastir/settings/environment-variables) and sign in to Vercel if asked.
- If it opens the project overview instead, click **Environment Variables** in the left sidebar. Make sure the project is **tastir**.
- In the add-variable form, enter **Name** `OPENAI_SIGN_IN_CLIENT_ID`. In **Value**, paste the website client ID OpenAI gave you. Select **Production** only, then click **Save**.
- Add another variable: **Name** `OPENAI_SIGN_IN_TOKEN_AUTH_METHOD`. For **Value**, enter the exact method OpenAI confirmed: `none` or `client_secret_basic`. Select **Production** only, then click **Save**.
- **Only if the method is `client_secret_basic`:** add **Name** `OPENAI_SIGN_IN_CLIENT_SECRET`. For **Value**, paste the client secret OpenAI provided. Select **Production** only, then click **Save**.
- **If the method is `none`:** leave `OPENAI_SIGN_IN_CLIENT_SECRET` absent. If you previously added it, remove that variable using its **⋯** menu → **Delete**.
- Leave the existing Google and database settings as they are.

## 5. Make the live site use the new settings

- Open [Tastir's Deployments page](https://vercel.com/yahyaal-gmailcoms-projects/tastir/deployments).
- Find the newest deployment for **main** marked **Production**.
- Open its **⋯** menu and click **Redeploy**.
- In the confirmation window, keep the destination as **Production** and click **Redeploy**.
- Wait until the new deployment says **Ready**.

## 6. Link your account and try it

- Open [Tastir Studio](https://tastir-studio.vercel.app/#/studio).
- Click **Sign in with Google** and use the Google account you already use for Tastir.
- Open [Connections](https://tastir-studio.vercel.app/connections).
- Click **Link ChatGPT account**. Follow OpenAI's sign-in prompts using the ChatGPT account you want to link.
- When you return to Connections, check that it says **Your ChatGPT account is linked**.
- Click **Sign out**.
- Open [Tastir Studio](https://tastir-studio.vercel.app/#/studio) again. Click **Continue with ChatGPT**.
- You should arrive in the Studio with your existing projects.

## If a step does not work

- **No approval or client ID from OpenAI:** finish step 2 and wait for their reply. Vercel cannot provide these details.
- **No Continue with ChatGPT button:** go back to step 4, check the variable names and Production selection, then repeat step 5. Refresh the Studio page afterward.
- **OpenAI reports a callback or redirect error:** reply to OpenAI's registration email and ask them to register `https://tastir-studio.vercel.app/auth/openai/callback` exactly.
- **ChatGPT sign-in returns an error in Tastir:** repeat step 6 starting with Google, so your existing owner account is linked first. If it still fails, tell me the exact message.
- **Sign-in works but there is no chatbot:** these steps enable sign-in. Connecting the hosted chatbot is separate work after OpenAI grants the requested plan-use access.
