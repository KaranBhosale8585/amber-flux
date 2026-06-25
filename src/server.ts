import app, { seedDatabaseIfEmpty } from './app';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Run seed routine if database is empty (depends on migrations having run)
    await seedDatabaseIfEmpty();

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
