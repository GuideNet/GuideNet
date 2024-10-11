import { Client, Account } from "appwrite"

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)

const account = new Account(client)

export { client, account }
