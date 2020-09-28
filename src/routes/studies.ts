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
  query($proband: JSON, $others: JSON) {
    participant{
      proband_only: aggregations(filters:$proband) {
        study__short_name{
          
          buckets
          {
            key
            doc_count
            top_hits(_source:"study.kf_id", size:1)
          }
        }
      }
      others: aggregations(filters:$others) {
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

  const variables = {
    proband: {content: [{content: {field: "is_proband", value: ["true"]}, op: "in"}], op: "and"},
    others: {content: [{content: {field: "is_proband", value: ["false", "__missing__"]}, op: "in"}], op: "and"}
  }
  const data = await arranger
      .query(project, studiesQuery, variables)
      .then(response => response.data);

  const probandBuckets = _.get(
      data,
      'participant.proband_only.study__short_name.buckets',
  ).map(e => {
    return {...e, proband: true};
  });

  const othersBuckets = _.get(
      data,
      'participant.others.study__short_name.buckets',
  ).map(e => {
    return {...e, proband: false};
  });

  console.log(othersBuckets)
  const agg = probandBuckets.concat(othersBuckets)

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
    const f = _.first(e)
    return new StudiesCount(f.top_hits.study.kf_id, f.key, probands, familyMembers);
  });


};

const router = express.Router({mergeParams: true});

router.get('/', async (req, res, next) => {
  try {
    const {project} = req.params;
    const studies = await fetchStudies(project);
    res.send({studies: studies});
  } catch (e) {
    next(e);
  }
});


export default router;
