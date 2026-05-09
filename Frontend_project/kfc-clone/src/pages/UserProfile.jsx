import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import '../styles/profile.css';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [requestingAdmin, setRequestingAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    apiService
      .getProfile()
      .then((response) => {
        if (!ignore) {
          setProfile(response.data);
        }
      })
      .catch((error) => {
        console.error('Profile load error:', error);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAdminRequest = async () => {
    setRequestingAdmin(true);

    try {
      const response = await apiService.requestAdminAccess();
      setProfile((current) => ({
        ...current,
        admin_request_status: response.data.user.admin_request_status,
      }));
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to request admin access');
    } finally {
      setRequestingAdmin(false);
    }
  };

  if (!profile) {
    return <div>Loading user profile...</div>;
  }

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div>
          <p className="section-subtitle">My KFC</p>
          <h1>{profile.username}</h1>
          <p>Account, role, and ordering access in one place.</p>
        </div>
        <span className="profile-role-pill">
          {profile.is_superuser ? 'Superuser' : profile.is_staff ? 'Admin' : 'User'}
        </span>
      </section>

      <section className="profile-grid">
        <article className="profile-card">
          <span className="food-tag">Identity</span>
          <h2>Profile Details</h2>
          <div className="profile-detail-list">
            <div>
              <span>Username</span>
              <strong>{profile.username}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>
            <div>
              <span>Full Name</span>
              <strong>
                {profile.first_name || profile.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : 'Not set'}
              </strong>
            </div>
          </div>
        </article>

        <article className="profile-card profile-status-card">
          <span className="food-tag">Access</span>
          <h2>Role Status</h2>
          <p>
            {profile.is_staff
              ? 'Admin access is active for this account.'
              : profile.admin_request_status === 'pending'
                ? 'Admin access request is waiting for superuser approval.'
                : profile.admin_request_status === 'rejected'
                  ? 'Your last admin request was rejected. You can request review again.'
                  : 'You can request admin access for superuser review.'}
          </p>
          <div className="profile-status-strip">
            <span>Email {profile.is_email_verified ? 'Verified' : 'Unverified'}</span>
            <span>{(profile.admin_request_status || 'none').replaceAll('_', ' ')}</span>
          </div>

          {!profile.is_staff && profile.admin_request_status !== 'pending' && (
            <button
              className="profile-primary-btn"
              disabled={requestingAdmin}
              onClick={handleAdminRequest}
            >
              {requestingAdmin ? 'Requesting...' : 'Request Admin Access'}
            </button>
          )}
        </article>
      </section>

      <div className="profile-actions">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </main>
  );
}
