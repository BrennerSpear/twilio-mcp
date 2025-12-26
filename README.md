# twilio-mcp

Simple MCP server for sending SMS via Twilio. Pure TypeScript, no build step.

> **Why this exists:** The [official Twilio MCP](https://github.com/twilio-labs/mcp) has a [bug](https://github.com/twilio-labs/mcp/issues/42) that causes invalid tool schemas, making it unusable with Claude. This is a minimal alternative that just works.

## Usage

```
npx tsx src/index.ts --account-sid <sid> --auth-token <token> --messaging-service-sid <sid> [--default-to <number>]
```

### Arguments

- `--account-sid` - Twilio Account SID (required)
- `--auth-token` - Twilio Auth Token (required)
- `--messaging-service-sid` - Twilio Messaging Service SID (required)
- `--default-to` - Default recipient phone number (optional)

## Claude Code Configuration

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "twilio": {
      "command": "npx",
      "args": [
        "tsx",
        "/path/to/twilio-mcp/src/index.ts",
        "--account-sid", "YOUR_ACCOUNT_SID",
        "--auth-token", "YOUR_AUTH_TOKEN",
        "--messaging-service-sid", "YOUR_MESSAGING_SERVICE_SID",
        "--default-to", "+1987654321"
      ]
    }
  }
}
```

## Tools

### send_text

Send an SMS message.

**Parameters:**
- `to` (optional if `--default-to` is set) - Recipient phone number in E.164 format
- `message` (required) - The text message to send
