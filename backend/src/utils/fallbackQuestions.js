/**
 * Fallback interview questions when AI service is unavailable
 * Returns static questions based on role and difficulty
 */

const fallbackQuestions = {
  easy: {
    general: [
      'Tell me about yourself and your background.',
      'What interests you most about this role?',
      'What are your key strengths?',
      'Where do you see yourself in 5 years?',
      'Why should we consider you for this position?',
    ],
    technical: [
      'What programming languages are you most comfortable with?',
      'Describe a project you recently worked on.',
      'How do you approach problem-solving?',
      'What development tools do you use regularly?',
      'How do you stay updated with technology trends?',
    ],
    business: [
      'What experience do you have in this industry?',
      'How do you handle tight deadlines?',
      'Describe a time you worked in a team.',
      'What motivates you in your work?',
      'How do you prioritize your tasks?',
    ],
  },
  medium: {
    general: [
      'Describe a challenging project you worked on. How did you handle it?',
      'How do you stay updated with industry trends?',
      'Can you explain a time when you had to work under pressure?',
      'What tools and technologies are you most comfortable with?',
      'How do you handle feedback and criticism?',
    ],
    technical: [
      'Explain a complex technical problem you solved recently.',
      'How do you ensure code quality in your projects?',
      'Describe your experience with version control and collaboration.',
      'What is your approach to debugging complex issues?',
      'How do you balance technical debt with feature delivery?',
    ],
    business: [
      'Describe a situation where you had to make a difficult decision.',
      'How do you handle conflicting priorities?',
      'Explain a time you had to learn something new quickly.',
      'How do you communicate technical concepts to non-technical stakeholders?',
      'Describe your experience with agile methodologies.',
    ],
  },
  hard: {
    general: [
      'Design a scalable system for a specific challenge. Walk me through your approach.',
      'How would you optimize a performance bottleneck? Discuss trade-offs.',
      'Describe a time when you had to make a difficult technical decision. What was your process?',
      'How do you approach architecting a new system from scratch?',
      'Explain how you would mentor a junior team member.',
    ],
    technical: [
      'How would you design a distributed system to handle high traffic?',
      'Explain your approach to database optimization and scaling.',
      'Describe how you would implement a microservices architecture.',
      'How do you handle system reliability and fault tolerance?',
      'Explain your approach to security in application development.',
    ],
    business: [
      'How would you lead a team through a major technical migration?',
      'Describe your approach to technical strategy and planning.',
      'How do you balance innovation with stability in production systems?',
      'Explain how you would handle a critical production incident.',
      'Describe your experience with cost optimization in cloud infrastructure.',
    ],
  },
};

/**
 * Get fallback questions based on role and difficulty
 * @param {string} role - Job role
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {Array<string>} Array of 5 questions
 */
export const getFallbackQuestions = (role, difficulty) => {
  const normalizedDifficulty = difficulty.toLowerCase();
  const normalizedRole = role.toLowerCase();

  // Determine question category based on role keywords
  let category = 'general';
  if (normalizedRole.includes('developer') || 
      normalizedRole.includes('engineer') || 
      normalizedRole.includes('programmer') ||
      normalizedRole.includes('software') ||
      normalizedRole.includes('technical')) {
    category = 'technical';
  } else if (normalizedRole.includes('manager') || 
             normalizedRole.includes('business') ||
             normalizedRole.includes('product') ||
             normalizedRole.includes('analyst')) {
    category = 'business';
  }

  // Get questions for the category and difficulty
  const questions = fallbackQuestions[normalizedDifficulty]?.[category] || 
                    fallbackQuestions[normalizedDifficulty]?.general ||
                    fallbackQuestions.easy.general;

  // Always return exactly 5 questions
  return questions.slice(0, 5);
};
