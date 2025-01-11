import React from 'react';

function formatError(error: string) {
  const chunkSize = 40;
  const words = error.split(' ');
  const chunks = [];
  let currentChunk = '';

  for (const word of words) {
    if (currentChunk.length + word.length + 1 > chunkSize) {
      chunks.push(currentChunk);
      currentChunk = word;
    } else {
      if (currentChunk !== '') {
        currentChunk += ' ';
      }
      currentChunk += word;
    }
  }

  if (currentChunk !== '') {
    chunks.push(currentChunk);
  }

  return chunks.map((chunk, index) => (
    <React.Fragment key={index}>
      {chunk}
      {index < chunks.length - 1 && <br />}
    </React.Fragment>
  ));
}

const ErrorPopup = (props: {
  error: string;
  xr?: number;
  xl?: number;
  yt?: number;
  yb?: number;
}) => {
  if (props.error === '') return <></>;

  let left =
    props.xl !== undefined
      ? `${props.xl < 0 ? `-left-${Math.abs(props.xl)}` : `left-${props.xl}`}`
      : '';
  let right =
    props.xr !== undefined
      ? `${props.xr < 0 ? `-right-${Math.abs(props.xr)}` : `right-${props.xr}`}`
      : '';
  let top =
    props.yt !== undefined
      ? `${props.yt < 0 ? `-top-${Math.abs(props.yt)}` : `top-${props.yt}`}`
      : '';
  let bottom =
    props.yb !== undefined
      ? `${
          props.yb < 0 ? `-bottom-${Math.abs(props.yb)}` : `bottom-${props.yb}`
        }`
      : '';

  return (
    <div
      className={`absolute z-50  ${top} ${right} ${bottom} ${left} bg-c-light p-4 rounded-2xl`}
      id="error-popup"
    >
      {/* <button
        className="absolute top-0 right-0  translate-x-[50%] translate-y-[-50%] p-small flex items-center justify-center bg-red-900 text-bg-c-dark rounded-full w-6 h-6"
        onClick={() => document.getElementById('error-popup')?.remove()}
      >
        X
      </button> */}
      <p className="p-small text-red-900">{formatError(props.error)}</p>
    </div>
  );
};

export default ErrorPopup;
