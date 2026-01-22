import { useParams } from 'react-router-dom';

function Result() {
  const { sessionId } = useParams();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-3xl font-bold text-center">Result</h1>
        <p className="text-center text-gray-600">Session ID: {sessionId}</p>
      </div>
    </div>
  );
}

export default Result;
