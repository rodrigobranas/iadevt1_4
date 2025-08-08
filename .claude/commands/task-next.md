You are an AI assistant responsible for managing a software development project. Your task is to identify the next available task, perform necessary setup, and prepare to begin work on that task. You will be provided with two key pieces of information:

<requirements>
- **YOU MUST** use Context7 mcp to get informations about libraries
</requirements>

<arguments>$ARGUMENTS</arguments>
<arguments_table>
| Argument | Description         | Example         |
|----------|---------------------|-----------------|
| --prd    | PRD identifier      | --prd=authsystem |
| --task   | Task identifier     | --task=45       |
</arguments_table>
<task_info>
Task: ./tasks/prd-[$prd]/[$task]_task.md
</task_info>
<prd_info>
PRD: ./tasks/prd-[$prd]/\_prd.md
</prd_info>
<techspec_info>
Tech Spec: ./tasks/prd-[$prd]/\_techspec.md
</techspec_info>
<project_rules>.cursor/rules</project_rules>

<requirements>
- **YOU MUST** need to start the implementation right after the entire process above
</requirements>

Please follow these steps to identify and prepare for the next available task:

1. Scan the task directories provided in tasks/prd-[$prd] for task files.
2. Identify the next uncompleted task by finding the first unchecked checkbox in the task files.
3. Once you've identified the next task, perform the following pre-task setup:
   a. Read the task definition from <task_info>
   b. Review the PRD context from <prd_info>
   c. Check the tech spec requirements from <techspec_info>
   d. Read the specific task file to understand what needs to be done in the task
   e. Understand dependencies from previously completed tasks

4. After completing the pre-task setup, analyze the information you've gathered. Wrap your analysis in <task_analysis> tags, considering the following:
   - List out the task files you found and quote relevant sections from each file
   - The main objectives of the task
   - How the task fits into the broader project context
   - Any potential challenges, risks, or dependencies
   - How the task aligns with the project rules and standards
   - Brainstorm possible solutions or approaches to the task

5. Provide a summary of the task and its requirements in the following format:

<task_summary>
Task ID: [Provide the task ID or number]
Task Name: [Provide the name or brief description of the task]
PRD Context: [Summarize key points from the PRD]
Tech Spec Requirements: [List the main technical requirements]
Dependencies: [List any dependencies on previous tasks]
Main Objectives: [Outline the primary goals of the task]
Potential Risks/Challenges: [List any identified risks or challenges]
</task_summary>

6. Next, provide a plan for approaching the task:

<task_approach>
1. [First step in approaching the task]
2. [Second step in approaching the task]
3. [Continue with additional steps as needed]
</task_approach>

Important Notes:

- Always verify against the PRD, tech specs, and task file. Do not make assumptions.
- Implement proper solutions without using workarounds, especially in tests.
- Adhere to all established project standards as outlined in the <project_rules> provided.
- Do not consider the task complete until you've followed the @.claude/commands/task-review.md process.

After providing the task summary and approach, immediately begin implementing the task:

<task_implementation>
Now I will begin implementing this task following the approach outlined above.
</task_implementation>

Then proceed to actually implement the task by:
- Running necessary commands
- Making code changes
- Following the established project patterns
- Ensuring all requirements are met

Example Output Structure (generic, without specific content):

<task_analysis>
[Your detailed analysis of the task, including file quotes, context, challenges, and brainstormed solutions]
</task_analysis>

<task_summary>
Task ID: [ID]
Task Name: [Name]
PRD Context: [Context summary]
Tech Spec Requirements: [Requirements list]
Dependencies: [Dependencies list]
Main Objectives: [Objectives list]
Potential Risks/Challenges: [Risks/Challenges list]
</task_summary>

<task_approach>
1. [Step 1]
2. [Step 2]
3. [Step 3]
</task_approach>

<task_implementation>
Now I will begin implementing this task following the approach outlined above.
</task_implementation>

[Continue with actual task implementation...]

<requirements>
- **YOU MUST** need to start the implementation right after the entire process above
- **YOU MUST** use Context7 mcp to get informations about libraries
</requirements>
