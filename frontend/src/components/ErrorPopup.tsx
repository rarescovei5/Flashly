const ErrorPopup = (props: { error: string }) => {
  if (props.error === '') return <></>;

  return (
    <div
      className="fixed right-4 bottom-4 bg-c-light p-4 rounded-2xl"
      id="error-popup"
    >
      <button
        className="absolute top-0 right-0  translate-x-[50%] translate-y-[-50%] p-small flex items-center justify-center bg-red-900 text-bg-c-dark rounded-full w-6 h-6"
        onClick={() => document.getElementById('error-popup')?.remove()}
      >
        X
      </button>
      <p className="p-small">
        Error: <span className="text-red-900 p-small">{props.error}</span>
      </p>
    </div>
  );
};

export default ErrorPopup;
