import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <>
      <Navbar />
      <div className="flex justify-end flex-col flex-1  mx-auto overflow-y-auto">
        <img className="h-[90%]" src="/home.png" alt="" />
      </div>
    </>
  );
};

export default Home;
