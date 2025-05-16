'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUser } from '../../../../../../functions/src'; // Adjust the import path as necessary

interface UserData {
  uid: string;
  email: string | null;
  // Add other user properties you want to edit
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<UserData>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await getUser({ data: { uid: userId } });
        const dummyUser: UserData = result.data as UserData; // Assuming the function returns UserData structure
        setUser(dummyUser);
        setFormData(dummyUser);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Handle error, maybe redirect or show an error message
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement actual updating of user data using Firebase Admin SDK
      console.log('Updating user with data:', formData);
      // After successful update, redirect back to the user list
      router.push('/admin/users');
    } catch (error) {
      console.error('Error updating user data:', error);
      // Handle error
    }
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Edit User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="uid">User ID</Label>
          <Input id="uid" value={user.uid} disabled />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
          />
        </div>
        {/* Add other fields for editing */}
        <Button type="submit">Save Changes</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/users')} className="ml-2">
          Cancel
        </Button>
      </form>
    </div>
  );
}