const contacts = [
  {
    id: 1,
    source: "P102",
    contact: "N101",
    location: "ICU",
    duration: "60 min",
    risk: "HIGH"
  },
  {
    id: 2,
    source: "N101",
    contact: "P103",
    location: "Ward A",
    duration: "35 min",
    risk: "MEDIUM"
  },
  {
    id: 3,
    source: "P104",
    contact: "D201",
    location: "Emergency",
    duration: "15 min",
    risk: "LOW"
  }
];

export const getContacts = () => contacts;