import RiskBadge from "./RiskBadge";

function ContactTable({ data }) {
  return (
    <div className="table-box">
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Contact</th>
            <th>Location</th>
            <th>Duration</th>
            <th>Risk</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.source}</td>
              <td>{item.contact}</td>
              <td>{item.location}</td>
              <td>{item.duration}</td>
              <td>
                <RiskBadge level={item.risk} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ContactTable;