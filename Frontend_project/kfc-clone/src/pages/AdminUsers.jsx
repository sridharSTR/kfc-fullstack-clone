import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  approveAdminRequest,
  getAdminSession,
  getAdminUsers,
  rejectAdminRequest,
  revokeAdminAccess,
} from "../api/admin";

const formatStatus = (value) =>
  (value || "none")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function AdminUsers() {
  const session = getAdminSession();
  const isSuperuser = !!session?.user?.is_superuser;
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadUsers = async () => {
    const response = await getAdminUsers();
    setUsers(response.data.users || []);
  };

  useEffect(() => {
    let ignore = false;

    if (!isSuperuser) {
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    getAdminUsers()
      .then((response) => {
        if (!ignore) {
          setUsers(response.data.users || []);
        }
      })
      .catch((error) => {
        console.error("Admin users load error:", error);
        toast.error("Unable to load users");
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isSuperuser]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return users;
    }

    return users.filter((user) =>
      [user.username, user.email, user.role, user.admin_request_status]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [query, users]);

  const handleAction = async (userId, action) => {
    setSavingId(userId);

    try {
      if (action === "approve") {
        await approveAdminRequest(userId);
        toast.success("Admin request approved");
      } else if (action === "reject") {
        await rejectAdminRequest(userId);
        toast.success("Admin request rejected");
      } else {
        await revokeAdminAccess(userId);
        toast.success("Admin access revoked");
      }

      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Unable to update user");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="admin-shell">Loading users...</div>;
  }

  return (
    <div className="admin-shell">
      <AdminNavbar />

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <p className="section-subtitle">Superuser</p>
            <h1>Users</h1>
          </div>
          <div className="admin-topbar-actions single">
            <input
              placeholder="Search users, emails, roles"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        {!isSuperuser && (
          <div className="empty-state">
            <h2>Superuser access required</h2>
            <p>Only a superuser can approve, reject, or revoke admin access.</p>
          </div>
        )}

        {isSuperuser && (
          <section className="admin-panel">
            <div className="admin-panel-head">
              <h2>User Details</h2>
              <span>{filteredUsers.length} users</span>
            </div>

            <div className="admin-table admin-user-table">
              {filteredUsers.map((user) => (
                <div className="admin-table-row admin-user-row" key={user.id}>
                  <div>
                    <strong>{user.username}</strong>
                    <p>{user.email}</p>
                  </div>
                  <span>{user.role}</span>
                  <span>{formatStatus(user.admin_request_status)}</span>
                  <span>{user.is_email_verified ? "Verified" : "Unverified"}</span>
                  <div className="admin-row-actions">
                    {user.admin_request_status === "pending" && !user.is_staff && (
                      <>
                        <button
                          disabled={savingId === user.id}
                          onClick={() => handleAction(user.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="danger-btn"
                          disabled={savingId === user.id}
                          onClick={() => handleAction(user.id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user.is_staff && !user.is_superuser && (
                      <button
                        className="danger-btn"
                        disabled={savingId === user.id}
                        onClick={() => handleAction(user.id, "revoke")}
                      >
                        Revoke Admin
                      </button>
                    )}
                    {user.is_superuser && <span>Superuser</span>}
                    {!user.is_staff && user.admin_request_status !== "pending" && (
                      <span>No action</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminUsers;
