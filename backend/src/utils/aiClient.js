import OpenAI from 'openai';
import { getFallbackQuestions } from './fallbackQuestions.js';
import { getFallbackEvaluation } from './fallbackEvaluation.js';

// Cached OpenAI client instance (lazy initialization)
let openaiClient = null;

// Timeout for OpenAI API calls (9 seconds - between 8-10 as requested)
const OPENAI_TIMEOUT_MS = 9000;

/**
 * Create a timeout promise that rejects after specified milliseconds
 * @param {number} ms - Milliseconds to wait before timeout
 * @returns {Promise} Promise that rejects with timeout error
 */
const createTimeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
  });
};

/**
 * Get or initialize OpenAI client instance
 * Reads OPENAI_API_KEY from environment at call time (lazy initialization)
 * @returns {OpenAI} OpenAI client instance
 * @throws {Error} If OPENAI_API_KEY is not set
 */
const getOpenAIClient = () => {
  // Return cached client if already initialized
  if (openaiClient) {
    return openaiClient;
  }

  // Read API key from environment (dotenv.config() should have been called by now)
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables. Please check your .env file.');
  }

  // Initialize OpenAI client
  openaiClient = new OpenAI({
    apiKey: apiKey,
  });
  
  return openaiClient;
};

/**
 * Generate interview questions using OpenAI with timeout and fallback
 * @param {string} role - Job role
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {Promise<{questions: Array<string>, usedFallback: boolean, model?: string}>} Questions and metadata
 */
export const generateQuestions = async (role, difficulty) => {
  let usedFallback = false;
  let modelUsed = null;

  try {
    // Lazy initialization: get client when function is called
    const client = getOpenAIClient();

    const prompt = `Generate 5 ${difficulty} level interview questions for a ${role}. Return ONLY valid JSON in the format: { "questions": [ ... ] }`;

    // Race between OpenAI call and timeout
    const completion = await Promise.race([
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview question generator. Always return valid JSON only, no markdown or additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
      createTimeout(OPENAI_TIMEOUT_MS),
    ]);

    modelUsed = 'gpt-4o-mini';
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validate response structure
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: questions array not found');
    }

    // Validate we have exactly 5 questions
    if (parsed.questions.length !== 5) {
      throw new Error(`Expected 5 questions, got ${parsed.questions.length}`);
    }

    // Validate all questions are strings
    const validQuestions = parsed.questions.filter(q => typeof q === 'string' && q.trim().length > 0);
    if (validQuestions.length !== 5) {
      throw new Error('Some questions are invalid or empty');
    }

    return {
      questions: parsed.questions,
      usedFallback: false,
      model: modelUsed,
    };
  } catch (error) {
    // Log fallback usage internally
    console.warn(`[FALLBACK] OpenAI question generation failed for ${role}/${difficulty}: ${error.message}. Using fallback questions.`);
    usedFallback = true;

    // Return fallback questions
    const fallbackQuestions = getFallbackQuestions(role, difficulty);
    return {
      questions: fallbackQuestions,
      usedFallback: true,
      model: null,
    };
  }
};

/**
 * Evaluate interview answers using OpenAI with timeout and fallback
 * @param {string} role - Job role
 * @param {string} difficulty - Difficulty level
 * @param {Array<string>} questions - Interview questions
 * @param {Array<string>} answers - User's answers
 * @returns {Promise<{evaluation: Object, usedFallback: boolean, model?: string}>} Evaluation and metadata
 */
