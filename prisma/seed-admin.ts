import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bbjpzaqxfvtonqwkyqpf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianB6YXF4ZnZ0b25xd2t5cXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQxMTQzNiwiZXhwIjoyMDk5OTg3NDM2fQ.chfG4WRLLE-64yUmtLdbP_geExvh9cguk5Fl07IXxMo';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = 'growxlabstech@gmail.com';
  const simplePassword = 'admin123';

  console.log(`Setting up user ${email} with password: ${simplePassword}`);

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError);
  }

  let userId: string;

  const existingUser = users?.users?.find((u) => u.email === email);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`User ${email} found (${userId}). Resetting password...`);
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: simplePassword,
        email_confirm: true,
        user_metadata: { role: 'ADMIN', full_name: 'Growx Labs' },
      }
    );

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return;
    }
    console.log('Password reset to:', simplePassword);
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: simplePassword,
      email_confirm: true,
      user_metadata: { role: 'ADMIN', full_name: 'Growx Labs' },
    });

    if (createError || !newUser.user) {
      console.error('Failed to create user:', createError);
      return;
    }
    userId = newUser.user.id;
    console.log('Created user with ID:', userId);
  }

  try {
    await prisma.profile.upsert({
      where: { id: userId },
      update: {
        email: email,
        fullName: 'Growx Labs',
        storeName: 'PVS Retail Supermarket',
      },
      create: {
        id: userId,
        email: email,
        fullName: 'Growx Labs',
        storeName: 'PVS Retail Supermarket',
      },
    });
    console.log('Profile record created successfully in public.profiles table!');
  } catch (err) {
    console.error('Profile upsert error:', err);
  }
}

createAdminUser()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
