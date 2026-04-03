import React, { useState } from 'react';
import ExplanationTag from './ExplanationTag';

function CandidateCard({ candidate, isAdmin, onReveal, onOverride, onSchedule, onStatusChange }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [showInterviewGuide, setShowInterviewGuide] = useState(false);

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  };

  const handleScheduleSubmit = () => {
    if (scheduleDate && scheduleTime) {
      onSchedule(candidate.candidate_code, {
        date: scheduleDate,
        time: scheduleTime,
        notes: scheduleNotes
      });
      setShowSchedule(false);
      setScheduleDate('');
      setScheduleTime('');
      setScheduleNotes('');
    }
  };

  const explanation = Array.isArray(candidate.explanation)
    ? candidate.explanation
    : [];

  const unmappedSkills = explanation.filter(e => !e.matched);

  const generateInterviewQuestions = () => {
    if (unmappedSkills.length === 0) {
      return ["Candidate met all core requirements. Focus on cultural fit: 'Describe a time you solved a complex team conflict.'"];
    }
    return unmappedSkills.map((skill, index) => {
      if (skill.item.includes('years exp')) {
        return `Experience Validation: "Can you walk me through the most complex project you've shipped end-to-end, and how you accelerated your learning?"`;
      }
      return `Missing Skill '${skill.item}': "Can you discuss a specific scenario where you had to quickly learn or adapt to an architecture involving ${skill.item}?"`;
    });
  };

  return (
    <div className="candidate-card fade-in" id={`candidate-${candidate.candidate_code}`}>
      <div className={`rank-badge ${getRankClass(candidate.rank)}`}>
        #{candidate.rank}
      </div>

      <div className="row align-items-center">
        <div className="col-md-2 text-center mb-3 mb-md-0">
          <div className="score-display">{candidate.score}</div>
          <div className="score-label">Score</div>
        </div>

        <div className="col-md-6 mb-3 mb-md-0">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="candidate-code">
              <i className="bi bi-person-badge me-1"></i>
              {candidate.candidate_code}
            </span>
            {candidate.override_reason && (
              <span className="override-badge">
                <i className="bi bi-exclamation-triangle me-1"></i>Manually Overridden
              </span>
            )}
            {candidate.interview && (
              <span className="interview-badge">
                <i className="bi bi-calendar-check me-1"></i>
                Interview: {candidate.interview.date} {candidate.interview.time}
              </span>
            )}
          </div>

          <div className="d-flex flex-wrap gap-1">
            {explanation.map((item, idx) => (
              <ExplanationTag key={idx} item={item} />
            ))}
          </div>
        </div>

        <div className="col-md-4">
          <div className="d-flex flex-wrap gap-2 justify-content-md-end">
            {isAdmin && (
              <>
                <button
                  className="btn btn-outline-primary btn-action"
                  onClick={() => onReveal(candidate.candidate_code)}
                  id={`reveal-btn-${candidate.candidate_code}`}
                >
                  <i className="bi bi-eye me-1"></i>Reveal Identity
                </button>
                <button
                  className="btn btn-outline-warning btn-action"
                  onClick={() => onOverride(candidate)}
                  id={`override-btn-${candidate.candidate_code}`}
                >
                  <i className="bi bi-pencil me-1"></i>Override Rank
                </button>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-success btn-action dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    id={`status-btn-${candidate.candidate_code}`}
                  >
                    <i className="bi bi-check-circle me-1"></i>Status
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item" onClick={() => onStatusChange(candidate.candidate_code, 'shortlisted')}>
                        <i className="bi bi-check-lg text-success me-2"></i>Shortlist
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={() => onStatusChange(candidate.candidate_code, 'not_selected')}>
                        <i className="bi bi-x-lg text-danger me-2"></i>Not Selected
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={() => onStatusChange(candidate.candidate_code, 'under_review')}>
                        <i className="bi bi-clock text-primary me-2"></i>Under Review
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
            <button
              className="btn btn-outline-info btn-action"
              onClick={() => setShowSchedule(!showSchedule)}
              id={`schedule-toggle-${candidate.candidate_code}`}
            >
              <i className="bi bi-calendar-plus me-1"></i>Schedule
            </button>
            <button
              className="btn btn-outline-secondary btn-action"
              onClick={() => setShowInterviewGuide(!showInterviewGuide)}
              id={`interview-guide-btn-${candidate.candidate_code}`}
            >
              <i className="bi bi-chat-text me-1"></i>Prep Guide
            </button>
          </div>

          {showSchedule && (
            <div className="schedule-form mt-2">
              <div className="row g-2">
                <div className="col-6">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    id={`schedule-date-${candidate.candidate_code}`}
                  />
                </div>
                <div className="col-6">
                  <input
                    type="time"
                    className="form-control form-control-sm"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    id={`schedule-time-${candidate.candidate_code}`}
                  />
                </div>
                <div className="col-12">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Notes (optional)"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    id={`schedule-notes-${candidate.candidate_code}`}
                  />
                </div>
                <div className="col-12">
                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={handleScheduleSubmit}
                    disabled={!scheduleDate || !scheduleTime}
                    id={`schedule-save-${candidate.candidate_code}`}
                  >
                    <i className="bi bi-check me-1"></i>Save Schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {showInterviewGuide && (
            <div className="interview-guide mt-3 bg-light border p-3 rounded-3 fade-in text-start">
              <h6 className="fw-bold mb-2 text-primary"><i className="bi bi-robot me-2"></i>Generated Interview Prep</h6>
              <p className="small text-muted mb-2">Automated behavioral questions tailored to candidate's missing qualifications:</p>
              <ul className="list-group list-group-flush mb-0 small">
                {generateInterviewQuestions().map((q, idx) => (
                  <li key={idx} className="list-group-item bg-transparent px-0 border-bottom-0 pb-1 pt-1">
                    <i className="bi bi-question-circle text-info me-2"></i><strong>Q{idx + 1}:</strong> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateCard;
