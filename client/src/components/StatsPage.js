import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StatsPage() {
  const [adminPassword, setAdminPassword] = useState('');
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const res = await axios.get('https://api-rxrn45juqa-uc.a.run.app/api/stats', {
        headers: {
          'x-stats-password': adminPassword,
        }
      });
      setStats(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Invalid admin password.');
      setStats(null);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Election Stats</h2>
      <input
        type="password"
        className="form-control w-50 mx-auto mb-3"
        placeholder="Enter admin password"
        value={adminPassword}
        onChange={e => setAdminPassword(e.target.value)}
      />
      <button className="btn btn-primary" onClick={fetchStats}>
        Fetch Stats
      </button>

      <button
        className="btn btn-danger mt-3 ms-3"
        onClick={() => navigate('/')}
      >
        Back to Home
      </button>

      {stats && (
        <div className="mt-4">
          <p><strong>Total Valid Votes:</strong> {stats.totalVotes}</p>
          <p><strong>Total Invalid Votes:</strong> {stats.totalInvalidVotes}</p>
          <p><strong>Total Duplicate Votes:</strong> {stats.totalDuplicateVotes}</p>
          <p><strong>Total Voters Voted:</strong> {stats.totalVoters}</p>

          {stats.duplicateAttemptsByVoter?.length > 0 && (
            <div className="mt-4">
              <h5>Duplicate Vote Attempts by Voter:</h5>
              <ul className="list-group">
                {stats.duplicateAttemptsByVoter.map(v => (
                  <li key={v.voterId} className="list-group-item d-flex justify-content-between">
                    <span>{v.voterId}</span>
                    <span className="badge bg-warning text-dark">
                      {v.duplicateVoteAttempts} attempts
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.invalidAttemptsByVoter?.length > 0 && (
            <div className="mt-4">
              <h5>Invalid Vote Attempts by Voter:</h5>
              <ul className="list-group">
                {stats.invalidAttemptsByVoter.map(v => (
                  <li key={v.voterId} className="list-group-item d-flex justify-content-between">
                    <span>{v.voterId}</span>
                    <span className="badge bg-danger">
                      {v.invalidVoteAttempts} attempts
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="row mt-4">
            {stats.stats.map(p => (
              <div key={p.partyId} className="col-md-4 col-sm-6 mb-4">
                <div className="card">
                  {p.image && (
                    <img
                      src={p.image}
                      className="card-img-top"
                      alt={p.name}
                      style={{ height: '100px', objectFit: 'contain' }}
                    />
                  )}
                  <div className="card-body text-center">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-text">
                      <strong>Votes:</strong> {p.votes} <br />
                      <strong>Invalid Votes:</strong> {p.invalidVotes || 0} <br />
                      <strong>Duplicate Votes:</strong> {p.duplicateVotes || 0} <br />
                      <strong>Percentage:</strong> {p.percentage}% <br />
                      {p.leadMargin !== "0.00" && (
                        <>
                          <strong>Lead Margin:</strong> {p.leadMargin}%
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
