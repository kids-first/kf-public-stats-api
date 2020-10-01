import { Router } from 'express';
import { fetchCountsQuery } from '../query';

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const { project } = req.params;
    const phenotypes = await fetchCountsQuery(
      project,
      'phenotype__hpo_phenotype_observed_text',
    );
    res.send({ phenotypes: phenotypes });
  } catch (e) {
    next(e);
  }
});

export default router;
