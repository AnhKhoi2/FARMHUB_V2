import mongoose from 'mongoose';

const AIChatMessage = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    text: { type: String, trim: true },
    cause: { type: String, trim: true },
    treatment: { type: String, trim: true },
    provider: { type: String, trim: true }
  },
  { _id: false }
);

const AIChatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: { type: [AIChatMessage], default: [] },
    provider: { type: String, trim: true }
  },
  { timestamps: true }
);

AIChatSessionSchema.index({ user: 1, updatedAt: -1 });

const AIChatSession = mongoose.model('AIChatSession', AIChatSessionSchema);
export default AIChatSession;
