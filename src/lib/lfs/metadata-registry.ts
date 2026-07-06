// Centralized Metadata Registry for Rwanda LFS (2020 onwards)
// Single source of truth for variable names, aliases, labels, types, validation, and harmonization rules.

export type CanonicalField =
  | "person_id"
  | "household_id"
  | "year"
  | "quarter"
  | "age"
  | "sex"
  | "education"
  | "employment_status"
  | "occupation"
  | "industry"
  | "hours_worked"
  | "earnings"
  | "region"
  | "district"
  | "urban_rural"
  | "weight";

export type SurveyFormat = "csv" | "xlsx" | "xls" | "dta";

export interface ValueLabelMap {
  [rawValue: string]: string;
}

export interface ValidationRule {
  type: "range" | "enum" | "pattern" | "required" | "custom";
  params?: Record<string, unknown>;
  message?: string;
}

export interface HarmonizationRule {
  surveyYear: number;
  questionnaireVersion: string;
  sourceName: string;
  aliases?: string[];
  notes?: string;
}

export interface FormatHarmonization {
  format: SurveyFormat;
  sourceName: string;
  aliases?: string[];
  notes?: string;
}

export interface VariableMetadata {
  canonical: CanonicalField;
  label: string;
  description: string;
  dataType: "string" | "number" | "categorical" | "date" | "identifier";
  required: boolean;
  defaultValue?: unknown;
  aliases: string[];
  valueLabels?: ValueLabelMap;
  validationRules: ValidationRule[];
  harmonization: {
    byYear: HarmonizationRule[];
    byFormat: FormatHarmonization[];
  };
  indicatorDependencies?: CanonicalField[];
  administrativeCode?: boolean;
  isicVersion?: string;
  iscoVersion?: string;
  weightType?: "person" | "household" | "fweight" | "pweight";
}

