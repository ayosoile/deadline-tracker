import { useEffect, useState, useRef  } from "react";
import "./App.css";
import { jwtDecode } from "jwt-decode"; //for decoding JWT tokens


// Helper function to include auth token in fetch requests
const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
};


function App() {

  // -------------------- STATE --------------------
  //user state to display username
  const [user, setUser] = useState(null);

  //authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const isLocked = !isAuthenticated;

  //deadlines state
  const [deadlines, setDeadlines] = useState([]);
  const [newDeadline, setNewDeadline] = useState({
    course: "",
    title: "",
    type: "",
    due_date: ""
  });

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Modals and data and error handling for login/register
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({username: "", password: ""});
  const [registerForm, setRegisterForm] = useState({username: "", password: "", confirmPassword: ""});
  const [authError, setAuthError] = useState("");

  // Ref for deadlines list allowing smooth scrolling
  const deadlinesRef = useRef(null);
  const scrollToDeadlines = () => {
    deadlinesRef.current?.scrollIntoView({behavior: "smooth"});
  };


  // -------------------- GrAB USER INFO (onload)--------------------
  useEffect(() => {
  const token = localStorage.getItem("token");

  if (token) {
    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    }
  }}, []);

  //logout handler
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  // -------------------- FETCH --------------------
  useEffect(() => {
    if (!isAuthenticated) {
      setDeadlines([{"_id": "demo1", "course": "Demo Course 2", "title": "Demo Assignment", "type": "assignment", "due_date": new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split("T")[0], "daysRemaining": 3, "overdue": false}, {"_id": "demo2", "course": "Demo Course 1", "title": "Demo Exam", "type": "exam", "due_date": new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split("T")[0], "daysRemaining": -2, "overdue": true}]);
      return;
   }

    const fetchDeadlines = async () => {
      const res = await authFetch("http://localhost:5000/");
      const data = await res.json();
      setDeadlines(data);
    };

    fetchDeadlines();
  }, [isAuthenticated]); //dependency on isAuthenticated to refetch on login/logout so can display default demo deadlines when logged out

  // -------------------- DELETE --------------------
  const deleteDeadline = async (id) => {
    await authFetch(`http://localhost:5000/${id}`, { method: "DELETE" });

    setDeadlines(prev =>
      prev.filter(deadline => deadline._id !== id)
    );
  };

  // -------------------- ADD --------------------
  const addDeadline = async (e) => {
    e.preventDefault();

    const allowedTypes = ["exam", "midterm", "assignment"];
    if (!allowedTypes.includes(newDeadline.type.toLowerCase())) {
      alert('Type must be "exam", "midterm", or "assignment".');
      return;
    }

    const res = await authFetch("http://localhost:5000/", {
      method: "POST",
      body: JSON.stringify({
        ...newDeadline,
        type: newDeadline.type.toLowerCase()
      })
    });

    const saved = await res.json();

    setDeadlines(prev => [...prev, saved]);

    setNewDeadline({
      course: "",
      title: "",
      type: "",
      due_date: ""
    });
  };

  // -------------------- UPDATE --------------------
  const updateDeadline = async (e) => {
    e.preventDefault();

    const allowedTypes = ["exam", "midterm", "assignment"];
    if (!allowedTypes.includes(editForm.type.toLowerCase())) {
      alert('Type must be "exam", "midterm", or "assignment".');
      return;
    }

    const res = await authFetch(
      `http://localhost:5000/${editForm._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: editForm.course,
          title: editForm.title,
          type: editForm.type.toLowerCase(),
          due_date: editForm.due_date
        })
      }
    );

    const updated = await res.json();

    setDeadlines(prev =>
      prev.map(d => (d._id === updated._id ? updated : d))
    );

    setIsEditing(false);
    setEditForm(null);
  };

  // -------------------- AUTH --------------------
  const handleLogin = async () => {
    setAuthError("");

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || "Login failed");
        return;
      }

      //store token and update auth state
      localStorage.setItem("token", data.token);
      setIsAuthenticated(true);
      setUser(jwtDecode(data.token));
      setShowLogin(false);

    } catch {
      setAuthError("Something went wrong");
    }
  };

  const handleRegister = async () => {
    setAuthError("");

    //confirm password match
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || "Registration failed");
        return;
      }

      //dynamically log in user after registration with token
      localStorage.setItem("token", data.token);
      setIsAuthenticated(true);
      setUser(jwtDecode(data.token));
      setShowRegister(false);

    } catch {
      setAuthError("Something went wrong");
    }
  };


  // -------------------- UI --------------------
  return (
  <div>
    {/*-------- NAVBAR --------*/}
    <nav className="navbar">
      <div className="nav-left">
        <span className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      Carleton Deadlines
        </span>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-user">
              {"Welcome " + user.username}
            </span>

            <button className="nav-btn secondary" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="nav-btn secondary" onClick={() => setShowLogin(true)}>
              Login
            </button>
            <button className="nav-btn primary" onClick={() => setShowRegister(true)}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>

    {/*-------- GUEST MESSAGE --------*/}
    <div className="guest-message">
      <h1>Track all your deadlines at Carleton and never miss an evaluation again</h1>
      {/* <p>Track assignments and tests, update deadlines, and receive email notifications so you never miss a deadline!</p> */}
      <button className="scroll-btn" onClick={scrollToDeadlines}>View Your Deadlines ↓</button>
      <div className="features">
      <div className="feature-card">
        <h3>All Your Deadlines in One Place</h3>
        <p>
          Keep track of assignments, midterms, and exams across all your courses
          in a single, organized dashboard.
        </p>
      </div>

      <div className="feature-card">
        <h3>Smart Deadline Tracking</h3>
        <p>
          Automatically see how many days remain until each deadline and get
          clear overdue warnings.
        </p>
      </div>

      <div className="feature-card">
        <h3>TBA: Email Notifications</h3>
        <p>
          Receive reminders when deadlines are approaching so nothing ever
          slips through the cracks.
        </p>
      </div>
    </div>
      {/*<p>{isLocked ? "Welcome to Carleton Deadlines! the single source of truth for all your deadlines! Create custom deadlines for your exams, assignments, midterms by adding them in the add section above. As well once added, you may edit or delete your deadline as many times as you want. You will receive email notifications for upcoming deadlines as well as anytime you add a one, so you never miss a deadline! Feel free to scroll down to view the demo!" : "Welcome to Carleton Deadlines! the single source of truth for all your deadlines! We are glad you registered. You now have full access to create custom deadlines for your exams, assignments, midterms, as well as email notifications so you never miss a deadline!"}</p>*/}
    </div>

    {/*-------- DEADLINES LIST & FORM --------*/}
    <div className="container" ref={deadlinesRef}>
      <h1>Your Deadlines</h1>

      <ul className="deadline-list">
        {deadlines
          .slice()
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .map(deadline => (
            <li key={deadline._id} className="deadline-item">
              <div className="deadline-info">
                <strong>{deadline.course}</strong> – {deadline.title} –{" "}
                {deadline.type} – Due:{" "}
                {new Date(deadline.due_date).toLocaleDateString()} –{" "}
                <span style={{ color: deadline.overdue ? "#ef4444" : "inherit" }}>
                {deadline.overdue
                  ? "Overdue"
                  : `Days Remaining: ${deadline.daysRemaining}`}
                </span>
              </div>

              <div className="deadline-actions">
                <button
                  className="delete-btn"
                  disabled={isLocked}
                  onClick={() => deleteDeadline(deadline._id)}
                >
                  Delete
                </button>

                <button
                  className="edit-btn"
                  onClick={() => {
                    setEditForm({
                      ...deadline,
                      due_date: new Date(deadline.due_date)
                        .toISOString()
                        .split("T")[0]
                    });
                    setIsEditing(true);
                  }}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
      </ul>

      {/* -------- EDIT MODAL -------- */}
      {isEditing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Edit Deadline</h2>

            <form onSubmit={updateDeadline}>
              <input
                disabled={isLocked}
                type="text"
                value={editForm.course}
                onChange={e =>
                  setEditForm({ ...editForm, course: e.target.value })
                }
                required
              />

              <input
                disabled={isLocked}
                type="text"
                value={editForm.title}
                onChange={e =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                required
              />

              <input
                disabled={isLocked}
                type="text"
                value={editForm.type}
                onChange={e =>
                  setEditForm({ ...editForm, type: e.target.value })
                }
                required
              />

              <input
                disabled={isLocked}
                type="date"
                value={editForm.due_date}
                onChange={e =>
                  setEditForm({ ...editForm, due_date: e.target.value })
                }
                required
              />

              <div className="modal-actions" style={{ marginTop: "10px" }}>
                <button type="submit" disabled={isLocked}>Save</button>
                <button type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------- ADD FORM -------- */}
      <form className="add-form" onSubmit={addDeadline}>
        <h2>Add New Deadline</h2>

        <input
          type="text"
          placeholder="Course"
          value={newDeadline.course}
          onChange={e =>
            setNewDeadline({ ...newDeadline, course: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Title"
          value={newDeadline.title}
          onChange={e =>
            setNewDeadline({ ...newDeadline, title: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Type (Either exam, midterm, or assignment)"
          value={newDeadline.type}
          onChange={e =>
            setNewDeadline({ ...newDeadline, type: e.target.value })
          }
          required
        />

        <input
          type="date"
          value={newDeadline.due_date}
          onChange={e =>
            setNewDeadline({ ...newDeadline, due_date: e.target.value })
          }
          required
        />
        <button type="submit" disabled={isLocked} style={{ marginTop: "10px" }}>Add Deadline</button>
        <h3>{isLocked ? "Please log in to manage deadlines." : ""}</h3>
      </form>
    </div>

    {/* -------- AUTH MODALS -------- */}
    {showLogin && (
      <div className="modal-backdrop">
        <div className="auth-modal">
          <h2>Login</h2>

          <input type="text" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
          <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}/>

          {/* Display authentication error if any */}
          {authError && <p>{authError}</p>}

          <button className="auth-primary" onClick={handleLogin}>Login</button>

          <p className="auth-switch">
            Don’t have an account?{" "}
            <span
              onClick={() => {
                setShowLogin(false);
                setShowRegister(true);
              }}
            >
              Register
            </span>
          </p>

          <button
            className="auth-close"
            onClick={() => setShowLogin(false)}
          >
            ✕
          </button>
        </div>
      </div>
    )}
    {showRegister && (
      <div className="modal-backdrop">
        <div className="auth-modal">
          <h2>Create Account</h2>

          <input type="text" placeholder="Username" value={registerForm.username} onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })} />
          <input type="password" placeholder="Password" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
          <input type="password" placeholder="Confirm Password" value={registerForm.confirmPassword} onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} />

          {/* Display authentication error if any */}
          {authError && <p>{authError}</p>}
          <button className="auth-primary" onClick={handleRegister}>Register</button>

          <p className="auth-switch">
            Already have an account?{" "}
            <span
              onClick={() => {
                setShowRegister(false);
                setShowLogin(true);
              }}
            >
              Login
            </span>
          </p>

          <button
            className="auth-close"
            onClick={() => setShowRegister(false)}
          >
            ✕
          </button>
        </div>
      </div>
    )}

  </div>
  );
}

export default App;
