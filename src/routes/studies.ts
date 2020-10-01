import { Router } from 'express';
import { fetchCountsQuery } from '../query';

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const { project } = req.params;
    const includeStudiesTopHits = true;
    const studies = await fetchCountsQuery(
      project,
      'study__short_name',
      includeStudiesTopHits,
    );
    res.send({ studies: studies });
  } catch (e) {
    next(e);
  }
});

export default router;
