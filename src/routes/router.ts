import * as express from 'express';
import studies from './studies';
import diagnosisCategories from './diagnosisCategories';

const router = express.Router();

router.use('/studies', studies);
router.use('/diagnosis-categories', diagnosisCategories);

export default router;
