#!/usr/bin/env npx tsx

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import Twilio from "twilio"
import { z } from "zod"

const config = {
	accountSid: process.env.TWILIO_ACCOUNT_SID || "",
	authToken: process.env.TWILIO_AUTH_TOKEN || "",
	messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || "",
	defaultTo: process.env.TWILIO_DEFAULT_TO || "",
}

if (!config.accountSid || !config.authToken || !config.messagingServiceSid) {
	console.error("Missing Twilio credentials. Set these environment variables:")
	console.error("  TWILIO_ACCOUNT_SID")
	console.error("  TWILIO_AUTH_TOKEN")
	console.error("  TWILIO_MESSAGING_SERVICE_SID")
	console.error("  TWILIO_DEFAULT_TO  (optional)")
	process.exit(1)
}

const twilioClient = Twilio(config.accountSid, config.authToken)

const server = new McpServer({
	name: "twilio-mcp",
	version: "1.0.0",
})

server.registerTool(
	"send_text",
	{
		title: "Send SMS",
		description: "Send an SMS text message via Twilio",
		inputSchema: {
			to: z
				.string()
				.optional()
				.describe(
					`Phone number to send to (E.164 format, e.g. +19175551234)${config.defaultTo ? `. Defaults to ${config.defaultTo}` : ""}`,
				),
			message: z.string().describe("The text message to send"),
		},
	},
	async ({ to, message }) => {
		const recipient = to || config.defaultTo

		if (!recipient) {
			return {
				content: [{ type: "text" as const, text: "Error: No recipient specified and no default configured" }],
				isError: true,
			}
		}

		if (!message) {
			return {
				content: [{ type: "text" as const, text: "Error: Message is required" }],
				isError: true,
			}
		}

		try {
			const result = await twilioClient.messages.create({
				body: message,
				messagingServiceSid: config.messagingServiceSid,
				to: recipient,
			})

			return {
				content: [{ type: "text" as const, text: `Message sent successfully!\nSID: ${result.sid}\nTo: ${result.to}\nStatus: ${result.status}` }],
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			return {
				content: [{ type: "text" as const, text: `Failed to send message: ${errorMessage}` }],
				isError: true,
			}
		}
	},
)

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
}

main().catch(console.error)
