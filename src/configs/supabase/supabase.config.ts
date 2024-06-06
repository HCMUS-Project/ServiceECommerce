/**
 * @description Supabase configuration
 */

export default () => ({
    supabaseUrl: process.env.NEST_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEST_PUBLIC_SUPABASE_ANON_KEY,
});
