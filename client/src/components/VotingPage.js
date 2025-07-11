import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function VotingPage() {
  const [voterId, setVoterId] = useState('');
  const [vname, setVoterName] = useState('');
  const [parties, setParties] = useState([]);
  const [voted, setVoted] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');
  const [liveVoterCount, setLiveVoterCount] = useState(0);
  const [status, setStatus] = useState('idle'); 
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLiveCount();
  }, [voted]);

  const fetchLiveCount = async () => {
    const res = await axios.get('https://api-rxrn45juqa-uc.a.run.app/api/live-voters');
    setLiveVoterCount(res.data.count);
  };

  const checkVoter = async () => {
    try {
      const res = await axios.post('https://api-rxrn45juqa-uc.a.run.app/api/check-voter', {
        voterId,
        vname,
      });

      setParties(res.data.parties || []);

      if (!res.data.exists) {
        setStatus('invalid');
        setErrorMsg(res.data.message || 'Voter not found or invalid name!');
      } else if (res.data.alreadyVoted) {
        setStatus('duplicate');
        setErrorMsg(res.data.message || 'You have already voted.');
      } else {
        setStatus('valid');
        setErrorMsg('');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Error checking voter.');
    }
  };

  const vote = async (partyId) => {
    try {
      const res = await axios.post('https://api-rxrn45juqa-uc.a.run.app/api/vote', {
        voterId,
        vname,
        partyId,
      });
      setVoteMessage(res.data.message);
      setVoted(true);
      fetchLiveCount();
    } catch (e) {
      alert(e.response?.data?.message || 'Error voting');
      setVoted(false);
    }
  };

  const reset = () => {
    setVoterId('');
    setVoterName('');
    setParties([]);
    setVoted(false);
    setVoteMessage('');
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <div className="container mt-5">
      <div className="text-center mb-3">
        <span className="badge bg-success">
          Live Voters Voted: {liveVoterCount}
        </span>
      </div>

      {/* STEP 1: ASK VOTER ID & NAME */}
      {status === 'idle' && !voted && (
        <div className="text-center">
          <h2 className="mb-4">Digital Ballot Box</h2>
          <input
            type="text"
            className="form-control w-50 mx-auto mb-3"
            value={voterId}
            onChange={e => setVoterId(e.target.value)}
            placeholder="Enter your voter ID"
          />
          <input
            type="text"
            className="form-control w-50 mx-auto mb-3"
            value={vname}
            onChange={e => setVoterName(e.target.value)}
            placeholder="Enter your Name"
          />
          <button className="btn btn-primary" onClick={checkVoter}>
            Submit
          </button>
        </div>
      )}

      {/* STEP 2: VOTER NOT FOUND or DUPLICATE */}
      {['invalid', 'duplicate'].includes(status) && !voted && (
        <div className="text-center">
          <div className={`alert alert-${status === 'invalid' ? 'danger' : 'warning'}`}>
            {errorMsg}
          </div>
          {parties.length > 0 && (
            <>
              <h4>You can still view and vote. Your vote will be counted as {status.toUpperCase()}.</h4>
              <div className="list-group mx-auto w-50 mt-3">
                {parties.map(p => (
                  <button
                    key={p.partyId}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={() => vote(p.partyId)}
                  >
                    <span>{p.name}</span>
                    {p.image && <img src={p.image} alt={p.name} height={40} />}
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="btn btn-secondary mt-3" onClick={reset}>
            Back to Home
          </button>
        </div>
      )}

      {/* STEP 3: VALID VOTER CAN VOTE */}
      {status === 'valid' && !voted && (
        <div className="text-center">
          <h3 className="mb-4">Please choose your party</h3>
          <div className="list-group mx-auto w-50">
            {parties.map(p => (
              <button
                key={p.partyId}
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                onClick={() => vote(p.partyId)}
              >
                <span>{p.name}</span>
                {p.image && <img src={p.image} alt={p.name} height={40} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: VOTING DONE */}
      {voted && (
        <div className="text-center">
          <div className="alert alert-success">
            {voteMessage}
          </div>
          <button className="btn btn-secondary mt-3" onClick={reset}>
            Back to Home
          </button>
        </div>
      )}

      <div className="text-center mt-5">
        <button
          className="btn btn-info"
          onClick={() => navigate('/stats')}
        >
          View Live Stats
        </button>
      </div>
            <div className="text-center mt-5">
        <button
          className="btn btn-info"
          onClick={() => navigate('/voterlist')}
        >
          View voter list
        </button>
      </div>
    </div>
  );
}
