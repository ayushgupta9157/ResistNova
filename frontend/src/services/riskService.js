const risks = [
  {
    id: "P102",
    score: 92,
    level: "HIGH",
    reason: "Repeated ICU exposure"
  },
  {
    id: "N101",
    score: 78,
    level: "MEDIUM",
    reason: "Direct patient care"
  },
  {
    id: "P103",
    score: 45,
    level: "LOW",
    reason: "Short exposure duration"
  }
];

export const getRisks = () => risks;