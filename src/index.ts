#!/usr/bin/env npx tsx

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import Twilio from "twilio"
import { z } from "zod"

// Parse command line arguments
function parseArgs(args: string[]) {
	const config = {
		accountSid: "",
		authToken: "",
		messagingServiceSid: "",
		defaultTo: "",
	}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		const next = args[i + 1]

		if (arg === "--account-sid" && next) {
			config.accountSid = next
			i++
		} else if (arg === "--auth-token" && next) {
			config.authToken = next
			i++
		} else if (arg === "--messaging-service-sid" && next) {
			config.messagingServiceSid = next
			i++
		} else if (arg === "--default-to" && next) {
			config.defaultTo = next
			i++
		}
	}

	return config
}

const config = parseArgs(process.argv.slice(2))

if (!config.accountSid || !config.authToken || !config.messagingServiceSid) {
	console.error(
		"Usage: twilio-mcp --account-sid <sid> --auth-token <token> --messaging-service-sid <sid> [--default-to <number>]",
	)
	process.exit(1)
}

const twilioClient = Twilio(config.accountSid, config.authToken)

const server = new McpServer({
	name: "twilio-mcp",
	version: "0.1.0",
})

server.tool(
	"send_text",
	{
		to: z
			.string()
			.optional()
			.describe(
				`Phone number to send to (E.164 format, e.g. +19175551234)${config.defaultTo ? `. Defaults to ${config.defaultTo}` : ""}`,
			),
		message: z.string().describe("The text message to send"),
	},
	async ({ to, message }) => {
		const recipient = to || config.defaultTo

		if (!recipient) {
			return {
				content: [
					{
						type: "text",
						text: "Error: No recipient specified and no default configured",
					},
				],
				isError: true,
			}
		}

		if (!message) {
			return {
				content: [{ type: "text", text: "Error: Message is required" }],
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
				content: [
					{
						type: "text",
						text: `Message sent successfully!\nSID: ${result.sid}\nTo: ${result.to}\nStatus: ${result.status}`,
					},
				],
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			return {
				content: [
					{ type: "text", text: `Failed to send message: ${errorMessage}` },
				],
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
