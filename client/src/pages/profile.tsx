import { withAuth } from '@/components/auth/withAuth';
import { UserProfile } from '@/components/auth/UserProfile';

function ProfilePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <UserProfile />
      </div>
    </div>
  );
}

export default withAuth(ProfilePage, { requireAuth: true }); 