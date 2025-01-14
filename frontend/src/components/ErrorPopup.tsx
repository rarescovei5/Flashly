import React from 'react';

const ErrorPopup = (props: {
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  xr?: number;
  xl?: number;
  yt?: number;
  yb?: number;
}) => {
  if (props.error === '') return <></>;

  const positionStyles: React.CSSProperties = {};

  if (
    props.xl !== undefined &&
    props.xr !== undefined &&
    props.xl === props.xr
  ) {
    positionStyles.left = '50%';
    positionStyles.transform = 'translateX(-50%)';
  } else if (props.xl !== undefined) {
    positionStyles.left = `${
      props.xl < 0 ? `-${Math.abs(props.xl)}rem` : `${props.xl}rem`
    }`;
  } else if (props.xr !== undefined) {
    positionStyles.right = `${
      props.xr < 0 ? `-${Math.abs(props.xr)}rem` : `${props.xr}rem`
    }`;
  }

  if (props.yt !== undefined) {
    positionStyles.top = `${
      props.yt < 0 ? `-${Math.abs(props.yt)}rem` : `${props.yt}rem`
    }`;
  }

  if (props.yb !== undefined) {
    positionStyles.bottom = `${
      props.yb < 0 ? `-${Math.abs(props.yb)}rem` : `${props.yb}rem`
    }`;
  }
  return (
    <div
      style={positionStyles}
      className="fixed z-50  bg-red-900 p-4 rounded-2xl max-w-sm border-c-dark border-2"
      id="error-popup"
    >
      <button
        className="absolute top-0 right-0  translate-x-[50%] translate-y-[-50%] p-small flex items-center justify-center bg-red-900 text-bg-c-dark rounded-full w-6 h-6 border-c-dark border-2"
        onClick={() => props.setError('')}
      >
        X
      </button>
      <p className="p-small text-[#fff] text-wrap">{props.error}</p>
    </div>
  );
};

export default ErrorPopup;
