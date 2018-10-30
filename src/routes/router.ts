import * as express from 'express';
import studies from './studies';
import diagnosisCategories from './diagnosesCategories';
import diagnosisText from './diagnosesText';
import phenotypesHPO from './phenotypesHPO';

const router = express.Router();

router.use('/studies', studies);
router.use('/diagnoses/categories', diagnosisCategories);
router.use('/diagnoses/text', diagnosisText);
router.use('/phenotypes/hpo', phenotypesHPO);

export default router;
