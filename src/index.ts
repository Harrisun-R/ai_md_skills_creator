#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import * as p from '@clack/prompts';
import { generateText } from 'ai';
import { getAIProvider } from './config.js';
import { detectProjectContext } from './detector.js';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('ai-md')
  .description('Generate CLAUDE.md, GEMINI.md, or SKILL.md files using AI.')
  .version('0.2.0')
  .option('-d, --dry-run', 'Preview the generated markdown without saving to a file');

async function getSuggestions(context: string, currentQuestion: string) {
  try {
    const provider = getAIProvider();
    const { text } = await generateText({
      model: provider,
      prompt: `Based on the following context: "${context}", provide 3 brief and helpful suggestions for the question: "${currentQuestion}". 
      Format your response as a simple list, one per line, without numbers or symbols.`,
    });
    return text.split('\n')
      .filter(s => s.trim() !== '')
      .map(s => s.trim().slice(0, 100)) // Guardrail: Max suggestion length
      .slice(0, 3);
  } catch (error: any) {
    // Robustness: Silent failure for suggestions, just return empty list
    return [];
  }
}

/**
 * Sanitizes user input to remove potentially harmful characters
 * or excessive whitespace.
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 1000) // Guardrail: Max input length per field
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Remove control characters
}

async function generateMarkdown(type: string, answers: Record<string, string>) {
  try {
    const provider = getAIProvider();
    
    // Sanitize all answers before sending to AI
    const sanitizedAnswers: Record<string, string> = {};
    for (const [key, value] of Object.entries(answers)) {
      sanitizedAnswers[key] = sanitizeInput(value);
    }

    const prompt = `Generate a concise and professional ${type} file based on these details:
    ${JSON.stringify(sanitizedAnswers, null, 2)}
    
    Structure the output EXACTLY like this (use these headers):
    # ${answers.project_name || 'Project Name'}
    
    ## Objective
    [A brief, clear description of the project goal]
    
    ## Technology Stack
    [Bullet points of the main technologies used]
    
    ## Core Features
    [Bullet points of the key functionalities]
    
    ## Guidelines & Conventions
    [Bullet points of coding standards and patterns]
    
    ## Commands
    [Bullet points of build, test, and dev scripts]
    
    ${type === 'SKILL.md' ? '## Skill Instructions\n[Specific instructions for this skill]\n' : ''}
    
    Requirements:
    1. Output ONLY the markdown content.
    2. Be extremely concise. Use bullet points for lists.
    3. NO conversational fluff.
    4. Ensure it follows the clean and professional "look and feel" of a high-quality instruction file.`;

    const { text } = await generateText({
      model: provider,
      prompt: prompt,
    });

    return text.replace(/^```markdown\n/, '').replace(/\n```$/, '').trim();
  } catch (error: any) {
    throw new Error(`Failed to generate markdown: ${error.message}`);
  }
}

async function run(options: { dryRun?: boolean }) {
  p.intro('AI MD and Skills Creator');

  // Check if provider is configured correctly
  try {
    getAIProvider();
  } catch (error: any) {
    p.log.error(error.message);
    p.log.info('Please set your API keys in a .env file or environment variables.');
    process.exit(1);
  }

  // Auto-Context Detection
  const projectContext = detectProjectContext();
  if (projectContext) {
    p.log.info(`Detected project: ${projectContext.name || 'unknown'}`);
  }

  const fileType = await p.select({
    message: 'What file would you like to create?',
    options: [
      { value: 'CLAUDE.md', label: 'CLAUDE.md' },
      { value: 'GEMINI.md', label: 'GEMINI.md' },
      { value: 'SKILL.md', label: 'SKILL.md' },
    ],
  });

  if (p.isCancel(fileType)) {
    p.outro('Operation cancelled.');
    process.exit(0);
  }

  const answers: Record<string, string> = {};
  const questions = [
    { id: 'project_name', message: 'What is the name of the project?', initial: projectContext?.name },
    { id: 'objective', message: 'What is the main objective or purpose of this project?' },
    { 
      id: 'tech_stack', 
      message: 'What is the technology stack? (e.g., Node.js, TypeScript, React)', 
      initial: projectContext ? [...(projectContext.dependencies || []), ...(projectContext.devDependencies || [])].slice(0, 8).join(', ') : undefined 
    },
    { id: 'core_features', message: 'What are the core features? (comma separated)' },
    { id: 'conventions', message: 'What are the main coding conventions and standards?' },
    { id: 'scripts', message: 'What are the main build, test, and development commands?' },
  ];

  if (fileType === 'SKILL.md') {
    questions.push({ id: 'skill_description', message: 'What is the specific behavior or instruction for this skill?' });
  }

  for (const q of questions) {
    const context = JSON.stringify({ ...answers, detected: projectContext });
    const sLoading = p.spinner();
    sLoading.start('Fetching suggestions...');
    const suggestions = await getSuggestions(context, q.message);
    sLoading.stop('Suggestions ready.');

    const choice = await p.select({
      message: q.message,
      initialValue: q.initial,
      options: [
        ...(q.initial ? [{ value: q.initial, label: `Auto-detected: ${q.initial}` }] : []),
        ...suggestions.map(s => ({ value: s, label: s })),
        { value: 'custom', label: 'Enter custom answer...' },
      ],
    });

    if (p.isCancel(choice)) {
      p.outro('Operation cancelled.');
      process.exit(0);
    }

    if (choice === 'custom') {
      const customValue = await p.text({
        message: 'Your answer:',
        defaultValue: q.initial,
        validate: (value) => {
          if (!value && !q.initial) return 'Value is required.';
          if (value.length > 1000) return 'Input is too long (max 1000 characters).';
        },
      });
      if (p.isCancel(customValue)) {
        p.outro('Operation cancelled.');
        process.exit(0);
      }
      answers[q.id] = sanitizeInput((customValue as string) || (q.initial as string));
    } else {
      answers[q.id] = sanitizeInput(choice as string);
    }
  }

  const sGenerating = p.spinner();
  sGenerating.start(`Generating ${fileType}...`);
  let markdown = '';
  try {
    markdown = await generateMarkdown(fileType as string, answers);
  } catch (error: any) {
    sGenerating.stop('Generation failed.');
    p.log.error(error.message);
    process.exit(1);
  }
  sGenerating.stop('Markdown generated.');

  if (options.dryRun) {
    p.note(markdown, `Preview of ${fileType}`);
    p.outro('Dry run complete. No file was saved.');
  } else {
    const filePath = path.join(process.cwd(), fileType as string);
    fs.writeFileSync(filePath, markdown);
    p.outro(`Successfully created ${fileType} at ${filePath}`);
  }
}

program
  .action((options) => {
    run(options).catch(console.error);
  });

program.parse();
