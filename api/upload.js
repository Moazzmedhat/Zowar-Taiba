import { put } from '@vercel/blob';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const filename = request.query.filename || `booking-${Date.now()}.pdf`;
        
        // Vercel routes file uploads in request streams. Read buffer from req
        const chunks = [];
        for await (const chunk of request) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Upload directly to Vercel Blob
        const blob = await put(filename, buffer, {
            access: 'public',
            contentType: 'application/pdf',
            token: process.env.BLOB_READ_WRITE_TOKEN // token injected from vercel dashboard env
        });

        return response.status(200).json(blob);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
