import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: ['easy', 'medium', 'hard'],
      lowercase: true,
    },
    questions: {
      type: [String],
      default: [],
    },
    answers: {
      type: [String],
      default: [],
    },
    evaluation: {
      clarityScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      correctnessScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      communicationScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      strengths: {
        type: [String],
        default: [],
      },
      areasForImprovement: {
        type: [String],
        default: [],
      },
      overallFeedback: {
        type: String,
        default: '',
      },
      perQuestionEvaluations: {
        type: [
          {
            clarityScore: {
              type: Number,
              min: 0,
              max: 100,
            },
            correctnessScore: {
              type: Number,
              min: 0,
              max: 100,
            },
            communicationScore: {
              type: Number,
              min: 0,
              max: 100,
            },
            feedback: {
              type: String,
              default: '',
            },
          },
        ],
        default: [],
      },
    },
    strongestQuestionIndex: {
      type: Number,
      default: null,
    },
    weakestQuestionIndex: {
      type: Number,
      default: null,
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    aiUsage: {
      type: [
        {
          model: {
            type: String,
            default: '',
          },
          promptType: {
            type: String,
            enum: ['question_generation', 'evaluation'],
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
      select: false, // Not exposed in API responses
    },
  },
  {
    timestamps: false, // We're using createdAt manually
  }
);

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;