export interface QuestionnaireVersion {
  version: string;
  year: number;
  label: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface RegistryOptions {
  yearRange?: [number, number];
  preferredQuestionnaireVersion?: string;
}

export const DEFAULT_YEAR_RANGE: [number, number] = [2020, 2026];

export const QUESTIONNAIRE_VERSIONS: QuestionnaireVersion[] = [
  { version: "LFS-2020", year: 2020, label: "LFS 2020 Questionnaire", effectiveFrom: "2020-01-01" },
  { version: "LFS-2021", year: 2021, label: "LFS 2021 Questionnaire", effectiveFrom: "2021-01-01" },
  { version: "LFS-2022", year: 2022, label: "LFS 2022 Questionnaire", effectiveFrom: "2022-01-01" },
  { version: "LFS-2023", year: 2023, label: "LFS 2023 Questionnaire", effectiveFrom: "2023-01-01" },
  { version: "LFS-2024", year: 2024, label: "LFS 2024 Questionnaire", effectiveFrom: "2024-01-01" },
  { version: "LFS-2025", year: 2025, label: "LFS 2025 Questionnaire", effectiveFrom: "2025-01-01" },
  { version: "LFS-2026", year: 2026, label: "LFS 2026 Questionnaire", effectiveFrom: "2026-01-01" },
];

export const VARIABLE_REGISTRY: VariableMetadata[] = [
  {
    canonical: "person_id",
    label: "Person Identifier",
    description: "Unique identifier for each individual in the survey",
    dataType: "identifier",
    required: false,
    aliases: ["person_id", "pid", "id", "individual_id", "individualid", "indiv_id", "hh_member", "member_id"],
    validationRules: [],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "person_id" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "person_id" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "person_id" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "person_id" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "person_id" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "person_id" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "person_id" },
      ],
      byFormat: [
        { format: "csv", sourceName: "person_id" },
        { format: "xlsx", sourceName: "person_id" },
        { format: "xls", sourceName: "person_id" },
        { format: "dta", sourceName: "person_id" },
      ],
    },
  },
  {
    canonical: "household_id",
    label: "Household Identifier",
    description: "Unique identifier for the household",
    dataType: "identifier",
    required: false,
    aliases: ["household_id", "hhid", "household", "hh", "hh_id", "home_id"],
    validationRules: [],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "household_id" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "household_id" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "household_id" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "household_id" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "household_id" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "household_id" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "household_id" },
      ],
      byFormat: [
        { format: "csv", sourceName: "household_id" },
        { format: "xlsx", sourceName: "household_id" },
        { format: "xls", sourceName: "household_id" },
        { format: "dta", sourceName: "household_id" },
      ],
    },
  },
  {
    canonical: "year",
    label: "Survey Year",
    description: "Year the survey was conducted",
    dataType: "number",
    required: true,
    aliases: ["year", "yr", "survey_year", "annee", "annees"],
    validationRules: [
      { type: "range", params: { min: 2020, max: 2026 }, message: "Year must be between 2020 and 2026" },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "year" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "year" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "year" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "year" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "year" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "year" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "year" },
      ],
      byFormat: [
        { format: "csv", sourceName: "year" },
        { format: "xlsx", sourceName: "year" },
        { format: "xls", sourceName: "year" },
        { format: "dta", sourceName: "year" },
      ],
    },
  },
  {
    canonical: "quarter",
    label: "Quarter",
    description: "Survey quarter (1-4)",
    dataType: "categorical",
    required: true,
    aliases: ["quarter", "qtr", "q", "trim", "trimestre", "tq", "period", "time_quarter"],
    valueLabels: { "1": "Q1", "2": "Q2", "3": "Q3", "4": "Q4" },
    validationRules: [
      { type: "enum", params: { values: [1, 2, 3, 4] }, message: "Quarter must be 1, 2, 3, or 4" },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "quarter" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "quarter" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "quarter" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "quarter" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "quarter" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "quarter" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "quarter" },
      ],
      byFormat: [
        { format: "csv", sourceName: "quarter" },
        { format: "xlsx", sourceName: "quarter" },
        { format: "xls", sourceName: "quarter" },
        { format: "dta", sourceName: "quarter" },
      ],
    },
  },
  {
    canonical: "age",
    label: "Age",
    description: "Age of respondent in years",
    dataType: "number",
    required: true,
    aliases: ["age", "age_years", "age_pers", "respondent_age"],
    validationRules: [
      { type: "range", params: { min: 0, max: 120 }, message: "Age must be between 0 and 120" },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "age" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "age" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "age" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "age" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "age" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "age" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "age" },
      ],
      byFormat: [
        { format: "csv", sourceName: "age" },
        { format: "xlsx", sourceName: "age" },
        { format: "xls", sourceName: "age" },
        { format: "dta", sourceName: "age" },
      ],
    },
  },
  {
    canonical: "sex",
    label: "Sex",
    description: "Biological sex of respondent",
    dataType: "categorical",
    required: true,
    aliases: ["sex", "gender", "sexe", "genre", "male_female", "mf"],
    valueLabels: { "1": "Male", "2": "Female", "M": "Male", "F": "Female", "male": "Male", "female": "Female" },
    validationRules: [
      { type: "enum", params: { values: ["male", "female", "1", "2", "M", "F"] }, message: "Sex must be male/female or 1/2" },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "sex" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "sex" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "sex" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "sex" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "sex" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "sex" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "sex" },
      ],
      byFormat: [
        { format: "csv", sourceName: "sex" },
        { format: "xlsx", sourceName: "sex" },
        { format: "xls", sourceName: "sex" },
        { format: "dta", sourceName: "sex" },
      ],
    },
  },
  {
    canonical: "education",
    label: "Education Level",
    description: "Highest educational attainment",
    dataType: "categorical",
    required: false,
    aliases: ["education", "educ", "educ_level", "education_level", "niveau_educ", "highest_educ", "educ_attain"],
    validationRules: [],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "education" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "education" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "education" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "education" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "education" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "education" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "education" },
      ],
      byFormat: [
        { format: "csv", sourceName: "education" },
        { format: "xlsx", sourceName: "education" },
        { format: "xls", sourceName: "education" },
        { format: "dta", sourceName: "education" },
      ],
    },
  },
  {
    canonical: "employment_status",
    label: "Employment Status",
    description: "Labour force status: employed, unemployed, or outside labour force",
    dataType: "categorical",
    required: true,
    aliases: [
      "employment_status", "lfs", "status", "empstatus", "emp_status", "empl_status",
      "labour_status", "work_status", "activity_status", "occup_status", "empl",
      "employed", "unemployed", "inactive", "lf_status", "actstat", "act_status", "labour_force_status"
    ],
    valueLabels: {
      "1": "Employed", "2": "Unemployed", "3": "Outside LF",
      "employed": "Employed", "unemployed": "Unemployed", "outside_lf": "Outside LF"
    },
    validationRules: [
      {
        type: "custom",
        message: "employment_status must not contain year, weight, age, sex, or 'discourage' values",
      },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "employment_status" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "employment_status" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "employment_status" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "employment_status" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "employment_status" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "employment_status" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "employment_status" },
      ],
      byFormat: [
        { format: "csv", sourceName: "employment_status" },
        { format: "xlsx", sourceName: "employment_status" },
        { format: "xls", sourceName: "employment_status" },
        { format: "dta", sourceName: "employment_status" },
      ],
    },
  },
  {
    canonical: "occupation",
    label: "Occupation",
    description: "ISCO-08 occupation code and label",
    dataType: "categorical",
    required: false,
    aliases: ["occupation", "isco", "occ", "job", "job_type", "occupation_code", "occup_code", "profession"],
    validationRules: [],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "occupation", notes: "ISCO-08 codes" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "occupation", notes: "ISCO-08 codes" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "occupation", notes: "ISCO-08 codes" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "occupation", notes: "ISCO-08 codes" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "occupation", notes: "ISCO-08 codes" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "occupation", notes: "ISCO-08 codes" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "occupation", notes: "ISCO-08 codes" },
      ],
      byFormat: [
        { format: "csv", sourceName: "occupation" },
        { format: "xlsx", sourceName: "occupation" },
        { format: "xls", sourceName: "occupation" },
        { format: "dta", sourceName: "occupation" },
      ],
    },
    iscoVersion: "ISCO-08",
  },
  {
    canonical: "industry",
    label: "Industry",
    description: "ISIC-4 industry code and label",
    dataType: "categorical",
    required: false,
    aliases: ["industry", "isic", "ind", "sector", "industry_code", "ind_code", "branch"],
    validationRules: [],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "industry", notes: "ISIC-4 codes" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "industry", notes: "ISIC-4 codes" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "industry", notes: "ISIC-4 codes" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "industry", notes: "ISIC-4 codes" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "industry", notes: "ISIC-4 codes" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "industry", notes: "ISIC-4 codes" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "industry", notes: "ISIC-4 codes" },
      ],
      byFormat: [
        { format: "csv", sourceName: "industry" },
        { format: "xlsx", sourceName: "industry" },
        { format: "xls", sourceName: "industry" },
        { format: "dta", sourceName: "industry" },
      ],
    },
    isicVersion: "ISIC-4",
  },
  {
    canonical: "hours_worked",
    label: "Hours Worked",
    description: "Number of hours worked in the reference week",
    dataType: "number",
    required: false,
    aliases: ["hours_worked", "hours", "hrs", "hrs_worked", "work_hours", "hours_week", "usual_hrs"],
    validationRules: [
      { type: "range", params: { min: 0, max: 168 }, message: "Hours worked must be between 0 and 168" },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "hours_worked" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "hours_worked" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "hours_worked" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "hours_worked" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "hours_worked" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "hours_worked" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "hours_worked" },
      ],
      byFormat: [
        { format: "csv", sourceName: "hours_worked" },
        { format: "xlsx", sourceName: "hours_worked" },
        { format: "xls", sourceName: "hours_worked" },
        { format: "dta", sourceName: "hours_worked" },
      ],
    },
  },
  {
    canonical: "earnings",
    label: "Earnings",
    description: "Monthly earnings or wage",
    dataType: "number",
    required: false,
    aliases: ["earnings", "wage", "income", "salary", "wages", "earnings_month", "monthly_earnings"],
    validationRules: [
      { type: "range", params: { min: 0 }, message: "Earnings must be non-negative" },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "earnings" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "earnings" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "earnings" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "earnings" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "earnings" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "earnings" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "earnings" },
      ],
      byFormat: [
        { format: "csv", sourceName: "earnings" },
        { format: "xlsx", sourceName: "earnings" },
        { format: "xls", sourceName: "earnings" },
        { format: "dta", sourceName: "earnings" },
      ],
    },
  },
  {
    canonical: "region",
    label: "Province",
    description: "Administrative province of residence",
    dataType: "categorical",
    required: false,
    administrativeCode: true,
    aliases: ["region", "province", "prov", "prov_name", "province_name", "province_rw", "region_name", "province_id"],
    validationRules: [],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "region" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "region" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "region" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "region" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "region" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "region" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "region" },
      ],
      byFormat: [
        { format: "csv", sourceName: "region" },
        { format: "xlsx", sourceName: "region" },
        { format: "xls", sourceName: "region" },
        { format: "dta", sourceName: "region" },
      ],
    },
  },
  {
    canonical: "district",
    label: "District",
    description: "Administrative district of residence",
    dataType: "categorical",
    required: false,
    administrativeCode: true,
    aliases: ["district", "dist", "district_name", "dist_name", "commune", "sector"],
    validationRules: [],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "district" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "district" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "district" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "district" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "district" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "district" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "district" },
      ],
      byFormat: [
        { format: "csv", sourceName: "district" },
        { format: "xlsx", sourceName: "district" },
        { format: "xls", sourceName: "district" },
        { format: "dta", sourceName: "district" },
      ],
    },
  },
  {
    canonical: "urban_rural",
    label: "Urban / Rural",
    description: "Residence area classification",
    dataType: "categorical",
    required: true,
    aliases: ["urban_rural", "urb", "residence", "ur", "urban_rural_split", "area_type", "zone"],
    valueLabels: { "urban": "Urban", "rural": "Rural", "1": "Urban", "2": "Rural", "u": "Urban", "r": "Rural" },
    validationRules: [
      { type: "enum", params: { values: ["urban", "rural", "1", "2", "U", "R"] }, message: "Area must be urban or rural" },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "urban_rural" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "urban_rural" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "urban_rural" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "urban_rural" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "urban_rural" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "urban_rural" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "urban_rural" },
      ],
      byFormat: [
        { format: "csv", sourceName: "urban_rural" },
        { format: "xlsx", sourceName: "urban_rural" },
        { format: "xls", sourceName: "urban_rural" },
        { format: "dta", sourceName: "urban_rural" },
      ],
    },
  },
  {
    canonical: "weight",
    label: "Survey Weight",
    description: "Sampling weight for the respondent",
    dataType: "number",
    required: true,
    weightType: "person",
    aliases: ["weight", "wt", "pweight", "fweight", "sampling_weight", "survey_weight", "pw", "pop_weight"],
    validationRules: [
      { type: "range", params: { min: 0 }, message: "Weight must be non-negative" },
    ],
    harmonization: {
      byYear: [
        { surveyYear: 2020, questionnaireVersion: "LFS-2020", sourceName: "weight", notes: "Expansion weight" },
        { surveyYear: 2021, questionnaireVersion: "LFS-2021", sourceName: "weight", notes: "Expansion weight" },
        { surveyYear: 2022, questionnaireVersion: "LFS-2022", sourceName: "weight", notes: "Expansion weight" },
        { surveyYear: 2023, questionnaireVersion: "LFS-2023", sourceName: "weight", notes: "Expansion weight" },
        { surveyYear: 2024, questionnaireVersion: "LFS-2024", sourceName: "weight", notes: "Expansion weight" },
        { surveyYear: 2025, questionnaireVersion: "LFS-2025", sourceName: "weight", notes: "Expansion weight" },
        { surveyYear: 2026, questionnaireVersion: "LFS-2026", sourceName: "weight", notes: "Expansion weight" },
      ],
      byFormat: [
        { format: "csv", sourceName: "weight" },
        { format: "xlsx", sourceName: "weight" },
        { format: "xls", sourceName: "weight" },
        { format: "dta", sourceName: "weight" },
      ],
    },
  },
];

