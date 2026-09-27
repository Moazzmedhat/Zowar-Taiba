import { getSupabase } from './_supabase.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const supabase = getSupabase();
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'trip-pdfs';
        const filename = request.query.filename || `booking-${Date.now()}.pdf`;

        // Read binary data from request stream
        let buffer;
        if (Buffer.isBuffer(request.body)) {
            buffer = request.body;
        } else if (typeof request.body === 'string') {
            buffer = Buffer.from(request.body, 'utf-8');
        } else if (request.body && typeof request.body === 'object') {
            buffer = Buffer.from(JSON.stringify(request.body));
        } else {
            const chunks = [];
            for await (const chunk of request) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
        }

        if (!buffer || buffer.length === 0) {
            return response.status(400).json({ error: 'Request body is empty' });
        }

        // Try ensuring bucket exists (works if service role key has admin rights)
        try {
            const { data: buckets } = await supabase.storage.listBuckets();
            if (!buckets || !buckets.some(b => b.name === bucketName)) {
                await supabase.storage.createBucket(bucketName, { public: true });
            }
        } catch (bucketErr) {
            // Non-fatal if bucket already exists or anon key lacks bucket creation permissions
            console.warn('Note on bucket check:', bucketErr.message);
        }

        // Upload PDF to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filename, buffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (error) {
            console.error('Supabase storage upload error:', error);
            return response.status(500).json({ error: `Supabase upload error: ${error.message}` });
        }

        // Retrieve public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filename);

        if (!publicUrlData || !publicUrlData.publicUrl) {
            return response.status(500).json({ error: 'Failed to retrieve public URL for uploaded PDF.' });
        }

        return response.status(200).json({
            success: true,
            url: publicUrlData.publicUrl,
            path: data?.path || filename
        });
    } catch (error) {
        console.error('Upload handler error:', error);
        return response.status(500).json({ error: error.message || 'Unknown server error during upload' });
    }
}

// Preserve raw binary body
export const config = {
    api: {
        bodyParser: false,
    },
};
