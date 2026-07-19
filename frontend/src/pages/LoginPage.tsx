import { ArrowRight, LockKeyhole, Mail, Phone, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PublicQueueCard } from '../components/PublicQueueCard';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('student@campus.test');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const path =
        mode === 'login'
          ? await login(email, password)
          : await register({ name, email, password, phone: phone || undefined });
      navigate(path);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Campus ordering overview">
        <PublicQueueCard />
        <div className="login-copy">
          <span>SE Part III Prototype</span>
          <h1>Campus Food Ordering and Management System</h1>
          <p>Students order ahead, vendors manage queues, staff call pickups, and admins monitor campus dining from one role-based platform.</p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            <LockKeyhole size={17} />
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            <UserPlus size={17} />
            Register
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' ? (
            <>
              <label>
                Full name
                <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
              </label>
              <label>
                Phone
                <div className="input-icon">
                  <Phone size={17} />
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional" />
                </div>
              </label>
              <div className="auth-note">
                Student/customer self-registration only. Vendor and staff accounts are created by the campus administrator.
              </div>
            </>
          ) : null}

          <label>
            Email
            <div className="input-icon">
              <Mail size={17} />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </label>
          <label>
            Password
            <div className="input-icon">
              <LockKeyhole size={17} />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
            </div>
          </label>

          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Processing...' : mode === 'login' ? 'Enter Dashboard' : 'Create Account'}
            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
};
