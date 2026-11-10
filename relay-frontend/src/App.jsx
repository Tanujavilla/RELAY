
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const members = ["Rahul", "Priya", "Anjali"];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [newActivity, setNewActivity] = useState({
    title: "",
    member: "Rahul",
    type: "Pending"
  });

  const [selectedMember, setSelectedMember] = useState("Rahul");
  const [report, setReport] = useState(null);
  const [approved, setApproved] = useState(false);

  // Fetch activities from backend
  async function fetchActivities() {
    try {
      setLoading(true);
      setApiError("");

      const response = await fetch(`${API_URL}/activities`);

      if (!response.ok) {
        throw new Error("Unable to load activities");
      }

      const data = await response.json();
      setActivities(data);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();
  }, []);

  // Dashboard statistics
  const completed = activities.filter(
    a => a.type === "Completed"
  ).length;

  const pending = activities.filter(
    a => a.type === "Pending"
  ).length;

  const ongoing = activities.filter(
    a => a.type === "In Progress"
  ).length;

  const completionRate = activities.length
    ? Math.round((completed / activities.length) * 100)
    : 0;

  // Activity search and filtering
  const filteredActivities = activities.filter(a => {
    const matchesSearch =
      (a.title + " " + a.member + " " + a.type)
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || a.type === filter;

    return matchesSearch && matchesFilter;
  });

  function resetForm() {
    setNewActivity({
      title: "",
      member: "Rahul",
      type: "Pending"
    });

    setEditingId(null);
    setShowForm(false);
  }

  // Add or update activity using backend
  async function addOrUpdateActivity(e) {
    e.preventDefault();

    if (!newActivity.title.trim()) {
      alert("Please enter an activity name.");
      return;
    }

    try {
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing
          ? `${API_URL}/activities/${editingId}`
          : `${API_URL}/activities`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...newActivity,
            title: newActivity.title.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save activity");
      }

      if (isEditing) {
        setActivities(prev =>
          prev.map(a =>
            a.id === editingId ? data.activity : a
          )
        );
      } else {
        setActivities(prev => [...prev, data.activity]);
      }

      resetForm();
      alert(isEditing
        ? "Activity updated successfully!"
        : "Activity added successfully!"
      );

    } catch (error) {
      alert("Backend error: " + error.message);
    }
  }

  // Edit activity
  function editActivity(activity) {
    setNewActivity({
      title: activity.title,
      member: activity.member,
      type: activity.type
    });

    setEditingId(activity.id);
    setShowForm(true);
  }

  // Delete activity using backend
  async function deleteActivity(id) {
    if (!window.confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/activities/${id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete activity");
      }

      setActivities(prev => prev.filter(a => a.id !== id));
      alert("Activity deleted successfully!");

    } catch (error) {
      alert("Backend error: " + error.message);
    }
  }

  // Generate handover from backend activity data
  function generateHandover() {
    const memberActivities = activities.filter(
      a => a.member === selectedMember
    );

    setReport({
      member: selectedMember,
      completed: memberActivities.filter(
        a => a.type === "Completed"
      ),
      ongoing: memberActivities.filter(
        a => a.type === "In Progress"
      ),
      pending: memberActivities.filter(
        a => a.type === "Pending"
      ),
      generatedAt: new Date().toLocaleString()
    });

    setApproved(false);
  }

  // Download handover report
  function downloadReport() {
    if (!report) return;

    const content = [
      "RELAY - PROJECT HANDOVER REPORT",
      "================================",
      `Contributor: ${report.member}`,
      `Generated: ${report.generatedAt}`,
      "",
      "COMPLETED WORK",
      ...report.completed.map(a => "- " + a.title),
      "",
      "WORK IN PROGRESS",
      ...report.ongoing.map(a => "- " + a.title),
      "",
      "PENDING WORK",
      ...report.pending.map(a => "- " + a.title),
      "",
      "VERIFICATION NOTES",
      "These are demonstration project records.",
      "Original source evidence is not connected yet.",
      "Risks and dependencies require human verification.",
      `Review status: ${approved ? "Approved in demo" : "Not approved"}`
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `RELAY-Handover-${report.member}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function statusClass(type) {
    return type.replace(" ", "-").toLowerCase();
  }

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Projects", icon: "▣" },
    { name: "Activity", icon: "◷" },
    { name: "Handover", icon: "⇄" },
    { name: "Review", icon: "✓" }
  ];

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>RELAY</h2>
            <span>Knowledge Continuity</span>
          </div>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav>
          {menuItems.map(item => (
            <button
              key={item.name}
              className={
                activePage === item.name
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">SH</div>
          <div>
            <strong>Team Relay</strong>
            <span>Project Workspace</span>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main">

        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Workspace / {activePage}
            </p>
            <h1>{activePage}</h1>
          </div>

          <div className="top-right">
            <span className="status-dot"></span>
            <span>Backend Connected</span>
            <div className="user-avatar">SH</div>
          </div>
        </header>

        {loading && (
          <div className="notice">
            Loading activities from RELAY backend...
          </div>
        )}

        {apiError && (
          <div className="warning-box">
            Backend connection failed: {apiError}
            <button
              className="secondary-btn"
              onClick={fetchActivities}
            >
              Retry
            </button>
          </div>
        )}

        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <section>

            <div className="welcome">
              <div>
                <p className="eyebrow">PROJECT OVERVIEW</p>
                <h2>Welcome to RELAY 👋</h2>
                <p>
                  Keep project knowledge connected.
                  Make every handover smoother.
                </p>
              </div>

              <button
                className="primary-btn"
                onClick={() => setActivePage("Handover")}
              >
                + Create Handover
              </button>
            </div>

            <div className="stats-grid">

              <div className="stat-card">
                <span className="stat-icon purple">▣</span>
                <p>Total Activities</p>
                <h2>{activities.length}</h2>
                <small>Recorded project activities</small>
              </div>

              <div className="stat-card">
                <span className="stat-icon green">✓</span>
                <p>Completed</p>
                <h2>{completed}</h2>
                <small>Successfully completed</small>
              </div>

              <div className="stat-card">
                <span className="stat-icon orange">◷</span>
                <p>In Progress</p>
                <h2>{ongoing}</h2>
                <small>Currently being worked on</small>
              </div>

              <div className="stat-card">
                <span className="stat-icon red">!</span>
                <p>Pending</p>
                <h2>{pending}</h2>
                <small>Needs attention</small>
              </div>

            </div>

            <div className="content-grid">

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent Activities</h3>
                    <p>Latest project updates</p>
                  </div>

                  <button
                    className="text-btn"
                    onClick={() => setActivePage("Activity")}
                  >
                    View all →
                  </button>
                </div>

                {activities.slice(-5).reverse().map(activity => (
                  <div className="activity-row" key={activity.id}>
                    <div className="activity-marker"></div>

                    <div className="activity-info">
                      <strong>{activity.title}</strong>
                      <span>
                        {activity.member} · {activity.date}
                      </span>
                    </div>

                    <span className={`badge ${statusClass(activity.type)}`}>
                      {activity.type}
                    </span>
                  </div>
                ))}

                {activities.length === 0 && (
                  <p className="muted">No activities available.</p>
                )}
              </div>

              <div className="panel">
                <h3>Project Health</h3>
                <p className="muted">
                  Activity completion overview
                </p>

                <div className="progress-number">
                  {completionRate}%
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>

                <p className="muted">
                  Based on recorded activities.
                </p>

                <div className="tip-box">
                  <strong>Knowledge transfer matters</strong>
                  <p>
                    Generate a handover to help the next contributor
                    understand ongoing work.
                  </p>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* PROJECTS */}
        {activePage === "Projects" && (
          <section className="panel page-panel">

            <div className="panel-heading">
              <div>
                <h3>My Projects</h3>
                <p>Project workspace information</p>
              </div>

              <span className="badge completed">Active</span>
            </div>

            <div className="project-card">
              <div className="project-symbol">R</div>

              <div>
                <h3>RELAY – Knowledge Handover</h3>
                <p>
                  Convert scattered project activity into
                  an actionable handover.
                </p>
                <small>Team Relay · Demonstration project</small>
              </div>
            </div>

            <p className="notice">
              Demonstration project workspace.
            </p>

          </section>
        )}

        {/* ACTIVITY */}
        {activePage === "Activity" && (
          <section className="panel page-panel">

            <div className="panel-heading">
              <div>
                <h3>Project Activity</h3>
                <p>Manage and track project activities</p>
              </div>

              <button
                className="primary-btn"
                onClick={() => {
                  if (showForm) resetForm();
                  else setShowForm(true);
                }}
              >
                {showForm ? "Cancel" : "+ Add Activity"}
              </button>
            </div>

            {showForm && (
              <form
                className="activity-form"
                onSubmit={addOrUpdateActivity}
              >
                <h3>
                  {editingId !== null
                    ? "Edit Activity"
                    : "New Activity"}
                </h3>

                <label>Activity Name</label>

                <input
                  type="text"
                  placeholder="Enter activity name"
                  value={newActivity.title}
                  onChange={e =>
                    setNewActivity({
                      ...newActivity,
                      title: e.target.value
                    })
                  }
                  required
                />

                <label>Responsible Member</label>

                <select
                  value={newActivity.member}
                  onChange={e =>
                    setNewActivity({
                      ...newActivity,
                      member: e.target.value
                    })
                  }
                >
                  {members.map(member => (
                    <option key={member}>{member}</option>
                  ))}
                </select>

                <label>Activity Status</label>

                <select
                  value={newActivity.type}
                  onChange={e =>
                    setNewActivity({
                      ...newActivity,
                      type: e.target.value
                    })
                  }
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>

                <button className="primary-btn" type="submit">
                  {editingId !== null
                    ? "Update Activity"
                    : "Save Activity"}
                </button>

              </form>
            )}

            <div className="activity-tools">
              <input
                className="search-input"
                placeholder="Search activities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option>All</option>
                <option>Completed</option>
                <option>In Progress</option>
                <option>Pending</option>
              </select>
            </div>

            {filteredActivities.map(activity => (
              <div className="activity-row" key={activity.id}>
                <div className="activity-marker"></div>

                <div className="activity-info">
                  <strong>{activity.title}</strong>
                  <span>
                    {activity.member} · {activity.date}
                  </span>
                </div>

                <span className={`badge ${statusClass(activity.type)}`}>
                  {activity.type}
                </span>

                <div className="action-buttons">
                  <button
                    className="edit-btn"
                    onClick={() => editActivity(activity)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteActivity(activity.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredActivities.length === 0 && (
              <p className="muted empty-message">
                No matching activities found.
              </p>
            )}

            <p className="notice">
              Activities are currently managed through the
              Express backend.
            </p>

          </section>
        )}

        {/* HANDOVER */}
        {activePage === "Handover" && (
          <section className="panel page-panel">

            <h3>Generate Project Handover</h3>

            <p className="muted">
              Create a structured report from project activities.
            </p>

            <label className="field-label">
              Select departing team member
            </label>

            <select
              value={selectedMember}
              onChange={e => {
                setSelectedMember(e.target.value);
                setReport(null);
                setApproved(false);
              }}
            >
              {members.map(member => (
                <option key={member}>{member}</option>
              ))}
            </select>

            <button
              className="primary-btn generate-btn"
              onClick={generateHandover}
              disabled={loading || !!apiError}
            >
              Generate Handover Report
            </button>

            {report && (
              <div className="report">

                <div className="report-heading">
                  <div>
                    <p className="eyebrow">GENERATED HANDOVER</p>
                    <h2>{report.member}'s Project Handover</h2>
                    <span className="muted">
                      Generated on {report.generatedAt}
                    </span>
                  </div>

                  <span className={`badge ${approved ? "completed" : "pending"}`}>
                    {approved ? "Approved" : "Awaiting Review"}
                  </span>
                </div>

                <div className="report-section">
                  <h4>✓ Completed Work</h4>
                  {report.completed.length
                    ? report.completed.map(a => (
                        <p key={a.id}>• {a.title}</p>
                      ))
                    : <p>No recorded completed activities.</p>}
                </div>

                <div className="report-section">
                  <h4>◷ Work in Progress</h4>
                  {report.ongoing.length
                    ? report.ongoing.map(a => (
                        <p key={a.id}>• {a.title}</p>
                      ))
                    : <p>No recorded ongoing activities.</p>}
                </div>

                <div className="report-section">
                  <h4>! Pending Work</h4>
                  {report.pending.length
                    ? report.pending.map(a => (
                        <p key={a.id}>• {a.title}</p>
                      ))
                    : <p>No recorded pending activities.</p>}
                </div>

                <div className="warning-box">
                  <strong>Information limitation</strong>
                  <p>
                    This report uses recorded demonstration data.
                    Source evidence, risks, decisions and dependencies
                    require further verification.
                  </p>
                </div>

                <div className="button-row">

                  <button
                    className="secondary-btn"
                    onClick={downloadReport}
                  >
                    Download Report
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() => {
                      setApproved(true);
                      setActivePage("Review");
                    }}
                  >
                    Approve Handover
                  </button>

                </div>

              </div>
            )}

          </section>
        )}

        {/* REVIEW */}
        {activePage === "Review" && (
          <section className="panel page-panel">

            <h3>Handover Review</h3>

            <p className="muted">
              Check the generated report before sharing.
            </p>

            {!report ? (
              <div className="empty-state">
                <div className="empty-icon">⇄</div>
                <h3>No handover generated yet</h3>
                <p>
                  Generate a report first to review and approve it.
                </p>

                <button
                  className="primary-btn"
                  onClick={() => setActivePage("Handover")}
                >
                  Go to Handover
                </button>
              </div>
            ) : (
              <div className="review-card">

                <h3>{report.member}'s Handover</h3>

                <p>Completed: {report.completed.length}</p>
                <p>In Progress: {report.ongoing.length}</p>
                <p>Pending: {report.pending.length}</p>

                <div className={approved ? "success-box" : "warning-box"}>
                  {approved
                    ? "This demonstration handover is marked approved."
                    : "This handover is awaiting reviewer approval."}
                </div>

                {!approved && (
                  <button
                    className="primary-btn"
                    onClick={() => setApproved(true)}
                  >
                    Approve Handover
                  </button>
                )}

                {approved && (
                  <button
                    className="secondary-btn"
                    onClick={downloadReport}
                  >
                    Download Report
                  </button>
                )}

              </div>
            )}

          </section>
        )}

        <footer>
          © 2026 RELAY · Intelligent Project Handover System · Demo Version
        </footer>

      </main>
    </div>
  );
}

export default App;
