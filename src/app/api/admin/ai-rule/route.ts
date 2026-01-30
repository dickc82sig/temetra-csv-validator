/**
 * AI Rule Generation API Route
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Takes a natural language rule description and uses Claude to generate
 * both a regex pattern and a human-readable rule description.
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const { description, columnName, dataType, example } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Please provide a rule description.' },
        { status: 400 }
      );
    }

    const prompt = `You are a CSV validation rule expert. A user wants to create a validation rule for a CSV column using plain English. Your job is to convert their description into a regex pattern.

Column Name: ${columnName || 'Unknown'}
Data Type: ${dataType || 'text'}
${example ? `Example Valid Value: ${example}` : ''}

User's Rule Description (plain English):
"${description}"

Return ONLY a JSON object with these fields:
- "regex": The JavaScript-compatible regex pattern string (without surrounding slashes). The pattern should match VALID values. If the rule cannot be expressed as regex (e.g., "must be greater than 100"), return null for regex and explain in the description.
- "description": A clean, concise version of the rule for display in error messages (e.g., "Must be a US ZIP code (5 or 9 digits)")
- "example": An example value that would pass this rule

Return ONLY valid JSON, no markdown or extra text.

Examples:
- Input: "should only allow yes, no, or maybe"
  Output: {"regex": "^(Yes|No|Maybe)$", "description": "Must be Yes, No, or Maybe", "example": "Yes"}

- Input: "needs to be a valid email address"
  Output: {"regex": "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", "description": "Must be a valid email address", "example": "user@example.com"}

- Input: "has to start with 2 letters followed by numbers"
  Output: {"regex": "^[A-Za-z]{2}\\d+$", "description": "Must start with 2 letters followed by numbers", "example": "AB12345"}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => {
        if (block.type === 'text') {
          return block.text;
        }
        return '';
      })
      .join('');

    // Parse the JSON response
    let jsonText = responseText.trim();
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const result = JSON.parse(jsonText);

    // Validate the regex if provided
    if (result.regex) {
      try {
        new RegExp(result.regex);
      } catch {
        return NextResponse.json(
          { error: 'AI generated an invalid regex pattern. Please try rephrasing your rule.' },
          { status: 422 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      regex: result.regex || null,
      description: result.description || description,
      example: result.example || '',
    });
  } catch (error) {
    console.error('AI rule generation error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate rule' },
      { status: 500 }
    );
  }
}
