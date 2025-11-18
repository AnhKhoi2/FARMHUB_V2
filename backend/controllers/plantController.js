// controllers/plantController.js
import { diagnosePlant } from '../services/plantid.js';
import PlantDiagnosis from '../models/PlantDiagnosis.js';

/**
 * POST /api/plant/diagnose
 * body: { imageUrl?: string, base64?: string, plantId?: string, userId?: string }
 */
export const diagnosePlantController = async (req, res, next) => {
  try {
    const { imageUrl, base64, plantId, userId } = req.body || {};

    if (!imageUrl && !base64) {
      return res
        .status(400)
        .json({ error: 'Vui lòng gửi imageUrl hoặc base64.' });
    }

    const result = await diagnosePlant({ imageUrl, base64 });

    const best = result.suggestions?.[0];
    const health = result.health_assessment;
    const storedImageUrl = result.images?.[0]?.url || null;

    const issues = (health?.diseases || [])
      .slice(0, 3)
      .map((d) => ({
        name: d.disease_details?.local_name || d.name || 'Unknown',
        probability: d.probability || 0,
      }));

    const doc = await PlantDiagnosis.create({
      userId: userId || null,
      plantId: plantId || null,
      provider: 'plant.id',

      inputImageUrl: imageUrl || null,
      storedImageUrl,

      plantName:
        best?.plant_details?.scientific_name || best?.plant_name || null,
      plantCommonName: best?.plant_details?.common_names?.[0] || null,
      plantProbability: best?.probability ?? null,

      isHealthy: health?.is_healthy ?? null,
      isHealthyProbability: health?.is_healthy_probability ?? null,

      issues,
      raw: result,
    });

    res.json({
      success: true,
      provider: 'plant.id',
      diagnosisId: doc._id,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
