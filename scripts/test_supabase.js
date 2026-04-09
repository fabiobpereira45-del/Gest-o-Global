async function test() {
    const url = "https://vevivqcluyutlatwsnjh.supabase.co/rest/v1/classes?select=*";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldml2cWNsdXl1dGxhdHdzbmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU2MTgsImV4cCI6MjA5MTIzMTYxOH0.te2bkSjxjU5ZQ5tzGPAInKaHjc--KX4lOL_M1vgYlNg";
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
