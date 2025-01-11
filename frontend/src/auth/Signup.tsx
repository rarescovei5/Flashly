import { useState } from 'react';
import ErrorPopup from '../components/ErrorPopup';

const Signup = () => {
  let [email, setEmail] = useState<string>('');
  let [username, setUsername] = useState<string>('');
  let [password1, setPassword1] = useState<string>('');
  let [password2, setPassword2] = useState<string>('');
  let [errorMessage, setErrorMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;

    setErrorMessage('');

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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setErrorMessage('');
    e.preventDefault();

    if (password1 !== password2) {
      setErrorMessage('Passwords do not match');
      return;
    }
  };

  return (
    <>
      <ErrorPopup error={errorMessage} xr={2} yb={4} />
      <div className="flex flex-col items-center mx-auto w-2/3 h-screen">
        <h1 className="h3 mt-4"> Flashly</h1>
        <div className="flex flex-col items-center bg-c-light px-4 py-6 rounded-2xl my-auto w-full max-w-[400px] min-w-80">
          <h4 className="h4 mb-6">Signup</h4>
          <form
            className="flex flex-col gap-4 w-full mb-4"
            onSubmit={handleSubmit}
          >
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
              type="text"
              required={true}
              value={username}
              placeholder="Username"
              onChange={handleChange}
              name="username"
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
            <a className="text-c-blue" href="/sign-in">
              Signin
            </a>
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