export const REQUIRED_FIELDS: CanonicalField[] = ["year", "quarter", "age", "sex", "employment_status", "weight"];

export class MetadataRegistry {
  private options: RegistryOptions;
  private cache = new Map<string, VariableMetadata>();

  constructor(options: RegistryOptions = {}) {
    this.options = {
      yearRange: options.yearRange ?? DEFAULT_YEAR_RANGE,
      preferredQuestionnaireVersion: options.preferredQuestionnaireVersion ?? QUESTIONNAIRE_VERSIONS[QUESTIONNAIRE_VERSIONS.length - 1].version,
    };
  }

  getVariable(canonical: CanonicalField): VariableMetadata | undefined {
    if (this.cache.has(canonical)) return this.cache.get(canonical);
    const found = VARIABLE_REGISTRY.find((v) => v.canonical === canonical);
    if (found) this.cache.set(canonical, found);
    return found;
  }

  getAllVariables(): VariableMetadata[] {
    return [...VARIABLE_REGISTRY];
  }

  getRequiredVariables(): VariableMetadata[] {
    return VARIABLE_REGISTRY.filter((v) => v.required);
  }

  getAliases(canonical: CanonicalField): string[] {
    return this.getVariable(canonical)?.aliases ?? [];
  }

  getAliasMap(): Record<string, CanonicalField> {
    const map: Record<string, CanonicalField> = {};
    for (const variable of VARIABLE_REGISTRY) {
      for (const alias of variable.aliases) {
        map[alias.toLowerCase()] = variable.canonical;
      }
    }
    return map;
  }

