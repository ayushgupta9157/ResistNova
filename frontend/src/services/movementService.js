const movements = [
  {
    id: 1,
    person: "P102",
    type: "Patient",
    location: "ICU",
    entry: "10:00 AM",
    exit: "11:30 AM"
  },
  {
    id: 2,
    person: "N101",
    type: "Staff",
    location: "ICU",
    entry: "10:30 AM",
    exit: "12:00 PM"
  },
  {
    id: 3,
    person: "P103",
    type: "Patient",
    location: "Ward A",
    entry: "11:00 AM",
    exit: "12:15 PM"
  }
];

export const getMovements = () => movements;