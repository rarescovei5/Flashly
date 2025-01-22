import { useParams } from 'react-router-dom';

const NotFound = () => {
  const params = useParams();
  return <div>{JSON.stringify(params)} - Not found page 404</div>;
};

export default NotFound;
