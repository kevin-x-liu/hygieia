/**
 * Landing Page Component - This is the main page rendered at the root route (/)
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-4">
      <h1 className="text-4xl font-bold text-zinc-900 mb-4">Hygieia - AI Personal Trainer and Nutritionist</h1>
      <p className="text-lg text-neutral-600 mb-8">Your personal health & fitness assistant</p>
      <div className="flex space-x-4">
        <a 
          href="/chat" 
          className="bg-green-700 text-white hover:bg-green-800 px-6 py-3 rounded-md font-medium"
        >
          Go to Chat
        </a>
        <a 
          href="/pantry" 
          className="bg-white text-zinc-900 hover:bg-neutral-100 px-6 py-3 rounded-md border border-neutral-200 font-medium"
        >
          Manage Pantry
        </a>
      </div>
    </main>
  );
}
