function StatCard({ title, value, text, type }) {
  return (
    <div className={`stat-card ${type || ""}`}>
      <p>{title}</p>
      <h2>{value}</h2>
      <span>{text}</span>
    </div>
  );
}

export default StatCard;