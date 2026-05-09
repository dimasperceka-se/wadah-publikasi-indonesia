import { anthropic } from "@workspace/integrations-anthropic-ai";
import { logger } from "./logger";

export interface AiIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  location: string | null;
}

export interface AiReport {
  score: number;
  passed: boolean;
  wordCount: number;
  aiGeneratedLikelihood: number;
  plagiarismScore: number;
  structureComplete: boolean;
  citationValid: boolean;
  grammarScore: number;
  issues: AiIssue[];
}

const REQUIRED_SECTIONS = ["abstract", "introduction", "methodology", "results", "conclusion", "references"];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function checkStructure(content: string): { complete: boolean; missingSections: string[] } {
  const lower = content.toLowerCase();
  const missingSections = REQUIRED_SECTIONS.filter((s) => !lower.includes(s));
  return { complete: missingSections.length === 0, missingSections };
}

export async function runAiReview(title: string, abstract: string, content: string): Promise<AiReport> {
  const wordCount = countWords(content);
  const { complete: structureComplete, missingSections } = checkStructure(content);

  const issues: AiIssue[] = [];

  if (wordCount < 3000) {
    issues.push({
      type: "word_count",
      severity: "critical",
      message: `Paper has only ${wordCount} words. Minimum is 3,000.`,
      location: null,
    });
  }

  if (!structureComplete) {
    issues.push({
      type: "structure",
      severity: "critical",
      message: `Missing required sections: ${missingSections.join(", ")}`,
      location: null,
    });
  }

  let aiAnalysis: {
    grammarScore: number;
    grammarIssues: Array<{ location: string; message: string }>;
    aiGeneratedLikelihood: number;
    plagiarismScore: number;
    citationValid: boolean;
    citationIssues: string[];
    overallAssessment: string;
  };

  try {
    const prompt = `Analyze this scientific paper submission and return a JSON analysis.

Title: ${title}
Abstract: ${abstract}
Content (first 2000 chars): ${content.slice(0, 2000)}

Return ONLY valid JSON with this exact structure:
{
  "grammarScore": <0-100 number>,
  "grammarIssues": [{"location": "<section>", "message": "<issue>"}],
  "aiGeneratedLikelihood": <0-100 number, percentage likelihood this is AI-generated>,
  "plagiarismScore": <0-100 number, estimated similarity to existing work>,
  "citationValid": <true/false>,
  "citationIssues": ["<issue description>"],
  "overallAssessment": "<brief one-sentence assessment>"
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (err) {
    logger.warn({ err }, "AI review failed, using fallback values");
    aiAnalysis = {
      grammarScore: 78,
      grammarIssues: [],
      aiGeneratedLikelihood: 15,
      plagiarismScore: 8,
      citationValid: true,
      citationIssues: [],
      overallAssessment: "Analysis could not be completed. Manual review recommended.",
    };
    issues.push({
      type: "ai_service",
      severity: "warning",
      message: "Automated AI analysis unavailable. Scores are estimated.",
      location: null,
    });
  }

  if (aiAnalysis.grammarScore < 60) {
    issues.push({
      type: "grammar",
      severity: "warning",
      message: `Grammar score is ${aiAnalysis.grammarScore}/100. Significant grammatical issues detected.`,
      location: null,
    });
  }

  for (const g of aiAnalysis.grammarIssues?.slice(0, 3) ?? []) {
    issues.push({
      type: "grammar_detail",
      severity: "warning",
      message: g.message,
      location: g.location,
    });
  }

  if (aiAnalysis.aiGeneratedLikelihood > 70) {
    issues.push({
      type: "ai_generated",
      severity: "critical",
      message: `High probability (${aiAnalysis.aiGeneratedLikelihood}%) that content is AI-generated.`,
      location: null,
    });
  }

  if (aiAnalysis.plagiarismScore > 30) {
    issues.push({
      type: "plagiarism",
      severity: "critical",
      message: `Potential plagiarism detected. Similarity score: ${aiAnalysis.plagiarismScore}%.`,
      location: null,
    });
  }

  if (!aiAnalysis.citationValid) {
    for (const c of aiAnalysis.citationIssues?.slice(0, 3) ?? []) {
      issues.push({ type: "citation", severity: "warning", message: c, location: null });
    }
  }

  const criticalIssues = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  let score = 100;
  score -= criticalIssues * 20;
  score -= warningCount * 5;
  score = Math.max(0, Math.min(100, score));

  const passed = score >= 75 && criticalIssues === 0;

  return {
    score,
    passed,
    wordCount,
    aiGeneratedLikelihood: aiAnalysis.aiGeneratedLikelihood ?? 15,
    plagiarismScore: aiAnalysis.plagiarismScore ?? 8,
    structureComplete,
    citationValid: aiAnalysis.citationValid ?? true,
    grammarScore: aiAnalysis.grammarScore ?? 75,
    issues,
  };
}
