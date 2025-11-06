import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: String, enum: ['vip','pro'], required: true },
  amount: { type: Number, required: true }, // VND
  currency: { type: String, default: 'VND' },
  status: { type: String, enum: ['pending','success','failed'], default: 'pending', index: true },
  vnpTxnRef: { type: String, required: true, unique: true },
  vnpResponseCode: { type: String },
  vnpTransactionNo: { type: String },
  vnpBankCode: { type: String },
  vnpPayDate: { type: String },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
