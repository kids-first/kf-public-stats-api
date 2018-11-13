import * as express from 'express';
import persona from '../services/persona';
const _ = require('lodash');

const router = express.Router({ mergeParams: true });

class InterestCount {
  name: string;
  count: number;
  constructor(_name: string, _count: number) {
    this.name = _name;
    this.count = _count;
  }
}

const countsToArray = (counts: PropertyCounts): InterestCount[] => {
  const output: InterestCount[] = [];

  Object.keys(counts).forEach(interest => {
    output.push(new InterestCount(interest, counts[interest]));
  });

  output.sort((a, b) => (a.count < b.count ? 1 : -1));

  return output;
};

/**
 *  ----- Routes -----
 * */

router.get('/', async (req, res, next) => {
  try {
    const counts = await persona.getInterestCounts();

    const interests = countsToArray(counts);
    const output = { interests };

    res.send(output);
  } catch (e) {
    next(e);
  }
});

export default router;
