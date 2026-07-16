import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAnalyses from "./tools/list-analyses";
import getAnalysis from "./tools/get-analysis";
import listPatients from "./tools/list-patients";
import createPatient from "./tools/create-patient";
import listDiseases from "./tools/list-diseases";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "medvision-mcp",
  title: "MedVision MCP",
  version: "0.1.0",
  instructions:
    "Tools for MedVision, an AI chest X-ray pneumonia diagnostic app. Use list_analyses/get_analysis to review the signed-in user's X-ray results, list_patients/create_patient to manage their patient records, and list_diseases to browse the diseases catalog.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listAnalyses, getAnalysis, listPatients, createPatient, listDiseases],
});
