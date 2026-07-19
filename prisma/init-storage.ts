import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bbjpzaqxfvtonqwkyqpf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianB6YXF4ZnZ0b25xd2t5cXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQxMTQzNiwiZXhwIjoyMDk5OTg3NDM2fQ.chfG4WRLLE-64yUmtLdbP_geExvh9cguk5Fl07IXxMo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function initStorageBucket() {
  const bucketName = 'product-images';
  console.log(`Checking Supabase Storage bucket '${bucketName}'...`);

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
  }

  const existingBucket = buckets?.find((b) => b.name === bucketName);

  if (!existingBucket) {
    console.log(`Bucket '${bucketName}' does not exist. Creating...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (error) {
      console.error('Failed to create bucket:', error);
    } else {
      console.log('Bucket created successfully:', data);
    }
  } else {
    console.log(`Bucket '${bucketName}' already exists.`);
  }
}

initStorageBucket();
