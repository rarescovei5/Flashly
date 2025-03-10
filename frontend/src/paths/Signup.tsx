import { useState } from 'react';
import ErrorPopup from '../components/ErrorPopup';
import { registerUser } from '../api';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  let [email, setEmail] = useState<string>('');
  let [username, setUsername] = useState<string>('');
  let [password1, setPassword1] = useState<string>('');
  let [password2, setPassword2] = useState<string>('');
  let [errorMsg, setErrorMsg] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;

    setErrorMsg('');

    if (name === 'email') {
      setEmail(value);
    }
    if (name === 'password1') {
      setPassword1(value);
    }
    if (name === 'password2') {
      setPassword2(value);
    }
    if (name === 'username') {
      setUsername(value);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setErrorMsg('');
    e.preventDefault();

    if (password1 !== password2) {
      setErrorMsg('Passwords do not match');
      return;
    } else if (password1.length < 8) {
      setErrorMsg('Password must be at least 8 characters');
      return;
    } else if (password1.length > 24) {
      setErrorMsg('Password must be less than 24 characters');
      return;
    } else if (!/(?=.*[a-z])/.test(password1)) {
      setErrorMsg('Password must contain at least one lowercase letter');
      return;
    } else if (!/(?=.*[A-Z])/.test(password1)) {
      setErrorMsg('Password must contain at least one uppercase letter');
      return;
    } else if (!/(?=.*\d)/.test(password1)) {
      setErrorMsg('Password must contain at least one number');
      return;
    }

    const res = await registerUser({ email, username, password: password1 });
    if (res.error === 'No Error') {
      navigate('/sign-in');
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <>
      <ErrorPopup error={errorMsg} setError={setErrorMsg} xr={2} yb={4} />
      <div className="flex flex-col items-center mx-auto w-2/3 h-screen">
        <Link className="h3 mt-4" to="/">
          Flashly
        </Link>
        <div className="flex flex-col items-center bg-c-light px-4 py-6 rounded-2xl my-auto w-full max-w-[400px] min-w-80">
          <h4 className="h4 mb-6">Signup</h4>
          <form
            className="flex flex-col gap-4 w-full mb-4"
            onSubmit={handleSubmit}
          >
            <input
              className="p-small py-3 px-4 rounded-2xl bg-c-dark placeholder:p-small placeholder:text-white text-white outline-none"
              type="text"
              required={true}
              value={username}
              placeholder="Username"
              onChange={handleChange}
              name="username"
            />
            <input
              className="p-small py-3 px-4 rounded-2xl bg-c-dark placeholder:p-small placeholder:text-white text-white outline-none"
              type="email"
              required={true}
              value={email}
              placeholder="Email"
              onChange={handleChange}
              name="email"
            />
            <input
              className="p-small py-3 px-4 rounded-2xl bg-c-dark placeholder:p-small placeholder:text-white text-white outline-none"
              type="password"
              required={true}
              value={password1}
              placeholder="Create Password"
              onChange={handleChange}
              name="password1"
            />
            <input
              className="p-small py-3 px-4 rounded-2xl bg-c-dark placeholder:p-small placeholder:text-white text-white outline-none"
              type="password"
              required={true}
              value={password2}
              placeholder="Repeat Password"
              onChange={handleChange}
              name="password2"
            />
            <button className="primary-btn" type="submit">
              Create Account
            </button>
          </form>
          <p className="p-small">
            Already have an account?{' '}
            <Link className="text-c-blue" to="/sign-in">
              Signin
            </Link>
          </p>
          <div className="flex flex-row items-center w-full my-8">
            <hr className="h-[1px] bg-[#fff] flex-1" />
            <p className="p-small mx-2">Or</p>
            <hr className="h-[1px] bg-[#fff] flex-1" />
          </div>
          <button className="relative flex flex-row w-full items-center rounded-2xl bg-[#043988] py-3 px-4 mb-4">
            <img className="absolute left-4" src="./face-ico.svg" alt="" />
            <p className="text-center w-full">Continue with Facebook</p>
          </button>
          <button className="relative flex flex-row w-full items-center rounded-2xl bg-c-dark py-3 px-4">
            <img className="absolute left-4" src="./goge-ico.svg" alt="" />
            <p className="text-center w-full">Continue with Google</p>
          </button>
        </div>
      </div>
    </>
  );
};

export default Signup;
