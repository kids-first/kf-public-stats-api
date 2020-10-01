import { Router } from 'express';
import { fetchCountsQuery } from '../query';

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const { project } = req.params;
    const diagnoses = await fetchCountsQuery(project, 'diagnoses__diagnosis');
    res.send({ diagnoses: diagnoses });
  } catch (e) {
    next(e);
  }
});

export default router;
