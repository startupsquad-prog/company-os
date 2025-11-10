'use client'

import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugUserPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const [profileData, setProfileData] = useState<any>(null)
  const [rolesData, setRolesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!isLoaded || !clerkUser) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', clerkUser.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError)
        }

        setProfileData({ profile, profileError })

        // Get roles
        const { data: roles, error: rolesError } = await supabase.rpc('get_user_roles', {
          p_user_id: clerkUser.id,
        })

        setRolesData({ roles, rolesError })
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isLoaded, clerkUser])

  const handleUpdateUserId = async () => {
    if (!clerkUser) return

    try {
      const supabase = createClient()
      
      // Find profile by email
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', clerkUser.emailAddresses[0]?.emailAddress || '')
        .single()

      if (profileByEmail && profileByEmail.user_id !== clerkUser.id) {
        // Update user_id to match Clerk ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_id: clerkUser.id })
          .eq('id', profileByEmail.id)

        if (updateError) {
          console.error('Update error:', updateError)
          alert('Failed to update: ' + updateError.message)
        } else {
          alert('Profile user_id updated successfully! Please refresh the page.')
          window.location.reload()
        }
      } else {
        alert('Profile user_id already matches or profile not found')
      }
    } catch (error) {
      console.error('Error updating:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>
  }

  if (!clerkUser) {
    return <div className="p-8">Not authenticated</div>
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">User Debug Information</h1>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
        <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Clerk User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Clerk User ID:</strong> <code className="bg-muted px-2 py-1 rounded">{clerkUser.id}</code></p>
            <p><strong>Email:</strong> {clerkUser.emailAddresses[0]?.emailAddress}</p>
            <p><strong>Name:</strong> {clerkUser.fullName || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>From core.profiles table</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : profileData?.profileError ? (
              <div className="space-y-2">
                <p className="text-destructive">Error: {profileData.profileError.message}</p>
                <p className="text-sm text-muted-foreground">
                  Profile not found with user_id matching Clerk ID. The profile might have a different user_id.
                </p>
                <Button onClick={handleUpdateUserId}>Update Profile user_id to Match Clerk ID</Button>
              </div>
            ) : profileData?.profile ? (
              <div className="space-y-2">
                <p><strong>Profile ID:</strong> <code className="bg-muted px-2 py-1 rounded">{profileData.profile.id}</code></p>
                <p><strong>Profile user_id:</strong> <code className="bg-muted px-2 py-1 rounded">{profileData.profile.user_id}</code></p>
                <p><strong>Email:</strong> {profileData.profile.email}</p>
                <p><strong>Name:</strong> {profileData.profile.first_name} {profileData.profile.last_name}</p>
                {profileData.profile.user_id !== clerkUser.id && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 font-semibold mb-2">⚠️ Mismatch Detected!</p>
                    <p className="text-sm text-yellow-700 mb-2">
                      Profile user_id ({profileData.profile.user_id}) does not match Clerk user ID ({clerkUser.id})
                    </p>
                    <Button onClick={handleUpdateUserId} variant="outline">
                      Update Profile user_id to Match Clerk ID
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p>No profile found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles Information</CardTitle>
            <CardDescription>From get_user_roles RPC</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : rolesData?.rolesError ? (
              <div className="space-y-2">
                <p className="text-destructive">Error: {rolesData.rolesError.message}</p>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(rolesData.rolesError, null, 2)}
                </pre>
              </div>
            ) : rolesData?.roles ? (
              <div className="space-y-2">
                <p><strong>Roles:</strong></p>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(rolesData.roles, null, 2)}
                </pre>
                {rolesData.roles.length === 0 && (
                  <p className="text-muted-foreground">No roles assigned</p>
                )}
              </div>
            ) : (
              <p>No roles data</p>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}

