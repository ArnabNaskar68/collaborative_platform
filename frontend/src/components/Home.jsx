import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [name, setName] = useState('');
  const [roomid, setRoomid] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomid.trim()) {
      console.log('Name or RoomId is missing');
      return;
    }

    const Roomdata = {
      Name: name.trim(),
      RoomId: roomid.trim(),
    };

    // Navigate to /room and pass Roomdata via location.state
    navigate('/room', { state: Roomdata });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-6">
      <main className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Home Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your name and room id to join.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name:
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Id:
            </label>
            <input
              value={roomid}
              onChange={(e) => setRoomid(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Room ID"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-md transform hover:-translate-y-0.5 transition"
            >
              Submit
            </button>

            <button
              type="button"
              onClick={() => {
                setName('');
                setRoomid('');
              }}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an id?{' '}
          <button
            type="button"
            onClick={() =>
              setRoomid(Math.random().toString(36).slice(2, 9).toUpperCase())
            }
            className="text-indigo-600 font-medium hover:underline"
          >
            Generate one
          </button>
          .
        </p>
      </main>
    </div>
  );
}