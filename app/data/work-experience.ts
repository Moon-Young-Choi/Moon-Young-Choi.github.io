export type ExperienceItem = {
  label: string;
  detail: string;
};

export type ExperienceMetric = {
  value: string;
  label: string;
  note: string;
};

export const avikusExperience = {
  status: "Public-safe reconstruction · No employer code or data",
  eventFlow: [
    { label: "Trigger", detail: "Relative speed · region entry or exit" },
    { label: "Action", detail: "Change course · change speed · leave or rejoin route" },
    { label: "Control", detail: "if · else · while · condition synchronization" },
    { label: "Scenario", detail: "Reusable sequence of synchronized events" },
  ] satisfies ExperienceItem[],
  stack: ["C++", "OpenCV", "CUDA", "OpenMP"],
  runtimeLanes: [
    { label: "Execution", detail: "Scenario, signal, and image simulation" },
    { label: "Output", detail: "Separated delivery path" },
    { label: "Visualization", detail: "Independent inspection path" },
  ] satisfies ExperienceItem[],
  metric: {
    value: "350×",
    label: "Accelerated simulation",
    note: "The simulator itself ran stably at the processor ceiling during final product validation; this was not stored-output playback.",
  } satisfies ExperienceMetric,
  boundary: "The diagrams are conceptual reconstructions. Employer code, imagery, datasets, NMEA sentence codes, values, distributions, internal thresholds and product identifiers are not reproduced.",
} as const;

export const finburhExperience = {
  status: "Private product architecture · Public reconstruction",
  agents: [
    { label: "Conversation", detail: "Receives the user request and maintains the interaction boundary" },
    { label: "Task", detail: "Decomposes the request into a DAG of bounded Work assignments" },
    { label: "Work", detail: "Builds analysis tables and editable artifacts from assigned evidence" },
    { label: "Research", detail: "Collects and parses the evidence requested by Task or Work" },
  ] satisfies ExperienceItem[],
  orchestrator: "A separate LLM orchestrator checked Work success criteria and automatically reassigned failed jobs without discarding completed steps.",
  mcpSources: ["DART MCP", "KRX MCP", "Web MCP"],
  assumptionDrivers: ["Operating drivers", "Market drivers", "Scenario path"],
  stack: ["Python", "MCP", "DART · KRX · Web", "Embedding · retrieval", "Word · PowerPoint · Excel"],
  retrievalFlow: ["DART · KRX · Web", "Company · period · material type", "Task-specific retrieval", "Agent context"],
  contextMetric: {
    value: "~30%",
    label: "Of initial prompt tokens",
    note: "Role-period observation relative to the initial full-context input, not a public benchmark.",
  } satisfies ExperienceMetric,
  outputMetrics: [
    { value: "30+", label: "Workbook sheets", note: "Editable Excel output" },
    { value: "~200", label: "Presentation slides", note: "Editable PowerPoint output" },
    { value: "~5 min", label: "Initial generation", note: "Role-period observation" },
    { value: "Seconds", label: "Individual edits", note: "After initial generation" },
  ] satisfies ExperienceMetric[],
  boundary: "The diagrams expose public workflow logic only. Customer materials, prompts, internal services, document templates, financial models and source code remain private.",
} as const;
