import * as express from 'express';
import arranger from '../services/arranger';

const _ = require('lodash');

class PhenotypesCount {
  name: string;
  probands: number;
  familyMembers: number;

  constructor(_name: string, _probands: number, _familyMembers: number) {
    this.name = _name;
    this.probands = _probands;
    this.familyMembers = _familyMembers;
  }
}

const phenotypesQuery = `
  query($proband: JSON, $others: JSON) {
    participant{
      proband_only: aggregations(filters:$proband) {
        phenotype__hpo_phenotype_observed_text {
          buckets
          {
            key
            doc_count

          }
        }
      }
      others: aggregations(filters:$others) {
        phenotype__hpo_phenotype_observed_text {
          buckets
          {
            key
            doc_count

          }
        }
      }      
    }
  }`;
const fetchPhenotypes = async (project: string): Promise<PhenotypesCount[]> => {

  const variables = {
    proband: {content: [{content: {field: "is_proband", value: ["true"]}, op: "in"}], op: "and"},
    others: {content: [{content: {field: "is_proband", value: ["false", "__missing__"]}, op: "in"}], op: "and"}
  }
  const data = await arranger
      .query(project, phenotypesQuery, variables)
      .then(response => response.data);

  const probandBuckets = _.get(
      data,
      'participant.proband_only.phenotype__hpo_phenotype_observed_text.buckets',
  ).map(e => {
    return {...e, proband: true};
  });
  const othersBuckets = _.get(
      data,
      'participant.others.phenotype__hpo_phenotype_observed_text.buckets',
  ).map(e => {
    return {...e, proband: false};
  });

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
    return new PhenotypesCount(_.first(e).key, probands, familyMembers);
  });

};

const router = express.Router({mergeParams: true});

router.get('/', async (req, res, next) => {
  try {
    const {project} = req.params;
    const phenotypes = await fetchPhenotypes(project);
    res.send({phenotypes: phenotypes});
  } catch (e) {
    next(e);
  }
});


export default router;
