function MovementTable({ data }) {
  return (
    <div className="table-box">
      <table>
        <thead>
          <tr>
            <th>Person</th>
            <th>Type</th>
            <th>Location</th>
            <th>Entry</th>
            <th>Exit</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.person}</td>
              <td>{item.type}</td>
              <td>{item.location}</td>
              <td>{item.entry}</td>
              <td>{item.exit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MovementTable;