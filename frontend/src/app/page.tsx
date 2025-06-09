// export default function HomePage() {
//   return (
//     <main className="p-4">
//       <h1 className="text-2xl font-bold">Welcome to MyMovieShelf</h1>
//       <p>Go to /login or /signup to start</p>
//     </main>
//   );
// }

'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white p-6">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          🎬 Welcome to <span className="text-red-500">MyMovieShelf</span>
        </h1>
        <p className="text-lg text-gray-300">
          Discover, review, and talk about your favorite movies.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-medium shadow-md"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="px-6 py-3 rounded-lg bg-white text-red-600 hover:bg-gray-100 transition font-medium shadow-md"
          >
            Sign Up
          </button>
        </div>
      </div>
    </main>
  );
}
