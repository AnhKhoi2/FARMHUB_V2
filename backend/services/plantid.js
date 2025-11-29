import { http } from '../lib/http.js';
import { ApiError } from '../lib/http.js';

const PLANT_ID_URL = 'https://api.plant.id/v2/identify';

export async function diagnosePlant({ imageUrl, base64 }) {
  const apiKey = process.env.PLANT_ID_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'Server thiếu PLANT_ID_API_KEY (Plant.id).');
  }

  if (!imageUrl && !base64) {
    throw new ApiError(400, 'Thiếu ảnh (imageUrl hoặc base64).');
  }

  const images = [];

  if (base64) {
    const m = base64.match(/^data:.*;base64,(.*)$/);
    images.push(m ? m[1] : base64);
  } else if (imageUrl) {
    images.push(imageUrl);
  }

  try {
    const { data } = await http.post(
      PLANT_ID_URL,
      {
        images,
        modifiers: ['health_all', 'similar_images'],
        plant_details: [
          'common_names',
          'url',
          'watering',
          'care',
          'wiki_description',
          'taxonomy',
        ],
      },
      {
        headers: {
          'Api-Key': apiKey,
        },
      }
    );

    return data;
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data || err.message;

    console.error('Plant.id error >>>', status, detail);

    throw new ApiError(
      status,
      typeof detail === 'string' ? detail : `Plant.id error (${status})`
    );
  }
}
