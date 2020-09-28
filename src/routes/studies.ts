import * as express from 'express';
import arranger from '../services/arranger';

const _ = require('lodash');

class StudiesCount {
  id: string;
  name: string;
  probands: number;
  familyMembers: number;

  constructor(_id: string, _name: string, _probands: number, _familyMembers: number) {
    this.id = _id;
    this.name = _name;
    this.probands = _probands;
    this.familyMembers = _familyMembers;
  }
}

const studiesQuery = `
  query($sqon: JSON) {
    participant{
      proband_only: aggregations(filters:$sqon) {
        study__short_name{
          
          buckets
          {
            key
            doc_count
            top_hits(_source:"study.kf_id", size:1)
          }
        }
      }
      all: aggregations {
        study__short_name{
          
          buckets
          {
            key
            doc_count
            top_hits(_source:"study.kf_id", size:1)
          }
        }
      
      }      
    }
  }`;
const fetchStudies = async (project: string): Promise<StudiesCount[]> => {

  const variables = {sqon: {content: [{content: {field: "is_proband", value: ["true"]}, op: "in"}], op: "and"}}
  const data = await arranger
      .query(project, studiesQuery, variables)
      .then(response => response.data);

  const probandBuckets = _.get(
      data,
      'participant.proband_only.study__short_name.buckets',
  );
  const probandBucketsMap = bucketAsMap(probandBuckets)
  const allBuckets = _.get(
      data,
      'participant.all.study__short_name.buckets',
  );
  const allBucketsMap = bucketAsMap(allBuckets);

  return _.mergeWith(probandBucketsMap, allBucketsMap, function customizer(probands, all, key) {
    if (probands) {
      if (all) {

        return new StudiesCount(probands.top_hits.study.kf_id, key, probands.doc_count, all.doc_count);
      } else {
        return new StudiesCount(probands.top_hits.study.kf_id, key, probands.doc_count, 0);
      }
    } else {
      return new StudiesCount(all.top_hits.study.kf_id, key, 0, all.doc_count);
    }
  });


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
    const studies = await fetchStudies(project);
    res.send(studies);
  } catch (e) {
    next(e);
  }
});


export default router;
