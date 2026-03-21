/**
 * Sample pedigree cases for development and demonstration.
 *
 * Case 1: Autosomal recessive — consanguineous couple, affected proband
 * Case 2: X-linked recessive — carrier mother, affected sons
 * Case 3: De novo — sporadic case, unaffected parents
 * Case 4: Autosomal dominant — 3-generation family
 */

import type { PedigreeCase } from '../domain/types';
import {
  createIndividual,
  createUnion,
  createPedigreeMetadata,
  createEmptyCase,
} from '../domain/factories';

// ─────────────────────────────────────────────────────────────────────────────
// Case 1: Autosomal Recessive — Consanguineous
// ─────────────────────────────────────────────────────────────────────────────

export const sampleCaseAR: PedigreeCase = (() => {
  // Generation I — grandparents (paternal side)
  const gpFatherPat = createIndividual({
    id: 'gp1',
    label: 'I-1',
    sex: 'male',
    affectedStatus: 'unaffected',
    deceasedStatus: 'deceased',
    birthYear: 1930,
    deathYear: 2005,
    generationIndex: 0,
  });
  const gpMotherPat = createIndividual({
    id: 'gp2',
    label: 'I-2',
    sex: 'female',
    affectedStatus: 'unaffected',
    deceasedStatus: 'deceased',
    birthYear: 1933,
    deathYear: 2010,
    generationIndex: 0,
  });

  // Generation II — parents (cousins, consanguineous)
  const father = createIndividual({
    id: 'f1',
    label: 'II-1',
    sex: 'male',
    affectedStatus: 'carrier',
    carrierType: 'autosomal_recessive',
    deceasedStatus: 'alive',
    birthYear: 1975,
    generationIndex: 1,
    notes: 'Carrier confirmed by molecular testing (GBA c.1226A>G het)',
  });
  const mother = createIndividual({
    id: 'm1',
    label: 'II-2',
    sex: 'female',
    affectedStatus: 'carrier',
    carrierType: 'autosomal_recessive',
    deceasedStatus: 'alive',
    birthYear: 1978,
    generationIndex: 1,
    notes: 'Carrier confirmed. First cousin of II-1 (paternal).',
  });
  const uncle = createIndividual({
    id: 'u1',
    label: 'II-3',
    sex: 'male',
    affectedStatus: 'unaffected',
    deceasedStatus: 'alive',
    birthYear: 1977,
    generationIndex: 1,
  });

  // Generation III — children
  const proband = createIndividual({
    id: 'pro1',
    label: 'III-1',
    sex: 'male',
    affectedStatus: 'affected',
    deceasedStatus: 'alive',
    birthYear: 2010,
    isProband: true,
    generationIndex: 2,
    phenotypeSummary: 'Gaucher disease type 1. Hepatosplenomegaly, bone pain. WES confirmed GBA c.1226A>G homozygous.',
    hpoTerms: [
      { id: 'HP:0001744', label: 'Splenomegaly' },
      { id: 'HP:0002240', label: 'Hepatomegaly' },
    ],
  });
  const sibling1 = createIndividual({
    id: 's1',
    label: 'III-2',
    sex: 'female',
    affectedStatus: 'carrier',
    carrierType: 'autosomal_recessive',
    deceasedStatus: 'alive',
    birthYear: 2013,
    generationIndex: 2,
    notes: 'Carrier confirmed by cascade testing.',
  });
  const sibling2 = createIndividual({
    id: 's2',
    label: 'III-3',
    sex: 'female',
    affectedStatus: 'unaffected',
    deceasedStatus: 'alive',
    birthYear: 2016,
    generationIndex: 2,
  });

  // Unions
  const unionGP = createUnion('gp1', 'gp2', {
    id: 'u_gp',
    childrenIds: ['f1', 'u1'],
    relationshipType: 'biological',
    consanguineous: false,
  });

  const unionParents = createUnion('f1', 'm1', {
    id: 'u_parents',
    childrenIds: ['pro1', 's1', 's2'],
    relationshipType: 'consanguineous',
    consanguineous: true,
  });

  return {
    metadata: createPedigreeMetadata({
      caseId: 'sample-ar-001',
      clinicalIndication: 'Hepatosplenomegaly and bone pain in 12-year-old male. WES requested.',
      suspectedDiagnosis: 'Gaucher Disease Type 1 (OMIM #230800)',
      inheritancePattern: 'autosomal_recessive',
      familyHistorySummary: 'Parents are first cousins (paternal). No other affected family members known. Paternal grandparents deceased, phenotype unknown.',
      consanguinityBackground: 'First cousin marriage (F = 1/16)',
      ethnicBackground: 'Ashkenazi Jewish',
      recordedBy: 'Dr. A. Sharma, Genetic Counselor',
      institution: 'Clinical Genomics Unit',
    }),
    individuals: {
      gp1: gpFatherPat,
      gp2: gpMotherPat,
      f1: father,
      m1: mother,
      u1: uncle,
      pro1: proband,
      s1: sibling1,
      s2: sibling2,
    },
    unions: {
      u_gp: unionGP,
      u_parents: unionParents,
    },
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// Case 2: X-linked Recessive — Carrier mother, affected males
// ─────────────────────────────────────────────────────────────────────────────

export const sampleCaseXL: PedigreeCase = (() => {
  // Gen I
  const mGrandfather = createIndividual({
    id: 'xl_gf',
    label: 'I-1',
    sex: 'male',
    affectedStatus: 'unaffected',
    deceasedStatus: 'deceased',
    birthYear: 1940,
    deathYear: 2015,
    generationIndex: 0,
  });
  const mGrandmother = createIndividual({
    id: 'xl_gm',
    label: 'I-2',
    sex: 'female',
    affectedStatus: 'carrier',
    carrierType: 'x_linked',
    deceasedStatus: 'deceased',
    birthYear: 1942,
    deathYear: 2019,
    notes: 'Obligate carrier based on family history.',
    generationIndex: 0,
  });

  // Gen II
  const mother = createIndividual({
    id: 'xl_mom',
    label: 'II-1',
    sex: 'female',
    affectedStatus: 'carrier',
    carrierType: 'x_linked',
    deceasedStatus: 'alive',
    birthYear: 1968,
    generationIndex: 1,
    notes: 'Carrier confirmed. CK mildly elevated.',
  });
  const father = createIndividual({
    id: 'xl_dad',
    label: 'II-2',
    sex: 'male',
    affectedStatus: 'unaffected',
    deceasedStatus: 'alive',
    birthYear: 1966,
    generationIndex: 1,
  });
  const aunt = createIndividual({
    id: 'xl_aunt',
    label: 'II-3',
    sex: 'female',
    affectedStatus: 'unaffected',
    deceasedStatus: 'alive',
    birthYear: 1971,
    generationIndex: 1,
  });

  // Gen III
  const proband = createIndividual({
    id: 'xl_pro',
    label: 'III-1',
    sex: 'male',
    affectedStatus: 'affected',
    deceasedStatus: 'alive',
    birthYear: 1995,
    isProband: true,
    generationIndex: 2,
    phenotypeSummary: 'Duchenne muscular dystrophy. Wheelchair-dependent since age 12. Dilated cardiomyopathy.',
    hpoTerms: [
      { id: 'HP:0003560', label: 'Muscular dystrophy' },
      { id: 'HP:0001644', label: 'Dilated cardiomyopathy' },
    ],
    omimEntries: [{ mimNumber: '310200', title: 'Muscular Dystrophy, Duchenne Type' }],
    genotypeNotes: 'DMD exon 49-50 deletion (hemizygous)',
  });
  const brother = createIndividual({
    id: 'xl_bro',
    label: 'III-2',
    sex: 'male',
    affectedStatus: 'affected',
    deceasedStatus: 'deceased',
    birthYear: 1998,
    deathYear: 2020,
    ageAtDeath: 22,
    generationIndex: 2,
    phenotypeSummary: 'Duchenne muscular dystrophy. Died of respiratory failure.',
    genotypeNotes: 'DMD exon 49-50 deletion (hemizygous)',
  });
  const sister = createIndividual({
    id: 'xl_sis',
    label: 'III-3',
    sex: 'female',
    affectedStatus: 'carrier',
    carrierType: 'x_linked',
    deceasedStatus: 'alive',
    birthYear: 2000,
    generationIndex: 2,
    notes: 'Carrier confirmed. Genetic counseling ongoing.',
  });

  const unionGP = createUnion('xl_gf', 'xl_gm', {
    id: 'xl_u_gp',
    childrenIds: ['xl_mom', 'xl_aunt'],
    consanguineous: false,
  });
  const unionParents = createUnion('xl_dad', 'xl_mom', {
    id: 'xl_u_parents',
    childrenIds: ['xl_pro', 'xl_bro', 'xl_sis'],
    consanguineous: false,
  });

  return {
    metadata: createPedigreeMetadata({
      caseId: 'sample-xl-001',
      clinicalIndication: 'Duchenne muscular dystrophy, family cascade testing.',
      suspectedDiagnosis: 'Duchenne Muscular Dystrophy (OMIM #310200)',
      inheritancePattern: 'x_linked_recessive',
      familyHistorySummary: 'Maternal grandmother was obligate carrier. Two affected sons, one carrier daughter.',
      ethnicBackground: 'European',
      recordedBy: 'Dr. R. Chen, Clinical Geneticist',
      institution: 'Neuromuscular Genetics Clinic',
    }),
    individuals: {
      xl_gf: mGrandfather,
      xl_gm: mGrandmother,
      xl_mom: mother,
      xl_dad: father,
      xl_aunt: aunt,
      xl_pro: proband,
      xl_bro: brother,
      xl_sis: sister,
    },
    unions: {
      xl_u_gp: unionGP,
      xl_u_parents: unionParents,
    },
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// Case 3: De novo — Sporadic, unaffected parents
// ─────────────────────────────────────────────────────────────────────────────

export const sampleCaseDN: PedigreeCase = (() => {
  const father = createIndividual({
    id: 'dn_dad',
    label: 'I-1',
    sex: 'male',
    affectedStatus: 'unaffected',
    deceasedStatus: 'alive',
    birthYear: 1985,
    generationIndex: 0,
  });
  const mother = createIndividual({
    id: 'dn_mom',
    label: 'I-2',
    sex: 'female',
    affectedStatus: 'unaffected',
    deceasedStatus: 'alive',
    birthYear: 1987,
    generationIndex: 0,
  });
  const proband = createIndividual({
    id: 'dn_pro',
    label: 'II-1',
    sex: 'male',
    affectedStatus: 'affected',
    deceasedStatus: 'alive',
    birthYear: 2015,
    isProband: true,
    generationIndex: 1,
    phenotypeSummary: 'Global developmental delay, autism spectrum disorder, facial dysmorphism. De novo SHANK3 variant identified on WES.',
    hpoTerms: [
      { id: 'HP:0001263', label: 'Global developmental delay' },
      { id: 'HP:0000729', label: 'Autistic behavior' },
    ],
    genotypeNotes: 'SHANK3 c.2371C>T p.(Arg791*) — de novo (confirmed in parents)',
  });
  const sibling = createIndividual({
    id: 'dn_sib',
    label: 'II-2',
    sex: 'female',
    affectedStatus: 'unaffected',
    deceasedStatus: 'alive',
    birthYear: 2018,
    generationIndex: 1,
  });

  const unionParents = createUnion('dn_dad', 'dn_mom', {
    id: 'dn_u',
    childrenIds: ['dn_pro', 'dn_sib'],
    consanguineous: false,
  });

  return {
    metadata: createPedigreeMetadata({
      caseId: 'sample-dn-001',
      clinicalIndication: 'Global developmental delay, ASD, dysmorphic features. WES trio requested.',
      suspectedDiagnosis: 'Phelan-McDermid Syndrome / SHANK3-related NDD',
      inheritancePattern: 'de_novo',
      familyHistorySummary: 'No family history of neurodevelopmental disorder. Both parents phenotypically normal.',
      recordedBy: 'Dr. K. Patel, Clinical Genetics',
      institution: 'Paediatric Genetics Service',
    }),
    individuals: {
      dn_dad: father,
      dn_mom: mother,
      dn_pro: proband,
      dn_sib: sibling,
    },
    unions: { dn_u: unionParents },
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// Case 4: Autosomal Dominant — 3 generation family
// ─────────────────────────────────────────────────────────────────────────────

export const sampleCaseAD: PedigreeCase = (() => {
  // Gen I — grandfather affected
  const gf = createIndividual({
    id: 'ad_gf', label: 'I-1', sex: 'male',
    affectedStatus: 'affected', deceasedStatus: 'deceased',
    birthYear: 1935, deathYear: 2008,
    notes: 'Diagnosed with BRCA2-associated breast cancer aged 68. Died of metastatic disease.',
    generationIndex: 0,
  });
  const gm = createIndividual({
    id: 'ad_gm', label: 'I-2', sex: 'female',
    affectedStatus: 'unaffected', deceasedStatus: 'deceased',
    birthYear: 1938, deathYear: 2015, generationIndex: 0,
  });

  // Gen II
  const father = createIndividual({
    id: 'ad_f', label: 'II-1', sex: 'male',
    affectedStatus: 'affected', deceasedStatus: 'alive',
    birthYear: 1962,
    phenotypeSummary: 'Breast cancer diagnosed age 55. BRCA2 pathogenic variant confirmed.',
    genotypeNotes: 'BRCA2 c.5946delT p.(Ser1982Argfs*22) — pathogenic (het)',
    generationIndex: 1,
  });
  const mother = createIndividual({
    id: 'ad_m', label: 'II-2', sex: 'female',
    affectedStatus: 'unaffected', deceasedStatus: 'alive',
    birthYear: 1965, generationIndex: 1,
  });
  const aunt = createIndividual({
    id: 'ad_a', label: 'II-3', sex: 'female',
    affectedStatus: 'affected', deceasedStatus: 'alive',
    birthYear: 1965,
    phenotypeSummary: 'Ovarian cancer age 48. BRCA2 confirmed.',
    genotypeNotes: 'BRCA2 c.5946delT — pathogenic (het)',
    generationIndex: 1,
  });
  const uncle = createIndividual({
    id: 'ad_u', label: 'II-4', sex: 'male',
    affectedStatus: 'unaffected', deceasedStatus: 'alive',
    birthYear: 1968, generationIndex: 1,
  });

  // Gen III
  const proband = createIndividual({
    id: 'ad_pro', label: 'III-1', sex: 'female',
    affectedStatus: 'unaffected', deceasedStatus: 'alive',
    birthYear: 1990, isProband: true, isConsultand: true,
    phenotypeSummary: 'Unaffected. Attending for predictive BRCA2 testing.',
    genotypeNotes: 'Result pending',
    generationIndex: 2,
  });
  const sib1 = createIndividual({
    id: 'ad_s1', label: 'III-2', sex: 'male',
    affectedStatus: 'carrier', carrierType: 'tested_positive',
    deceasedStatus: 'alive', birthYear: 1992,
    genotypeNotes: 'BRCA2 c.5946delT — pathogenic (het). Under surveillance.',
    generationIndex: 2,
  });
  const sib2 = createIndividual({
    id: 'ad_s2', label: 'III-3', sex: 'female',
    affectedStatus: 'unaffected', deceasedStatus: 'alive',
    birthYear: 1995,
    genotypeNotes: 'BRCA2 wild-type — variant not identified.',
    generationIndex: 2,
  });
  const cousin = createIndividual({
    id: 'ad_c1', label: 'III-4', sex: 'female',
    affectedStatus: 'affected', deceasedStatus: 'alive',
    birthYear: 1988,
    phenotypeSummary: 'Triple-negative breast cancer age 30. Testing in progress.',
    generationIndex: 2,
  });

  const unionGP = createUnion('ad_gf', 'ad_gm', { id: 'ad_u_gp', childrenIds: ['ad_f', 'ad_a', 'ad_u'], consanguineous: false });
  const unionParents = createUnion('ad_f', 'ad_m', { id: 'ad_u_parents', childrenIds: ['ad_pro', 'ad_s1', 'ad_s2'], consanguineous: false });
  const unionAunt = createUnion('ad_a', 'ad_u', { id: 'ad_u_aunt', childrenIds: ['ad_c1'], consanguineous: false });

  return {
    metadata: createPedigreeMetadata({
      caseId: 'sample-ad-001',
      clinicalIndication: 'BRCA2 predictive testing — family history of hereditary breast and ovarian cancer.',
      suspectedDiagnosis: 'Hereditary Breast and Ovarian Cancer (OMIM #612555)',
      inheritancePattern: 'autosomal_dominant',
      familyHistorySummary: 'Paternal grandfather and aunt both affected. Father with breast cancer (unusual). BRCA2 c.5946delT segregating through paternal line.',
      ethnicBackground: 'European',
      recordedBy: 'Dr. M. Okonkwo, Clinical Genetics',
      institution: 'Cancer Genetics Service',
    }),
    individuals: { ad_gf: gf, ad_gm: gm, ad_f: father, ad_m: mother, ad_a: aunt, ad_u: uncle, ad_pro: proband, ad_s1: sib1, ad_s2: sib2, ad_c1: cousin },
    unions: { ad_u_gp: unionGP, ad_u_parents: unionParents, ad_u_aunt: unionAunt },
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// Blank case template
// ─────────────────────────────────────────────────────────────────────────────

export const blankCase: PedigreeCase = createEmptyCase();

// ─────────────────────────────────────────────────────────────────────────────
// Export all sample cases
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_CASES: Record<string, PedigreeCase> = {
  'Autosomal Recessive (Consanguineous)': sampleCaseAR,
  'X-linked Recessive (DMD)':             sampleCaseXL,
  'De Novo (Trio WES)':                   sampleCaseDN,
  'Autosomal Dominant (BRCA2)':           sampleCaseAD,
};

export const DEFAULT_SAMPLE_CASE = sampleCaseAR;
