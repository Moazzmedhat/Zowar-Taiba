import { put } from '@vercel/blob';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Check token presence
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        return response.status(500).json({ 
            error: 'Vercel environment variable BLOB_READ_WRITE_TOKEN is missing. Please add it to your project settings.' 
        });
    }

    try {
        const filename = request.query.filename || `booking-${Date.now()}.pdf`;
        
        let buffer;
        if (Buffer.isBuffer(request.body)) {
            buffer = request.body;
        } else if (typeof request.body === 'string') {
            buffer = Buffer.from(request.body, 'utf-8');
        } else if (request.body && typeof request.body === 'object') {
            // If body has been parsed, convert back to buffer or check if it has file data
            buffer = Buffer.from(JSON.stringify(request.body));
        } else {
            // Read from raw request stream
            const chunks = [];
            for await (const chunk of request) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
        }

        if (!buffer || buffer.length === 0) {
            return response.status(400).json({ error: 'Request body is empty' });
        }

        // Upload directly to Vercel Blob
        const blob = await put(filename, buffer, {
            access: 'public',
            contentType: 'application/pdf',
            token: token
        });
        return response.status(200).json(blob);
    } catch (error) {
        console.error("Vercel upload error:", error);
        return response.status(500).json({ error: error.message || 'Unknown server error during upload' });
    }
}

// Disable body parsing to preserve raw binary stream for Vercel Blob
export const config = {
    api: {
        bodyParser: false,
    },
};
