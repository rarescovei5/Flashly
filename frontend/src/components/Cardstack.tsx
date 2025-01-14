const Cardstack = (props: { length: number; color: string }) => {
  let { color, length } = props;

  let colorMap: { [key: string]: string[] } = {
    'c-light': ['#212121', '#141414', '#070707'],
    'c-primary': ['#FBE87E', '#E1CF72', '#C7B666'],
    'c-blue': ['#1A87EC', '#1467B9', '#0F4786'],
    'c-green': ['#71F65A', '#5AC746', '#449832'],
    'c-orange': ['#FF7F3B', '#DB6F33', '#B75F2B'],
    'c-pink': ['#FD4798', '#D93C81', '#B4326B'],
  };

  const cardstack1 = (
    <div className="w-full  h-full rounded-2xl overflow-hidden">
      <div
        style={{ backgroundColor: colorMap[color][0] }}
        className={`w-full h-full`}
      ></div>
    </div>
  );
  const cardstack2 = (
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <div
        style={{ backgroundColor: colorMap[color][0] }}
        className={`w-[calc(100%-2rem)] h-full`}
      ></div>
      <div
        style={{ backgroundColor: colorMap[color][1] }}
        className={`w-full h-full`}
      ></div>
    </div>
  );
  const cardstack3 = (
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <div
        style={{ backgroundColor: colorMap[color][0] }}
        className={`w-[calc(100%-4rem)] h-full`}
      ></div>
      <div
        style={{ backgroundColor: colorMap[color][1] }}
        className={`w-[calc(100%-2rem)] h-full`}
      ></div>
      <div
        style={{ backgroundColor: colorMap[color][2] }}
        className={`w-full h-full`}
      ></div>
    </div>
  );

  switch (length) {
    case 1:
      return cardstack1;
    case 2:
      return cardstack2;
    case 3:
      return cardstack3;
    default:
      return cardstack1;
  }
};

export default Cardstack;
