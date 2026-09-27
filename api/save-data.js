import { getSupabase } from './_supabase.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { type, data } = request.body || {};

        if (!type || !Array.isArray(data) || !['drivers', 'cars'].includes(type)) {
            return response.status(400).json({ error: 'Invalid request. "type" must be "drivers" or "cars", and "data" must be an array.' });
        }

        const supabase = getSupabase();

        if (type === 'drivers') {
            const rows = data.map(d => ({
                national_id: String(d.nationalId || d.national_id || '').trim(),
                driver_name: String(d.driverName || d.driver_name || '').trim(),
                mobile: String(d.mobile || '').trim()
            }));

            // Clear previous rows to keep database strictly in sync
            const { error: delError } = await supabase
                .from('drivers')
                .delete()
                .not('id', 'is', null);

            if (delError) {
                console.error('Error clearing drivers:', delError);
                return response.status(500).json({ error: delError.message });
            }

            if (rows.length > 0) {
                const { error: insError } = await supabase
                    .from('drivers')
                    .insert(rows);

                if (insError) {
                    console.error('Error inserting drivers:', insError);
                    return response.status(500).json({ error: insError.message });
                }
            }
        } else if (type === 'cars') {
            const rows = data.map(c => ({
                plate_number: String(c.plateNumber || c.plate_number || '').trim(),
                car_model: String(c.carModel || c.car_model || '').trim(),
                car_color: String(c.carColor || c.car_color || '').trim()
            }));

            // Clear previous rows to keep database strictly in sync
            const { error: delError } = await supabase
                .from('cars')
                .delete()
                .not('id', 'is', null);

            if (delError) {
                console.error('Error clearing cars:', delError);
                return response.status(500).json({ error: delError.message });
            }

            if (rows.length > 0) {
                const { error: insError } = await supabase
                    .from('cars')
                    .insert(rows);

                if (insError) {
                    console.error('Error inserting cars:', insError);
                    return response.status(500).json({ error: insError.message });
                }
            }
        }

        return response.status(200).json({ success: true, count: data.length });
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
