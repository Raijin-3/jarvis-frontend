import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { GamificationProvider } from '@/components/gamification';
import { GamificationDashboard } from '@/components/gamification';

export default async function GamificationPage() {
  const supabase = supabaseServer();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Learning Journey</h1>
          <p className="text-gray-600 mt-2">
            Track your progress, complete challenges, and unlock achievements!
          </p>
        </div>

        <GamificationProvider userId={user.id}>
          <GamificationDashboard 
            onContinueLearning={() => {
              window.location.href = '/dashboard';
            }}
          />
        </GamificationProvider>
      </div>
    </div>
  );
}