import { getSupabase } from './_supabase.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { type } = request.query;

        if (!type || !['drivers', 'cars'].includes(type)) {
            return response.status(400).json({ error: 'Invalid request. type must be "drivers" or "cars".' });
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(type)
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error(`Supabase error fetching ${type}:`, error);
            return response.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return response.status(200).json([]);
        }

        // Normalize data to standard camelCase for the frontend
        let normalized = [];
        if (type === 'drivers') {
            normalized = data.map(d => ({
                id: d.id,
                nationalId: d.nationalId || d.national_id || '',
                driverName: d.driverName || d.driver_name || '',
                mobile: d.mobile || ''
            }));
        } else if (type === 'cars') {
            normalized = data.map(c => ({
                id: c.id,
                plateNumber: c.plateNumber || c.plate_number || '',
                carModel: c.carModel || c.car_model || '',
                carColor: c.carColor || c.car_color || ''
            }));
        }

        return response.status(200).json(normalized);
    } catch (error) {
        console.error('get-data error:', error);
        return response.status(500).json({ error: error.message || 'Unknown server error' });
    }
}
