import * as express from 'express';
import searchMembers from '../services/searchMembers';

const router = express.Router({ mergeParams: true });

/**
 *  ----- Routes -----
 * */

router.get('/', async (req, res, next) => {
  try {
    const counts = await searchMembers.getInterestCounts();
    res.send(counts);
  } catch (e) {
    next(e);
  }
});

export default router;
