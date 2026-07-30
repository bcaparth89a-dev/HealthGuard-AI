console.log(Object.keys(process.env).filter(key => 
  key.includes("DB") || 
  key.includes("POSTGRES") || 
  key.includes("PASSWORD") || 
  key.includes("SUPABASE") || 
  key.includes("SECRET") || 
  key.includes("KEY")
).reduce((acc, key) => {
  acc[key] = process.env[key];
  return acc;
}, {}));
