import { useState, useEffect } from "react";
import axios from "axios";

export default function VoterList() {
  const [voters, setVoters] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const votersPerPage = 10;

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    try {
      const res = await axios.get(
        "https://api-rxrn45juqa-uc.a.run.app/api/voters"
      );
      setVoters(res.data.voters);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredVoters = voters.filter((voter) => {
    if (filter === "voted" && !voter.hasVoted) return false;
    if (filter === "notVoted" && voter.hasVoted) return false;
    if (
      searchTerm &&
      !(
        voter.voterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.vname.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
      return false;
    return true;
  });

  const totalPages = Math.ceil(filteredVoters.length / votersPerPage);

  const paginatedVoters = filteredVoters.slice(
    (currentPage - 1) * votersPerPage,
    currentPage * votersPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">Voters List</h2>

      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search by Voter ID or Name"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="col-md-8 d-flex justify-content-end">
          <div className="btn-group">
            <button
              className={`btn btn-${filter === "all" ? "primary" : "outline-primary"}`}
              onClick={() => {
                setFilter("all");
                setCurrentPage(1);
              }}
            >
              All
            </button>
            <button
              className={`btn btn-${filter === "voted" ? "primary" : "outline-primary"}`}
              onClick={() => {
                setFilter("voted");
                setCurrentPage(1);
              }}
            >
              Voted
            </button>
            <button
              className={`btn btn-${filter === "notVoted" ? "primary" : "outline-primary"}`}
              onClick={() => {
                setFilter("notVoted");
                setCurrentPage(1);
              }}
            >
              Not Voted
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Voter ID</th>
              <th>Name</th>
              <th>Has Voted</th>
            </tr>
          </thead>
          <tbody>
            {paginatedVoters.map((voter) => (
              <tr key={voter._id}>
                <td>{voter.voterId}</td>
                <td>{voter.vname}</td>
                <td>
                  {voter.hasVoted ? (
                    <span className="badge bg-success">Yes</span>
                  ) : (
                    <span className="badge bg-danger">No</span>
                  )}
                </td>
              </tr>
            ))}

            {paginatedVoters.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center">
                  No voters found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <li
                key={num}
                className={`page-item ${currentPage === num ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(num)}
                >
                  {num}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
