import { useState } from 'react';
import { loginUser } from '../api';
import ErrorPopup from '../components/ErrorPopup';

import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Signin = () => {
  const { setAuth } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  let [email, setEmail] = useState<string>('');
  let [password, setPassword] = useState<string>('');
  let [errorMsg, setErrorMsg] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;

    setErrorMsg('');

    if (name === 'email') {
      setEmail(value);
    }
    if (name === 'password') {
      setPassword(value);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setErrorMsg('');
    e.preventDefault();

    const res = await loginUser({ email, password });

    if (res.error === 'No Error') {
      const token = res.accessToken;
      setAuth({ email, password, accessToken: token });

      navigate(from, { replace: true });
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
          <h4 className="h4 mb-6">Sign in</h4>
          <form
            className="flex flex-col gap-4 w-full mb-4"
            onSubmit={handleSubmit}
          >
            <input
              className="p-small py-3 px-4 rounded-2xl bg-c-dark placeholder:p-small placeholder:text-white text-white outline-none"
              type="email"
              value={email}
              placeholder="Email"
              onChange={handleChange}
              name="email"
              required
            />
            <input
              className="p-small py-3 px-4 rounded-2xl bg-c-dark placeholder:p-small placeholder:text-white text-white outline-none"
              type="password"
              value={password}
              placeholder="Password"
              onChange={handleChange}
              name="password"
              required
            />

            <button className="primary-btn" type="submit">
              Submit
            </button>
          </form>
          <p className="p-small">
            Don't have an account?{' '}
            <Link className="text-c-blue" to="/sign-up">
              Signup
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

export default Signin;
