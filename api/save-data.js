import { put } from '@vercel/blob';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        return response.status(500).json({
            error: 'BLOB_READ_WRITE_TOKEN is missing from environment variables.'
        });
    }

    try {
        const { type, data } = request.body;

        if (!type || !data || !['drivers', 'cars'].includes(type)) {
            return response.status(400).json({ error: 'Invalid request. type must be "drivers" or "cars".' });
        }

        const filename = `${type}.json`;
        const content = JSON.stringify(data, null, 2);
        const buffer = Buffer.from(content, 'utf-8');

        // Use addRandomSuffix: false so we always overwrite the same file
        const blob = await put(filename, buffer, {
            access: 'public',
            contentType: 'application/json',
            token: token,
            addRandomSuffix: false
        });

        return response.status(200).json({ success: true, url: blob.url });
    } catch (error) {
        console.error('save-data error:', error);
        return response.status(500).json({ error: error.message || 'Unknown server error' });
    }
}

export const config = {
    api: {
        bodyParser: true,
    },
};
