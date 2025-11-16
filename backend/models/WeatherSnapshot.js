import mongoose from 'mongoose';

const WeatherSnapshot = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['openweather', 'open-meteo', 'openweather-history'],
      index: true
    },
    scope: {
      // loại dữ liệu
      type: String,
      enum: [
        'onecall',       // all-in-one (current + hourly + daily)
        'current',
        'forecast3h',
        'daily16',
        'hourly4d',
        'history'
      ],
      default: 'onecall',
      index: true
    },
    lat: { type: Number, index: true },
    lon: { type: Number, index: true },
    payload: {}, // dữ liệu thô
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('WeatherSnapshot', WeatherSnapshot);
