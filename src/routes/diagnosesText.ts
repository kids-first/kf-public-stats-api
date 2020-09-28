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
  query($sqon: JSON) {
    participant{
      proband_only: aggregations(filters:$sqon) {
        diagnoses__diagnosis {
          buckets
          {
            key
            doc_count

          }
        }
      }
      all: aggregations {
        diagnoses__diagnosis {
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

  const variables = {sqon: {content: [{content: {field: "is_proband", value: ["true"]}, op: "in"}], op: "and"}}
  const data = await arranger
      .query(project, diagnosesQuery, variables)
      .then(response => response.data);

  const probandBuckets = _.get(
      data,
      'participant.proband_only.diagnoses__diagnosis.buckets',
  );
  const probandBucketsMap = bucketAsMap(probandBuckets)
  const allBuckets = _.get(
      data,
      'participant.all.diagnoses__diagnosis.buckets',
  );
  const allBucketsMap = bucketAsMap(allBuckets);

  const merged = _.mergeWith(probandBucketsMap, allBucketsMap, function customizer(probands, all, key) {
    if (probands) {
      if (all) {
        return new DiagnosesCount(key, probands.doc_count, all.doc_count);
      } else {
        return new DiagnosesCount(key, probands.doc_count, 0);
      }
    } else {
      return new DiagnosesCount(key, 0, all.doc_count);
    }
  });
  return _.values(merged);


};

/**
 * const buckets = [
 *  {'bucket': 'd1', 'bucket_count': 10},
 *  {'bucket': 'd2', 'bucket_count': 15}
 * ];
 *
 * bucketAsMap(buckets)
 * {
 *  d1: {'bucket': 'd1', 'bucket_count': 10},
 *  d2: {'bucket': 'd2', 'bucket_count': 15}
 * }
 * @param buckets
 */
const bucketAsMap = buckets => {
  const bucketArray = buckets.map(b => {
    return {[b.key]: b};
  });
  return Object.assign({}, ...bucketArray)
}

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
