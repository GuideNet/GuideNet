import { Client, Account } from "appwrite"

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("6706e79b0017b779b62c")

const account = new Account(client)

export { client, account }
