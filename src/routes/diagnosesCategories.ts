import * as express from 'express';
import arranger from '../services/arranger';

const _ = require('lodash');

class DiagnosesCount {
  name: string;
  probands: number;
  familyMembers: number;

  constructor(_name: string, _probands: number, _familyMembers: number) {
    this.name = _name;
    this.probands = _probands;
    this.familyMembers = _familyMembers;
  }
}

const diagnosesQuery = `
  query($proband: JSON, $others: JSON) {
    participant{
      proband_only: aggregations(filters:$proband, include_missing:false) {
        diagnoses__diagnosis_category {
          buckets
          {
            key
            doc_count

          }
        }
      }
      others: aggregations(filters:$others, include_missing:false) {
        diagnoses__diagnosis_category {
          buckets
          {
            key
            doc_count

          }
        }
      }      
    }
  }`;
const fetchDiagnoses = async (project: string): Promise<DiagnosesCount[]> => {

  const variables = {
    proband: {content: [{content: {field: "is_proband", value: ["true"]}, op: "in"}], op: "and"},
    others: {content: [{content: {field: "is_proband", value: ["false", "__missing__"]}, op: "in"}], op: "and"},
  }
  const data = await arranger
      .query(project, diagnosesQuery, variables)
      .then(response => response.data);

  const probandBuckets = _.get(
      data,
      'participant.proband_only.diagnoses__diagnosis_category.buckets',
  ).map(e => {
    return {...e, proband: true};
  });

  const othersBuckets = _.get(
      data,
      'participant.others.diagnoses__diagnosis_category.buckets',
  ).map(e => {
    return {...e, false: true};
  });
  const agg = probandBuckets.concat(othersBuckets);
  const g = _.groupBy(agg, 'key')

  return _.map(g, e => {
    const probands = _.get(
        _.find(e, p => {
          return p.proband;
        }),
        'doc_count', 0)
    const familyMembers = _.get(
        _.find(e, p => {
          return !p.proband;
        }),
        'doc_count', 0)
    return new DiagnosesCount(_.first(e).key, probands, familyMembers);
  });


};

const router = express.Router({mergeParams: true});

router.get('/', async (req, res, next) => {
  try {
    const {project} = req.params;
    const diagnoses = await fetchDiagnoses(project);
    res.send({diagnoses: diagnoses});
  } catch (e) {
    next(e);
  }
});


export default router;
