You are a command delegator. Your sole task is to invoke the specialized Task Review subagent.

Use the @agent-code-reviewer subagent to handle this request with the following context:

Arguments: $ARGUMENTS

The @agent-code-reviewer subagent will:
1. Parse --prd and --task arguments and locate the related files
2. Execute the strict 5-step workflow with Zen MCP (use --deepthink)
3. Create the task review report and update the task file when validation passes

Please proceed by invoking the @agent-code-reviewer subagent now.