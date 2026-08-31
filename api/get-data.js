import { list } from '@vercel/blob';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        return response.status(500).json({
            error: 'BLOB_READ_WRITE_TOKEN is missing from environment variables.'
        });
    }

    try {
        const { type } = request.query;

        if (!type || !['drivers', 'cars'].includes(type)) {
            return response.status(400).json({ error: 'Invalid request. type must be "drivers" or "cars".' });
        }

        const filename = `${type}.json`;

        // List blobs to find the one matching filename
        const { blobs } = await list({ token, prefix: filename });

        if (!blobs || blobs.length === 0) {
            // No blob found yet — return empty array so the app falls back to static JSON
            return response.status(200).json([]);
        }

        // Fetch the content of the blob
        const blobUrl = blobs[0].url;
        const blobResponse = await fetch(blobUrl);
        const data = await blobResponse.json();

        return response.status(200).json(data);
    } catch (error) {
        console.error('get-data error:', error);
        return response.status(500).json({ error: error.message || 'Unknown server error' });
    }
}