export const evaluateAnswers = async (role, difficulty, questions, answers) => {
  let usedFallback = false;
  let modelUsed = null;

  try {
    // Lazy initialization: get client when function is called
    const client = getOpenAIClient();

    // Format questions and answers for the prompt
    const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const answersText = answers.map((a, i) => `${i + 1}. ${a}`).join('\n');

    const prompt = `You are an expert interview evaluator. Evaluate the following interview responses for a ${role} position at ${difficulty} difficulty level.

Questions:
${questionsText}

Answers:
${answersText}

Evaluate the candidate's responses and return ONLY valid JSON with this exact structure:
{
  "clarityScore": number (0-100),
  "correctnessScore": number (0-100),
  "communicationScore": number (0-100),
  "strengths": [string],
  "areasForImprovement": [string],
  "overallFeedback": string,
  "perQuestionEvaluations": [
    {
      "clarityScore": number (0-100),
      "correctnessScore": number (0-100),
      "communicationScore": number (0-100),
      "feedback": string
    }
  ]
}

The perQuestionEvaluations array must have exactly ${questions.length} items, one for each question-answer pair. Provide detailed, constructive feedback for each answer.`;

    // Race between OpenAI call and timeout
    const completion = await Promise.race([
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview evaluator. Always return valid JSON only, no markdown or additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
      createTimeout(OPENAI_TIMEOUT_MS),
    ]);

    modelUsed = 'gpt-4o-mini';
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validate response structure
    if (typeof parsed.clarityScore !== 'number' || 
        typeof parsed.correctnessScore !== 'number' || 
        typeof parsed.communicationScore !== 'number') {
      throw new Error('Invalid response format: scores must be numbers');
    }

    // Validate score ranges
    if (parsed.clarityScore < 0 || parsed.clarityScore > 100 ||
        parsed.correctnessScore < 0 || parsed.correctnessScore > 100 ||
        parsed.communicationScore < 0 || parsed.communicationScore > 100) {
      throw new Error('Invalid response format: scores must be between 0 and 100');
    }

    // Validate arrays
    if (!Array.isArray(parsed.strengths) || !Array.isArray(parsed.areasForImprovement)) {
      throw new Error('Invalid response format: strengths and areasForImprovement must be arrays');
    }

    // Validate feedback
    if (typeof parsed.overallFeedback !== 'string') {
      throw new Error('Invalid response format: overallFeedback must be a string');
    }

    // Validate per-question evaluations
    if (!parsed.perQuestionEvaluations || !Array.isArray(parsed.perQuestionEvaluations)) {
      throw new Error('Invalid response format: perQuestionEvaluations must be an array');
    }

    // Validate per-question evaluations length matches number of questions
    if (parsed.perQuestionEvaluations.length !== questions.length) {
      throw new Error(`Invalid response format: perQuestionEvaluations must have exactly ${questions.length} items`);
    }

    // Validate each per-question evaluation
    for (let i = 0; i < parsed.perQuestionEvaluations.length; i++) {
      const qEval = parsed.perQuestionEvaluations[i];
      if (typeof qEval.clarityScore !== 'number' || 
          typeof qEval.correctnessScore !== 'number' || 
          typeof qEval.communicationScore !== 'number') {
        throw new Error(`Invalid response format: perQuestionEvaluations[${i}] scores must be numbers`);
      }
      if (qEval.clarityScore < 0 || qEval.clarityScore > 100 ||
          qEval.correctnessScore < 0 || qEval.correctnessScore > 100 ||
          qEval.communicationScore < 0 || qEval.communicationScore > 100) {
        throw new Error(`Invalid response format: perQuestionEvaluations[${i}] scores must be between 0 and 100`);
      }
      if (typeof qEval.feedback !== 'string') {
        throw new Error(`Invalid response format: perQuestionEvaluations[${i}].feedback must be a string`);
      }
    }

    // Ensure all array items are strings
    parsed.strengths = parsed.strengths.map(s => String(s)).filter(s => s.trim().length > 0);
    parsed.areasForImprovement = parsed.areasForImprovement.map(s => String(s)).filter(s => s.trim().length > 0);

    // Round scores to integers
    parsed.clarityScore = Math.round(Math.max(0, Math.min(100, parsed.clarityScore)));
    parsed.correctnessScore = Math.round(Math.max(0, Math.min(100, parsed.correctnessScore)));
    parsed.communicationScore = Math.round(Math.max(0, Math.min(100, parsed.communicationScore)));

    // Round and validate per-question evaluations
    const perQuestionEvaluations = parsed.perQuestionEvaluations.map((qEval) => ({
      clarityScore: Math.round(Math.max(0, Math.min(100, qEval.clarityScore))),
      correctnessScore: Math.round(Math.max(0, Math.min(100, qEval.correctnessScore))),
      communicationScore: Math.round(Math.max(0, Math.min(100, qEval.communicationScore))),
      feedback: qEval.feedback.trim() || 'No specific feedback provided.',
    }));

    const evaluation = {
      clarityScore: parsed.clarityScore,
      correctnessScore: parsed.correctnessScore,
      communicationScore: parsed.communicationScore,
      strengths: parsed.strengths.length > 0 ? parsed.strengths : ['Demonstrated effort in responses'],
      areasForImprovement: parsed.areasForImprovement.length > 0 ? parsed.areasForImprovement : ['Continue practicing to improve'],
      overallFeedback: parsed.overallFeedback.trim() || 'Thank you for your responses. Keep practicing to improve your interview skills.',
      perQuestionEvaluations,
    };

    return {
      evaluation,
      usedFallback: false,
      model: modelUsed,
    };
  } catch (error) {
    // Log fallback usage internally
    console.warn(`[FALLBACK] OpenAI evaluation failed for ${role}/${difficulty}: ${error.message}. Using fallback evaluation.`);
    usedFallback = true;

    // Return fallback evaluation
    const fallbackEvaluation = getFallbackEvaluation(answers);
    return {
      evaluation: fallbackEvaluation,
      usedFallback: true,
      model: null,
    };
  }
};
