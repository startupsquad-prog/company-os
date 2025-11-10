import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

/**
 * POST /api/users/create
 * Create a new user in Clerk and create their profile in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId: currentUserId } = await auth()
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      phoneNumber,
      password,
      skipPasswordChecks = false,
      skipPasswordRequirement = false,
      publicMetadata,
      privateMetadata,
      unsafeMetadata,
      departmentId,
      roleIds,
    } = body

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Create user in Clerk
    let clerkUser
    try {
      const createUserParams: any = {
        emailAddress: [email],
        firstName,
        lastName,
        skipPasswordChecks,
        skipPasswordRequirement,
        publicMetadata: publicMetadata || {},
        privateMetadata: privateMetadata || {},
        unsafeMetadata: unsafeMetadata || {},
      }

      if (phoneNumber) {
        createUserParams.phoneNumber = [phoneNumber]
      }

      if (password) {
        createUserParams.password = password
      }

      clerkUser = await clerkClient.users.createUser(createUserParams)
    } catch (clerkError: any) {
      console.error('Error creating user in Clerk:', clerkError)
      return NextResponse.json(
        {
          error: 'Failed to create user in Clerk',
          details: clerkError?.errors?.[0]?.message || clerkError?.message || 'Unknown error',
        },
        { status: 400 }
      )
    }

    if (!clerkUser?.id) {
      return NextResponse.json(
        { error: 'Failed to create user in Clerk' },
        { status: 500 }
      )
    }

    // Create profile in Supabase
    const supabase = await createServerClient()
    
    // Ensure profile exists (this RPC handles creation if needed)
    const { data: profile, error: profileError } = await supabase.rpc('ensure_profile', {
      p_user_id: clerkUser.id,
      p_email: email,
    })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // User is created in Clerk, but profile creation failed
      // We should still return success but log the error
      // The profile will be created on first login via ensure_profile
    }

    // Update profile with additional fields if profile was created
    if (profile?.id) {
      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString(),
      }

      if (phoneNumber) {
        updateData.phone = phoneNumber
      }

      if (departmentId) {
        updateData.department_id = departmentId
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
      }
    }

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      const roleBindings = roleIds.map((roleId: string) => ({
        user_id: clerkUser.id,
        role_id: roleId,
        created_by: currentUserId,
      }))

      const { error: roleError } = await supabase
        .from('user_role_bindings')
        .upsert(roleBindings, {
          onConflict: 'user_id,role_id',
        })

      if (roleError) {
        console.error('Error assigning roles:', roleError)
        // Non-fatal error, user is created but roles might not be assigned
      }
    }

    // Update department if provided
    if (departmentId && profile?.id) {
      const { error: deptError } = await supabase
        .from('profiles')
        .update({ department_id: departmentId })
        .eq('id', profile.id)

      if (deptError) {
        console.error('Error updating department:', deptError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileId: profile?.id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

