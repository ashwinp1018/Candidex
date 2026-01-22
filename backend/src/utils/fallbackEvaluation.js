/**
 * Fallback evaluation when AI service is unavailable
 * Returns a reasonable default evaluation based on answer quality
 */

/**
 * Generate fallback evaluation based on answer quality
 * @param {Array<string>} answers - User's answers
 * @returns {Object} Evaluation object with scores and feedback
 */
export const getFallbackEvaluation = (answers) => {
  // Simple heuristic: analyze answer lengths and quality
  const answerQuality = answers.map((answer) => {
    if (!answer || answer.trim().length < 10) return 0.3;
    if (answer.length < 50) return 0.5;
    if (answer.length < 150) return 0.75;
    return 0.9;
  });

  const averageQuality = answerQuality.reduce((a, b) => a + b, 0) / answerQuality.length;
  const baseScore = Math.round(50 + averageQuality * 40);

  // Generate scores with slight variation
  const clarityScore = Math.min(100, Math.max(40, baseScore + Math.floor(Math.random() * 15) - 7));
  const correctnessScore = Math.min(100, Math.max(40, baseScore + Math.floor(Math.random() * 15) - 7));
  const communicationScore = Math.min(100, Math.max(40, baseScore + Math.floor(Math.random() * 15) - 7));

  // Generate strengths
  const strengths = [];
  if (clarityScore >= 70) {
    strengths.push('Clear and articulate communication');
  }
  if (correctnessScore >= 70) {
    strengths.push('Demonstrated knowledge in responses');
  }
  if (communicationScore >= 70) {
    strengths.push('Effective explanation of concepts');
  }
  if (strengths.length === 0) {
    strengths.push('Demonstrated effort in responses');
  }

  // Generate areas for improvement
  const areasForImprovement = [];
  if (clarityScore < 70) {
    areasForImprovement.push('Work on articulating thoughts more clearly');
  }
  if (correctnessScore < 70) {
    areasForImprovement.push('Enhance technical depth and accuracy');
  }
  if (communicationScore < 70) {
    areasForImprovement.push('Improve communication and explanation skills');
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push('Continue practicing to maintain high performance');
  }

  // Generate overall feedback
  const overallScore = Math.round((clarityScore + correctnessScore + communicationScore) / 3);
  let overallFeedback = '';
  if (overallScore >= 80) {
    overallFeedback = 'Good performance overall. You demonstrated solid understanding and communication skills.';
  } else if (overallScore >= 65) {
    overallFeedback = 'Adequate performance. There is room for improvement in clarity, correctness, and communication.';
  } else {
    overallFeedback = 'Your responses need improvement. Focus on providing more detailed answers and enhancing communication clarity.';
  }

  return {
    clarityScore,
    correctnessScore,
    communicationScore,
    strengths,
    areasForImprovement,
    overallFeedback,
  };
};
