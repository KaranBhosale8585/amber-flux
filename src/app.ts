import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as swaggerUi from 'swagger-ui-express';
import quoteRoutes from './routes/quote.routes';
import { requestIdMiddleware } from './middleware/request-id';
import { errorMiddleware } from './middleware/error';
import * as swaggerDocument from './utils/swagger.json';
import { db } from './db';
import { quoteRequests } from './db/schema';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Request ID to every request
app.use(requestIdMiddleware);

// Define custom morgan token for Request ID
morgan.token('req-id', (req: any) => req.requestId || 'unknown');
app.use(
  morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" [Req ID: :req-id]')
);

// Serve Swagger / OpenAPI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Quote APIs
app.use('/api/quotes', quoteRoutes);

// Error Middleware (must be registered last)
app.use(errorMiddleware);

// Helper function to auto-seed database if empty
export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const existing = await db.select().from(quoteRequests).limit(1);
    if (existing.length === 0) {
      console.log('Database is empty. Seeding sample quotes...');
      await db.insert(quoteRequests).values([
        {
          id: uuidv4(),
          customer: 'Globex Corporation',
          project: 'Eco-Friendly Headquarter Office',
          status: 'New',
          estimatedValue: 4500000.0,
        },
        {
          id: uuidv4(),
          customer: 'Wayne Enterprises',
          project: 'Subterranean Lab Renovation',
          status: 'In Review',
          estimatedValue: 9800000.0,
        },
        {
          id: uuidv4(),
          customer: 'Stark Industries',
          project: 'Arc Reactor Clean Energy Facility',
          status: 'Completed',
          estimatedValue: 15500000.0,
        },
        {
          id: uuidv4(),
          customer: 'Umbrella Corp',
          project: 'Secure Storage R&D Site B',
          status: 'Needs Info',
          estimatedValue: 2100000.0,
        },
      ]);
      console.log('Sample quotes seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export default app;