  getQuestionnaireVersion(year: number): string | undefined {
    const version = QUESTIONNAIRE_VERSIONS.find((q) => q.year === year);
    return version?.version;
  }

  getHarmonization(canonical: CanonicalField, year?: number, format?: SurveyFormat): HarmonizationRule | FormatHarmonization | undefined {
    const variable = this.getVariable(canonical);
    if (!variable) return undefined;

    if (year) {
      return variable.harmonization.byYear.find((h) => h.surveyYear === year);
    }
    if (format) {
      return variable.harmonization.byFormat.find((f) => f.format === format);
    }
    return undefined;
  }

  validateMapping(sourceColumn: string, canonical: CanonicalField): { valid: boolean; warning?: string } {
    const lower = sourceColumn.toLowerCase();
    const variable = this.getVariable(canonical);
    if (!variable) return { valid: false, warning: `Unknown canonical field: ${canonical}` };

    const forbiddenPatterns = [
      "discourage", "lfs_year", "lfs2022", "lfs2023", "weight", "age", "sex",
      "employment", "status", "gender", "year", "quarter", "region", "district"
    ];

    if (canonical === "employment_status" && forbiddenPatterns.some((p) => lower.includes(p))) {
      return { valid: false, warning: `"${sourceColumn}" may not be employment_status (contains forbidden pattern)` };
    }
    if (canonical === "age" && ["discourage", "weight", "lfs", "employment", "status"].some((p) => lower.includes(p))) {
      return { valid: false, warning: `"${sourceColumn}" may not be age (contains forbidden pattern)` };
    }
    if (canonical === "sex" && ["discourage", "weight", "lfs", "employment", "status", "age", "lfs_year"].some((p) => lower.includes(p))) {
      return { valid: false, warning: `"${sourceColumn}" may not be sex (contains forbidden pattern)` };
    }
    if (canonical === "weight" && ["discourage", "age", "sex", "employment"].some((p) => lower.includes(p))) {
      return { valid: false, warning: `"${sourceColumn}" may not be weight` };
    }

    return { valid: true };
  }

  getCanonicalFromAlias(alias: string): CanonicalField | undefined {
    const map = this.getAliasMap();
    return map[alias.toLowerCase()];
  }
}

export const metadataRegistry = new MetadataRegistry();