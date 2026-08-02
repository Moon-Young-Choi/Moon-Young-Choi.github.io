export type ExperienceTableRow = {
  label: string;
  detail: string;
  purpose: string;
};

export type ExperienceMetric = {
  value: string;
  label: string;
  note: string;
};

export const avikusExperience = {
  status: "Public-safe reconstruction · No employer code or data",
  scenarioRows: [
    { label: "Own Ship", detail: "Speed and region state", purpose: "Scenario anchor" },
    { label: "Target Ship", detail: "Relative distance and speed", purpose: "Interaction state" },
    { label: "Region logic", detail: "Entry and exit conditions", purpose: "Scenario transition" },
    { label: "NMEA 0183", detail: "Synthetic navigation stream", purpose: "Repeatable observation" },
  ] satisfies ExperienceTableRow[],
  degradations: [
    { label: "Missing", detail: "Probability-controlled gaps", purpose: "Incomplete observation" },
    { label: "Outlier", detail: "Injected abnormal samples", purpose: "Robustness condition" },
    { label: "Noise", detail: "Sensor uncertainty", purpose: "Signal variability" },
  ] satisfies ExperienceTableRow[],
  pipeline: ["Scenario state", "NMEA 0183 synthesis", "Video inputs", "Homography", "CUDA warp + blend", "Replay + inspection"],
  executionRows: [
    { label: "Compute", detail: "OpenCV homography and CUDA image operations", purpose: "Alignment path" },
    { label: "Output", detail: "Separated from the compute loop with OpenMP", purpose: "Non-blocking delivery" },
    { label: "Visualization", detail: "Separated from execution and output", purpose: "Independent inspection" },
  ] satisfies ExperienceTableRow[],
  metric: {
    value: "350×",
    label: "Stable accelerated replay",
    note: "Observed at final product validation under a processor-limited ceiling.",
  } satisfies ExperienceMetric,
  validationRows: [
    { label: "Repeatability", detail: "Replay the same controlled scenario", purpose: "Comparable runs" },
    { label: "Signal conditions", detail: "Exercise missingness, outliers and noise", purpose: "Uncertainty coverage" },
    { label: "Geometry", detail: "Inspect consistency across overlapping frames", purpose: "Alignment check" },
    { label: "Process lanes", detail: "Observe compute, output and visualization independently", purpose: "Runtime isolation" },
  ] satisfies ExperienceTableRow[],
  boundary: "The diagrams are conceptual reconstructions. Employer code, imagery, datasets, NMEA sentence codes, values, distributions, internal thresholds and product identifiers are not reproduced.",
} as const;

export const finburhExperience = {
  status: "Private product architecture · Public reconstruction",
  agents: [
    { label: "Conversation", detail: "Talks directly with the user and forwards the request", purpose: "Request boundary" },
    { label: "Task", detail: "Decomposes the request into a DAG of Work-sized jobs", purpose: "Planning and dispatch" },
    { label: "Work", detail: "Builds tables and artifacts or requests evidence", purpose: "Execution" },
    { label: "Research", detail: "Collects and parses requested DART, KRX and web evidence", purpose: "Evidence service" },
    { label: "Assumption", detail: "Builds time-indexed additive and multiplicative forecast trees", purpose: "Shared forecast logic" },
    { label: "Orchestrator", detail: "Checks Work success criteria and reassigns failures", purpose: "Recovery control" },
  ] satisfies ExperienceTableRow[],
  evidenceRows: [
    { label: "Exact plane", detail: "Normalized values with company, period and data type", purpose: "Calculation input" },
    { label: "Narrative plane", detail: "Embedded disclosures and web material", purpose: "Task-specific context" },
    { label: "Evidence bundle", detail: "Only the evidence needed by the active job", purpose: "Context efficiency" },
  ] satisfies ExperienceTableRow[],
  assumptionRows: [
    { label: "Internal drivers", detail: "Revenue, COGS and related financial accounts", purpose: "Model structure" },
    { label: "External drivers", detail: "Interest-rate and inflation forecasts", purpose: "Economic context" },
    { label: "Time axis", detail: "Monthly or annual change paths", purpose: "Forecast horizon" },
    { label: "Tree operators", detail: "Additive and multiplicative relationships", purpose: "Forecast composition" },
  ] satisfies ExperienceTableRow[],
  outputs: [
    { label: "Word", detail: "Sections and tables", purpose: "Editable report" },
    { label: "PowerPoint", detail: "Slide blocks and visual elements", purpose: "Editable deck" },
    { label: "Excel", detail: "Assumptions, tables and formulas", purpose: "Editable workbook" },
  ] satisfies ExperienceTableRow[],
  metrics: [
    { value: "30+", label: "Workbook sheets", note: "Generated production output" },
    { value: "~200", label: "Presentation slides", note: "Generated production output" },
    { value: "~5 min", label: "Initial generation", note: "Role-period observation" },
    { value: "Seconds", label: "Individual edits", note: "After the initial artifact" },
  ] satisfies ExperienceMetric[],
  validationRows: [
    { label: "Provenance", detail: "Attach source and period to exact values", purpose: "Traceable evidence" },
    { label: "Assumptions", detail: "Keep forecast drivers explicit and editable", purpose: "Controlled revision" },
    { label: "Success criteria", detail: "Validate every Work assignment", purpose: "Completion check" },
    { label: "Reassignment", detail: "Dispatch failed work to another agent", purpose: "Workflow recovery" },
  ] satisfies ExperienceTableRow[],
  boundary: "The diagrams expose public workflow logic only. Customer materials, prompts, internal services, document templates, financial models and source code remain private.",
} as const;
