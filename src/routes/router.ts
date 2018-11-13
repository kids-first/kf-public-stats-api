import * as express from 'express';
import studies from './studies';
import diagnosisCategories from './diagnosesCategories';
import diagnosisText from './diagnosesText';
import phenotypesHPO from './phenotypesHPO';
import usersInterests from './usersInterests';

const router = express.Router();

router.use('/:project/studies', studies);
router.use('/:project/diagnoses/categories', diagnosisCategories);
router.use('/:project/diagnoses/text', diagnosisText);
router.use('/:project/phenotypes/hpo', phenotypesHPO);
router.use('/users/interests', usersInterests);

export default router;
